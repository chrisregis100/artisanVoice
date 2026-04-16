import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyFlutterwavePayment, verifyFlutterwaveWebhookHash } from "@/lib/payment/flutterwave";
import { flutterwaveWebhookSchema } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("verif-hash") ?? "";

  if (!verifyFlutterwaveWebhookHash(rawBody, signature)) {
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

  const payloadResult = flutterwaveWebhookSchema.safeParse(parsedJson);
  if (!payloadResult.success) {
    console.error("Invalid Flutterwave webhook payload:", payloadResult.error.flatten());
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { event, data: paymentData } = payloadResult.data;

  if (event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  if (paymentData.status !== "successful") {
    return NextResponse.json({ received: true });
  }

  const verification = await verifyFlutterwavePayment(
    String(paymentData.id),
  );

  if (!verification.success) {
    console.error("Flutterwave payment verification failed for tx:", paymentData.tx_ref);
    return NextResponse.json({ received: true });
  }

  const userId = paymentData.meta?.user_id;
  const planId = paymentData.meta?.plan_id;

  if (!userId || !planId) {
    console.error("Missing metadata in Flutterwave webhook:", paymentData.tx_ref);
    return NextResponse.json({ received: true });
  }

  const supabase = createClient();

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
        payment_provider: "flutterwave",
        payment_reference: paymentData.tx_ref,
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
      payment_provider: "flutterwave",
      payment_reference: paymentData.tx_ref,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }

  return NextResponse.json({ received: true });
}
