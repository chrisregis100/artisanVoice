import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  userId: z.string().uuid("userId doit être un UUID valide."),
});

export interface AdminUserWalletResponse {
  balance: number;
  hasPurchased: boolean;
  lifetimePurchased: number;
  lastPurchaseAt: string | null;
  transactions: AdminUserTransaction[];
}

export interface AdminUserTransaction {
  id: string;
  kind: string;
  delta: number;
  balanceAfter: number;
  paymentProvider: string | null;
  paymentReference: string | null;
  createdAt: string;
}

export async function GET(request: NextRequest) {
  const check = await requireAdmin(request);
  if (!check.ok) return check.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ userId: searchParams.get("userId") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "userId invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;
  const admin = createAdminClient();

  const [walletResult, txResult, purchaseAggResult] = await Promise.all([
    admin
      .from("credit_wallets")
      .select("balance, has_purchased")
      .eq("user_id", userId)
      .single(),

    admin
      .from("credit_transactions")
      .select(
        "id, kind, delta, balance_after, payment_provider, payment_reference, created_at",
      )
      .eq("user_id", userId)
      .neq("kind", "migration")
      .order("created_at", { ascending: false })
      .limit(10),

    admin
      .from("credit_transactions")
      .select("delta, created_at")
      .eq("user_id", userId)
      .eq("kind", "purchase")
      .order("created_at", { ascending: false }),
  ]);

  if (walletResult.error || !walletResult.data) {
    return NextResponse.json(
      { error: "Wallet introuvable pour cet utilisateur." },
      { status: 404 },
    );
  }

  if (txResult.error) {
    console.error("admin wallet transactions error:", txResult.error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des transactions." },
      { status: 500 },
    );
  }

  const purchases = purchaseAggResult.data ?? [];
  const lifetimePurchased = purchases.reduce((sum, tx) => sum + tx.delta, 0);
  const lastPurchaseAt = purchases[0]?.created_at ?? null;

  const response: AdminUserWalletResponse = {
    balance: walletResult.data.balance,
    hasPurchased: walletResult.data.has_purchased,
    lifetimePurchased,
    lastPurchaseAt,
    transactions: (txResult.data ?? []).map((tx) => ({
      id: tx.id,
      kind: tx.kind,
      delta: tx.delta,
      balanceAfter: tx.balance_after,
      paymentProvider: tx.payment_provider,
      paymentReference: tx.payment_reference,
      createdAt: tx.created_at,
    })),
  };

  return NextResponse.json(response);
}
