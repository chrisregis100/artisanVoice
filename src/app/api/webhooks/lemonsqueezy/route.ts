import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { lemonsqueezyWebhookSchema } from "@/lib/api/schemas";
import { createHmac, timingSafeEqual } from "crypto";

function verifyLemonSqueezySignature(rawBody: string, signature: string): boolean {
  const secret = env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  const hmac = createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const payloadResult = lemonsqueezyWebhookSchema.safeParse(parsedJson);
  if (!payloadResult.success) {
    console.error("Invalid Lemon Squeezy webhook payload:", payloadResult.error.flatten());
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { meta, data } = payloadResult.data;
  const eventName = meta.event_name;

  const userId = meta.custom_data?.user_id;
  const planName = meta.custom_data?.plan_name;

  if (!userId || !planName) {
    console.error("Missing custom_data in Lemon Squeezy webhook:", eventName);
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  if (eventName === "order_created" || eventName === "subscription_created") {
    const { data: planRow, error: planError } = await admin
      .from("plans")
      .select("id")
      .eq("name", planName)
      .eq("is_active", true)
      .maybeSingle();

    if (planError || !planRow) {
      console.error("Lemon Squeezy webhook: plan not found", planName, planError);
      return NextResponse.json({ received: true });
    }

    const subscriptionId = String(data.id);
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);

    // Annual plans have 12-month periods, monthly plans have 1-month periods
    const isAnnual = planName.includes("annual");
    if (isAnnual) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const { data: existingSubscription } = await admin
      .from("subscriptions")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (existingSubscription) {
      const { error: updateError } = await admin
        .from("subscriptions")
        .update({
          plan_id: planRow.id,
          payment_provider: "lemonsqueezy",
          payment_reference: subscriptionId,
          current_period_start: periodStart.toISOString(),
          current_period_end: periodEnd.toISOString(),
          status: "active",
        })
        .eq("id", existingSubscription.id);

      if (updateError) {
        console.error("Failed to update subscription for LS event:", updateError);
      }
    } else {
      const { error: insertError } = await admin.from("subscriptions").insert({
        user_id: userId,
        plan_id: planRow.id,
        status: "active",
        payment_provider: "lemonsqueezy",
        payment_reference: subscriptionId,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
      });

      if (insertError) {
        console.error("Failed to insert subscription for LS event:", insertError);
      }
    }

    return NextResponse.json({ received: true });
  }

  if (eventName === "subscription_updated") {
    const status = data.attributes?.status;
    const isCancelled = status === "expired" || status === "cancelled";

    if (isCancelled) {
      const { error: cancelError } = await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .eq("payment_provider", "lemonsqueezy")
        .eq("status", "active");

      if (cancelError) {
        console.error("Failed to cancel LS subscription:", cancelError);
      }
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
