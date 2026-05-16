import { env } from "@/lib/env";

interface LsOrderAttributes {
  status: string;
  first_order_item: {
    variant_id: number;
    product_id: number;
  } | null;
}

interface LsOrderData {
  id: string;
  attributes: LsOrderAttributes;
}

interface LsOrderResponse {
  data: LsOrderData;
}

export interface LemonSqueezyOrderResult {
  id: string;
  /** e.g. "paid" | "pending" | "refunded" */
  status: string;
  variantId: number | null;
}

/**
 * Fetch a LemonSqueezy order by ID and return the fields needed for credit
 * granting: status and variant ID (to resolve the credit pack).
 */
export async function fetchLemonSqueezyOrder(
  orderId: string,
): Promise<LemonSqueezyOrderResult> {
  const apiKey = env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "LemonSqueezy n'est pas configuré : LEMONSQUEEZY_API_KEY manquant.",
    );
  }

  const response = await fetch(
    `https://api.lemonsqueezy.com/v1/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/vnd.api+json",
      },
    },
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `LemonSqueezy order fetch failed: ${response.status} — ${text}`,
    );
  }

  const json: LsOrderResponse = await response.json();
  const attrs = json.data.attributes;

  return {
    id: json.data.id,
    status: attrs.status,
    variantId: attrs.first_order_item?.variant_id ?? null,
  };
}

/**
 * Maps a LemonSqueezy variant ID (as a string) to a credit pack slug,
 * using the LEMONSQUEEZY_VARIANT_* environment variables.
 * Returns null when no matching variant is configured.
 */
export function resolvePackSlugFromVariant(variantId: string): string | null {
  const entries: Array<[string | undefined, string]> = [
    [env.LEMONSQUEEZY_VARIANT_STARTER_USD, "starter"],
    [env.LEMONSQUEEZY_VARIANT_POPULAIRE_USD, "populaire"],
    [env.LEMONSQUEEZY_VARIANT_PRO_USD, "pro"],
  ];

  for (const [envVariantId, slug] of entries) {
    if (envVariantId && envVariantId === variantId) return slug;
  }

  return null;
}
