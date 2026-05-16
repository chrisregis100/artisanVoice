import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "@/lib/env";
import { lemonsqueezyWebhookSchema } from "@/lib/api/schemas";
import { getPackAdmin } from "@/lib/credits/packs";
import { grantCredits } from "@/lib/credits/grant";

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

/** Maps a LemonSqueezy variant ID (as string) to a credit pack slug. */
function buildVariantToPackSlug(): Record<string, string> {
  const map: Record<string, string> = {};

  const starterVariantId = env.LEMONSQUEEZY_VARIANT_STARTER_USD;
  const populaireVariantId = env.LEMONSQUEEZY_VARIANT_POPULAIRE_USD;
  const proVariantId = env.LEMONSQUEEZY_VARIANT_PRO_USD;

  if (starterVariantId) map[starterVariantId] = "starter";
  if (populaireVariantId) map[populaireVariantId] = "populaire";
  if (proVariantId) map[proVariantId] = "pro";

  return map;
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyLemonSqueezySignature(rawBody, signature)) {
    if (!process.env.LEMONSQUEEZY_WEBHOOK_SECRET) {
      console.error(
        "[LS Webhook] LEMONSQUEEZY_WEBHOOK_SECRET is not configured — all webhooks will be rejected.",
      );
    }
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
  const dataId = String(data.id);

  // Ignore all subscription lifecycle events — this app no longer uses subscriptions
  const isSubscriptionEvent = eventName.startsWith("subscription_");
  if (isSubscriptionEvent || eventName === "order_refunded") {
    console.warn(`[LS Webhook] Ignoring legacy event: ${eventName} (id=${dataId})`);
    return NextResponse.json({ received: true });
  }

  if (eventName !== "order_created") {
    // Unknown event — acknowledge without processing
    return NextResponse.json({ received: true });
  }

  // order_created — credit pack purchase.
  // Verify the order status is "paid" before granting credits.
  // LemonSqueezy fires order_created for all orders including pending ones.
  const orderStatus = data.attributes?.status;
  if (orderStatus !== "paid") {
    console.warn(`[LS Webhook] order_created with status="${orderStatus ?? "unknown"}" — skipping (id=${dataId})`);
    return NextResponse.json({ received: true });
  }

  const userId = meta.custom_data?.user_id;
  if (!userId) {
    console.error("[LS Webhook] Missing user_id in custom_data", { eventName, dataId });
    return NextResponse.json({ received: true });
  }

  // Resolve pack slug: prefer explicit pack_slug in custom_data, fall back to variant mapping
  let packSlug = meta.custom_data?.pack_slug;

  if (!packSlug) {
    const variantId = data.attributes?.first_order_item?.variant_id;
    if (variantId !== undefined) {
      const variantMap = buildVariantToPackSlug();
      packSlug = variantMap[String(variantId)];
    }
  }

  if (!packSlug) {
    console.error("[LS Webhook] Could not resolve pack slug for order", { dataId, attributes: data.attributes });
    return NextResponse.json({ received: true });
  }

  const pack = await getPackAdmin(packSlug);
  if (!pack) {
    console.error("[LS Webhook] Pack not found", { packSlug, dataId });
    // Return 500 so LemonSqueezy retries — pack not found is unexpected.
    return NextResponse.json(
      { error: "Pack introuvable — réessai attendu" },
      { status: 500 },
    );
  }

  const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

  try {
    await grantCredits({
      userId,
      amount: creditsToGrant,
      kind: "purchase",
      packId: pack.id,
      paymentProvider: "lemonsqueezy",
      paymentReference: dataId,
      metadata: { pack_slug: packSlug },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    // UNIQUE constraint violation → already processed, idempotent, acknowledge
    if (
      message.includes("unique") ||
      message.includes("duplicate") ||
      message.includes("already") ||
      message.includes("23505")
    ) {
      return NextResponse.json({ received: true });
    }
    // Real error: return 500 so LemonSqueezy retries the webhook delivery
    console.error("[LS Webhook] grantCredits failed — will retry", {
      userId,
      dataId,
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
