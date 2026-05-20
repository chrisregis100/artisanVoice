import { z } from "zod";

// admin/settings PUT — plan update
export const adminPlanUpdateSchema = z.object({
  type: z.literal("plan"),
  id: z.string().min(1),
  updates: z.object({
    price_amount: z.number().optional(),
    invoice_limit: z.number().optional(),
  }),
});

// admin/settings PUT — key-value setting update
export const adminSettingKeyValueSchema = z.object({
  key: z.string().min(1),
  value: z.unknown(),
});

// admin/settings PUT — encrypted API key (stored server-side, TLS in transit)
export const adminApiKeyUpdateSchema = z
  .object({
    type: z.literal("api_key"),
    provider: z.enum(["openai", "gemini"]),
    apiKey: z.string().min(12).optional(),
    clear: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.clear) return;
    if (!data.apiKey?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "apiKey requis sauf si clear est true.",
        path: ["apiKey"],
      });
    }
  });

/**
 * @deprecated L'endpoint /api/subscription/create renvoie désormais 410 (Gone).
 * Le système de paiement est basé sur les packs de crédits (`/api/credits/packs`).
 * Ce schéma est conservé pour éviter de casser d'éventuels imports existants.
 */
// subscription/create POST
export const subscriptionCreateSchema = z.object({
  planName: z.enum([
    "free",
    "free_xof",
    "free_eur",
    "free_usd",
    "pro",
    "early_bird",
    "early_bird_xof",
    "early_bird_eur",
    "early_bird_usd",
    "pro_monthly",
    "pro_monthly_xof",
    "pro_monthly_eur",
    "pro_monthly_usd",
    "pro_annual",
    "pro_annual_xof",
    "pro_annual_eur",
    "pro_annual_usd",
    "business_monthly",
    "business_monthly_xof",
    "business_monthly_eur",
    "business_monthly_usd",
    "business_annual",
    "business_annual_xof",
    "business_annual_eur",
    "business_annual_usd",
  ]),
  provider: z.enum(["fedapay", "lemonsqueezy"]).optional(),
  currency: z.enum(["XOF", "EUR", "USD"]).optional(),
});

// webhooks/lemonsqueezy POST
export const lemonsqueezyWebhookSchema = z.object({
  meta: z.object({
    event_name: z.enum([
      "order_created",
      "order_refunded",
      "subscription_created",
      "subscription_updated",
      "subscription_cancelled",
      "subscription_expired",
      "subscription_resumed",
      "subscription_paused",
      "subscription_unpaused",
      "subscription_payment_success",
      "subscription_payment_failed",
      "subscription_payment_recovered",
    ]),
    custom_data: z
      .object({
        user_id: z.string().optional(),
        plan_name: z.string().optional(),
        pack_slug: z.string().optional(),
      })
      .optional(),
  }),
  data: z.object({
    id: z.union([z.string(), z.number()]),
    attributes: z
      .object({
        status: z.string().optional(),
        order_id: z.union([z.string(), z.number()]).optional(),
        renews_at: z.string().nullable().optional(),
        ends_at: z.string().nullable().optional(),
        created_at: z.string().optional(),
        first_order_item: z
          .object({
            variant_id: z.number().optional(),
            product_id: z.number().optional(),
          })
          .optional(),
      })
      .optional(),
  }),
});

// subscription/document-export POST
export const documentExportSchema = z.object({
  documentId: z.string().min(1),
  phase: z.enum(["precheck", "commit"]),
});

// credits/charge POST
export const creditChargeSchema = z.object({
  documentId: z.string().min(1),
  phase: z.enum(["precheck", "commit"]),
});

// realtime/session POST (body is optional)
export const realtimeSessionSchema = z.object({
  userApiKey: z.string().trim().optional(),
});

// webhooks/flutterwave — route renvoie 410 si Flutterwave désactivé ; schéma conservé pour la doc / réactivation
export const flutterwaveWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.number(),
    tx_ref: z.string(),
    flw_ref: z.string(),
    amount: z.number(),
    currency: z.string(),
    charged_amount: z.number(),
    status: z.string(),
    payment_type: z.string(),
    meta: z
      .object({
        user_id: z.string().optional(),
        plan_id: z.string().optional(),
      })
      .nullable(),
    customer: z.object({
      id: z.number(),
      name: z.string(),
      phone_number: z.string().nullable(),
      email: z.string(),
    }),
  }),
});

// webhooks/fedapay POST
// klass and reference are present in most FedaPay payloads but may be omitted in
// some environments / API versions — keep them optional so schema validation never
// silently rejects a valid webhook.
export const fedapayWebhookSchema = z.object({
  name: z.string(),
  object: z.string().optional(),
  data: z.object({
    object: z.object({
      id: z.number(),
      klass: z.string().optional(),
      reference: z.string().optional(),
      amount: z.number(),
      status: z.string(),
      custom_metadata: z
        .object({
          user_id: z.string().optional(),
          plan_id: z.string().optional(),
          pack_id: z.string().optional(),
          pack_slug: z.string().optional(),
          kind: z.string().optional(),
        })
        .nullable()
        .optional(),
      customer: z
        .object({
          id: z.number(),
          email: z.string(),
          firstname: z.string(),
          lastname: z.string(),
        })
        .optional(),
    }),
  }),
});

export type AdminPlanUpdate = z.infer<typeof adminPlanUpdateSchema>;
export type AdminSettingKeyValue = z.infer<typeof adminSettingKeyValueSchema>;
export type AdminApiKeyUpdate = z.infer<typeof adminApiKeyUpdateSchema>;
export type SubscriptionCreateBody = z.infer<typeof subscriptionCreateSchema>;
export type DocumentExportBody = z.infer<typeof documentExportSchema>;
export type CreditChargeBody = z.infer<typeof creditChargeSchema>;
export type FlutterwaveWebhookPayload = z.infer<typeof flutterwaveWebhookSchema>;
export type FedapayWebhookPayload = z.infer<typeof fedapayWebhookSchema>;
export type LemonsqueezyWebhookPayload = z.infer<typeof lemonsqueezyWebhookSchema>;
