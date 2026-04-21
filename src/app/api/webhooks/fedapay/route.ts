import { fedapayWebhookSchema } from "@/lib/api/schemas";
import {
  verifyFedaPayPayment,
  verifyFedaPayWebhookSignature,
} from "@/lib/payment/fedapay";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature") ?? "";

  if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const payloadResult = fedapayWebhookSchema.safeParse(parsedJson);
  if (!payloadResult.success) {
    console.error(
      "Invalid FedaPay webhook payload:",
      payloadResult.error.flatten(),
    );
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { name, data } = payloadResult.data;

  const isApprovalEvent =
    name === "transaction.approved" || name === "transaction.payment.created";

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
    console.error(
      "Missing metadata in FedaPay webhook:",
      transaction.reference,
    );
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();
  const { data: planRow } = await admin
    .from("plans")
    .select("price_amount")
    .eq("id", planId)
    .maybeSingle();

  if (planRow?.price_amount == null) {
    console.error("FedaPay webhook: plan not found", planId);
    return NextResponse.json({ received: true });
  }

  const verification = await verifyFedaPayPayment(String(transaction.id), {
    minimumAmount: planRow.price_amount,
  });

  if (!verification.success) {
    console.error(
      "FedaPay payment verification failed for ref:",
      transaction.reference,
    );
    return NextResponse.json({ received: true });
  }

  const supabase = await createClient();

  const periodStart = new Date();
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existingSubscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .single();

  if (existingSubscription) {
    await supabase
      .from("subscriptions")
      .update({
        plan_id: planId,
        payment_provider: "fedapay",
        payment_reference: transaction.reference,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        status: "active",
      })
      .eq("id", existingSubscription.id);
  } else {
    await supabase.from("subscriptions").insert({
      user_id: userId,
      plan_id: planId,
      status: "active",
      payment_provider: "fedapay",
      payment_reference: transaction.reference,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
