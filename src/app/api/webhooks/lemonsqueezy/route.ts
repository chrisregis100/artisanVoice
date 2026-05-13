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
    console.error("[LS Webhook] Invalid payload:", payloadResult.error.flatten());
    return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
  }

  const { meta, data } = payloadResult.data;
  const eventName = meta.event_name;
  const attributes = data.attributes;
  const dataId = String(data.id);

  const userId = meta.custom_data?.user_id;
  const planName = meta.custom_data?.plan_name;

  if (!userId || !planName) {
    console.error("[LS Webhook] Missing custom_data", { eventName, dataId });
    return NextResponse.json({ received: true });
  }

  const admin = createAdminClient();

  switch (eventName) {
    case "order_created": {
      // Lifetime / one-shot purchase (early_bird plans) — current_period_end stays null
      const { data: planRow, error: planError } = await admin
        .from("plans")
        .select("id")
        .eq("name", planName)
        .eq("is_active", true)
        .maybeSingle();

      if (planError || !planRow) {
        console.error("[LS Webhook] Plan not found", { planName, error: planError?.message });
        return NextResponse.json({ received: true });
      }

      // Idempotency: skip if this order was already processed
      const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy")
        .maybeSingle();

      if (existing) break;

      // Deactivate any existing active subscriptions
      await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .eq("status", "active");

      const { error: insertError } = await admin.from("subscriptions").insert({
        user_id: userId,
        plan_id: planRow.id,
        status: "active",
        payment_provider: "lemonsqueezy",
        payment_reference: dataId,
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      });

      if (insertError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: insertError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_created": {
      const { data: planRow, error: planError } = await admin
        .from("plans")
        .select("id")
        .eq("name", planName)
        .eq("is_active", true)
        .maybeSingle();

      if (planError || !planRow) {
        console.error("[LS Webhook] Plan not found", { planName, error: planError?.message });
        return NextResponse.json({ received: true });
      }

      // Idempotency: skip if this subscription was already processed
      const { data: existing } = await admin
        .from("subscriptions")
        .select("id")
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy")
        .maybeSingle();

      if (existing) break;

      // Use renews_at from LS; fall back to calculated date
      let currentPeriodEnd: string;
      if (attributes?.renews_at) {
        currentPeriodEnd = attributes.renews_at;
      } else {
        const periodEnd = new Date();
        if (planName.includes("annual")) {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1);
        }
        currentPeriodEnd = periodEnd.toISOString();
      }

      // Deactivate any existing active subscriptions
      await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .eq("status", "active");

      const { error: insertError } = await admin.from("subscriptions").insert({
        user_id: userId,
        plan_id: planRow.id,
        status: "active",
        payment_provider: "lemonsqueezy",
        payment_reference: dataId,
        current_period_start: attributes?.created_at ?? new Date().toISOString(),
        current_period_end: currentPeriodEnd,
      });

      if (insertError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: insertError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_payment_success": {
      // Renewal: extend the period using the new renews_at date from LS
      const renewsAt = attributes?.renews_at ?? null;

      const { error: updateError } = await admin
        .from("subscriptions")
        .update({
          status: "active",
          ...(renewsAt !== null ? { current_period_end: renewsAt } : {}),
        })
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy");

      if (updateError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: updateError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_updated": {
      const lsStatusMap: Record<string, string> = {
        active: "active",
        paused: "paused",
        past_due: "past_due",
        unpaid: "past_due",
        cancelled: "cancelled",
        expired: "expired",
      };

      const lsStatus = attributes?.status;
      const mappedStatus = lsStatus ? (lsStatusMap[lsStatus] ?? lsStatus) : undefined;
      const renewsAt = attributes?.renews_at;

      if (!mappedStatus && renewsAt === undefined) break;

      const { error: updateError } = await admin
        .from("subscriptions")
        .update({
          ...(mappedStatus !== undefined ? { status: mappedStatus } : {}),
          ...(renewsAt !== undefined ? { current_period_end: renewsAt } : {}),
        })
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy");

      if (updateError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: updateError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_cancelled": {
      // User retains access until current_period_end — do not clear it
      const { error: updateError } = await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy");

      if (updateError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: updateError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_expired": {
      const { error: updateError } = await admin
        .from("subscriptions")
        .update({ status: "expired" })
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy");

      if (updateError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: updateError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    case "subscription_resumed": {
      const renewsAt = attributes?.renews_at ?? null;

      const { error: updateError } = await admin
        .from("subscriptions")
        .update({
          status: "active",
          ...(renewsAt !== null ? { current_period_end: renewsAt } : {}),
        })
        .eq("payment_reference", dataId)
        .eq("payment_provider", "lemonsqueezy");

      if (updateError) {
        console.error("[LS Webhook] DB error", { eventName, userId, error: updateError.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    default:
      // Unknown or unhandled event — acknowledge without processing
      break;
  }

  return NextResponse.json({ received: true });
}
