import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";

/**
 * Compatibility shim for the credit model.
 * Returns a SubscriptionStatusPayload-shaped response sourced from the
 * credit_wallets table so that components still reading this endpoint
 * (e.g. useSubscriptionStatus / voice-button) keep working without changes.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", user.id)
    .maybeSingle();

  const balance = wallet?.balance ?? 0;

  return NextResponse.json({
    hasSubscription: true,
    plan: {
      name: "credits",
      displayName: "Crédits",
      priceAmount: 0,
      currency: null,
      invoiceLimit: null,
      features: [],
    },
    subscription: null,
    usage: {
      count: 0,
      limit: null,
    },
    balance,
  });
}
