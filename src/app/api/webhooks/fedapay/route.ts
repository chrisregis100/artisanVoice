import { NextRequest, NextResponse } from "next/server";
import { verifyFedaPayWebhookSignature } from "@/lib/payment/fedapay";
import { fedapayWebhookSchema } from "@/lib/api/schemas";
import { getPack } from "@/lib/credits/packs";
import { grantCredits } from "@/lib/credits/grant";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature") ?? "";

  if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
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

  const { user_id: userId, pack_id: packId, pack_slug: packSlug, kind } =
    transaction.metadata ?? {};

  // Legacy subscription webhooks (no kind field) or unknown kinds — ignore gracefully
  if (kind !== "credit_purchase") {
    console.warn(
      `FedaPay webhook: unexpected kind="${kind ?? "undefined"}" for ref ${transaction.reference} — skipping`,
    );
    return NextResponse.json({ received: true });
  }

  if (!userId || !packSlug || !packId) {
    console.error(
      "FedaPay webhook: missing metadata fields for credit_purchase",
      { ref: transaction.reference, userId, packSlug, packId },
    );
    return NextResponse.json({ received: true });
  }

  const pack = await getPack(packSlug);
  if (!pack) {
    console.error("FedaPay webhook: pack not found", { packSlug });
    return NextResponse.json({ received: true });
  }

  const transactionId = String(transaction.id);
  const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

  try {
    await grantCredits({
      userId,
      amount: creditsToGrant,
      kind: "purchase",
      packId,
      paymentProvider: "fedapay",
      paymentReference: transactionId,
      metadata: { pack_slug: packSlug },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // UNIQUE constraint violation means the webhook was already processed — idempotent
    if (message.includes("unique") || message.includes("duplicate") || message.includes("already")) {
      return NextResponse.json({ received: true });
    }
    console.error("FedaPay webhook: grantCredits failed", { userId, transactionId, error: message });
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
