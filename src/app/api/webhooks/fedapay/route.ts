import { NextRequest, NextResponse } from "next/server";
import { verifyFedaPayWebhookSignature } from "@/lib/payment/fedapay";
import { fedapayWebhookSchema } from "@/lib/api/schemas";
import { getPackAdmin } from "@/lib/credits/packs";
import { grantCredits } from "@/lib/credits/grant";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature") ?? "";

  if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
    if (!process.env.FEDAPAY_WEBHOOK_SECRET) {
      console.error(
        "[FedaPay Webhook] FEDAPAY_WEBHOOK_SECRET is not configured — all webhooks will be rejected.",
      );
    }
    return NextResponse.json(
      { error: "Signature invalide" },
      { status: 401 },
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const payloadResult = fedapayWebhookSchema.safeParse(parsedJson);
  if (!payloadResult.success) {
    console.error("Invalid FedaPay webhook payload:", payloadResult.error.flatten());
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { name, data } = payloadResult.data;

  const isApprovalEvent =
    name === "transaction.approved" ||
    name === "transaction.transferred" ||
    name === "transaction.payment.created";

  if (!isApprovalEvent) {
    return NextResponse.json({ received: true });
  }

  const transaction = data.object;

  const isApprovedStatus =
    transaction?.status === "approved" ||
    transaction?.status === "transferred";

  if (!transaction || !isApprovedStatus) {
    return NextResponse.json({ received: true });
  }

  const txMeta = transaction.metadata ?? {};
  const userId = txMeta.user_id;
  const packSlug = txMeta.pack_slug;
  const kind = txMeta.kind;

  // Legacy subscription webhooks (no kind field) or unknown kinds — ignore gracefully
  if (kind !== "credit_purchase") {
    console.warn(
      `FedaPay webhook: unexpected kind="${kind ?? "undefined"}" for ref ${transaction.reference} — skipping`,
    );
    return NextResponse.json({ received: true });
  }

  // packId is intentionally NOT required here: it can be derived from the DB pack lookup.
  // Requiring it caused silent 200-acks (no retry) when metadata was partially missing.
  if (!userId || !packSlug) {
    console.error(
      "FedaPay webhook: missing required metadata fields for credit_purchase",
      { ref: transaction.reference, userId, packSlug },
    );
    // Return 200: without userId/packSlug we cannot recover regardless of retries.
    return NextResponse.json({ received: true });
  }

  const pack = await getPackAdmin(packSlug);
  if (!pack) {
    console.error("[FedaPay Webhook] Pack not found", { packSlug, transactionRef: transaction.reference });
    // Return 500 so FedaPay retries — a missing pack slug is unexpected and
    // could be a transient DB issue rather than a permanent misconfiguration.
    return NextResponse.json(
      { error: "Pack introuvable — réessai attendu" },
      { status: 500 },
    );
  }

  const transactionId = String(transaction.id);
  const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

  try {
    await grantCredits({
      userId,
      amount: creditsToGrant,
      kind: "purchase",
      packId: pack.id, // use DB value — resilient to missing pack_id in metadata
      paymentProvider: "fedapay",
      paymentReference: transactionId,
      metadata: { pack_slug: packSlug },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // UNIQUE constraint violation means the webhook was already processed — idempotent, acknowledge
    if (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("already") ||
      message.includes("23505")
    ) {
      return NextResponse.json({ received: true });
    }
    // Real error: return 500 so FedaPay retries the webhook delivery
    console.error("[FedaPay Webhook] grantCredits failed — will retry", {
      userId,
      transactionId,
      packSlug,
      error: message,
    });
    return NextResponse.json(
      { error: "Erreur interne — réessai attendu" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
