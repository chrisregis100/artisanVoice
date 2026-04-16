import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyFedaPayPayment, verifyFedaPayWebhookSignature } from "@/lib/payment/fedapay";

interface FedaPayWebhookPayload {
  name: string;
  object: string;
  data: {
    object: {
      id: number;
      klass: string;
      reference: string;
      amount: number;
      status: string;
      metadata: {
        user_id?: string;
        plan_id?: string;
      } | null;
      customer?: {
        id: number;
        email: string;
        firstname: string;
        lastname: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-fedapay-signature") ?? "";

  if (!verifyFedaPayWebhookSignature(rawBody, signature)) {
    return NextResponse.json(
      { error: "Requête invalide" },
      { status: 400 },
    );
  }

  let payload: FedaPayWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Corps invalide" },
      { status: 400 },
    );
  }

  const isApprovalEvent =
    payload.name === "transaction.approved" ||
    payload.name === "transaction.payment.created";

  if (!isApprovalEvent) {
    return NextResponse.json({ received: true });
  }

  const transaction = payload.data?.object;

  if (!transaction || transaction.status !== "approved") {
    return NextResponse.json({ received: true });
  }

  const verification = await verifyFedaPayPayment(String(transaction.id));

  if (!verification.success) {
    console.error("FedaPay payment verification failed for ref:", transaction.reference);
    return NextResponse.json({ received: true });
  }

  const userId = transaction.metadata?.user_id;
  const planId = transaction.metadata?.plan_id;

  if (!userId || !planId) {
    console.error("Missing metadata in FedaPay webhook:", transaction.reference);
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
