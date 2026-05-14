import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/api/auth";
import { fetchFedaPayTransaction } from "@/lib/payment/fedapay";
import { getPack } from "@/lib/credits/packs";
import { grantCredits } from "@/lib/credits/grant";

const bodySchema = z.object({
  transactionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "transactionId requis.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { transactionId } = parsed.data;

  let tx: Awaited<ReturnType<typeof fetchFedaPayTransaction>>;
  try {
    tx = await fetchFedaPayTransaction(transactionId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("verify-purchase: fetchFedaPayTransaction failed", { transactionId, error: message });
    return NextResponse.json({ success: false, status: "error" }, { status: 502 });
  }

  const isApproved = tx.status === "approved" || tx.status === "transferred";

  if (!isApproved) {
    return NextResponse.json({ success: false, status: tx.status });
  }

  // Security: the transaction must belong to the authenticated user
  const txUserId = tx.metadata?.user_id;
  if (!txUserId || txUserId !== user.id) {
    return NextResponse.json({ success: false, status: "unauthorized" }, { status: 403 });
  }

  const packSlug = tx.metadata?.pack_slug;
  const packId = tx.metadata?.pack_id;
  const kind = tx.metadata?.kind;

  if (kind !== "credit_purchase" || !packSlug || !packId) {
    return NextResponse.json({ success: false, status: "not_a_credit_purchase" });
  }

  const pack = await getPack(packSlug);
  if (!pack) {
    console.error("verify-purchase: pack not found", { packSlug });
    return NextResponse.json({ success: false, status: "pack_not_found" });
  }

  const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

  try {
    await grantCredits({
      userId: user.id,
      amount: creditsToGrant,
      kind: "purchase",
      packId,
      paymentProvider: "fedapay",
      paymentReference: String(tx.id),
      metadata: { pack_slug: packSlug },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // UNIQUE constraint violation → webhook already processed this payment, treat as success
    if (message.includes("unique") || message.includes("duplicate") || message.includes("already")) {
      return NextResponse.json({ success: true, creditsGranted: creditsToGrant });
    }
    console.error("verify-purchase: grantCredits failed", { userId: user.id, transactionId, error: message });
    return NextResponse.json({ success: false, status: "grant_failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, creditsGranted: creditsToGrant });
}
