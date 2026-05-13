import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyFedaPayPayment, verifyFedaPayWebhookSignature } from "@/lib/payment/fedapay";
import { fedapayWebhookSchema } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature") ?? "";

  if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Requête invalide" },
      { status: 400 },
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
    name === "transaction.payment.created";

  if (!isApprovalEvent) {
    return NextResponse.json({ received: true });
  }

  const transaction = data.object;

  if (!transaction || transaction.status !== "approved") {
    return NextResponse.json({ received: true });
  }

  const userId = transaction.metadata?.user_id;
  const planId = transaction.metadata?.plan_id;

  if (!userId || !planId) {
    console.error("Missing metadata in FedaPay webhook:", transaction.reference);
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  const { data: planRow, error: planError } = await admin
    .from("plans")
    .select("id, interval, price_amount, tier, currency")
    .eq("id", planId)
    .maybeSingle();

  if (planError || planRow?.price_amount == null) {
    console.error("FedaPay webhook: plan not found", planId, planError);
    return NextResponse.json({ received: true });
  }

  const verification = await verifyFedaPayPayment(String(transaction.id), {
    minimumAmount: planRow.price_amount,
  });

  if (!verification.success) {
    console.error("FedaPay payment verification failed for ref:", transaction.reference);
    return NextResponse.json({ received: true });
  }

  const transactionId = String(transaction.id);

  // Idempotency: skip if this transaction was already processed
  const { data: existingByRef, error: idempotencyError } = await admin
    .from("subscriptions")
    .select("id")
    .eq("payment_reference", transactionId)
    .eq("payment_provider", "fedapay")
    .maybeSingle();

  if (idempotencyError) {
    console.error("FedaPay webhook: idempotency check failed", { userId, transactionId, error: idempotencyError });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  if (existingByRef) {
    return NextResponse.json({ received: true });
  }

  // Calculate period end based on plan interval
  const periodStart = new Date();
  let periodEnd: Date | null = new Date(periodStart);

  if (planRow.interval === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else if (planRow.interval === "lifetime") {
    periodEnd = null;
  } else {
    // monthly (default)
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Cancel any other active subscriptions for this user before inserting the new one
  const { error: cancelError } = await admin
    .from("subscriptions")
    .update({ status: "cancelled" })
    .eq("user_id", userId)
    .eq("status", "active");

  if (cancelError) {
    console.error("FedaPay webhook: failed to cancel previous subscriptions", { userId, transactionId, error: cancelError });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  const { error: insertError } = await admin.from("subscriptions").insert({
    user_id: userId,
    plan_id: planId,
    status: "active",
    payment_provider: "fedapay",
    payment_reference: transactionId,
    current_period_start: periodStart.toISOString(),
    current_period_end: periodEnd ? periodEnd.toISOString() : null,
  });

  if (insertError) {
    console.error("FedaPay webhook: failed to insert subscription", { userId, planId, transactionId, error: insertError });
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
