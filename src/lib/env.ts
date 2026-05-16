import { z } from "zod";

const serverSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AFRI_API_KEY: z.string().regex(/^sk-afri-/).optional(),
  AFRI_BASE_URL: z.string().url().optional(),
  // Flutterwave : optionnels tant que le fournisseur est désactivé (voir lib/payment/flutterwave.ts).
  // Sans clés, l’init de paiement et le webhook Flutterwave ne doivent pas être utilisés.
  FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_WEBHOOK_SECRET: z.string().optional(),
  FEDAPAY_PUBLIC_KEY: z.string().optional(),
  FEDAPAY_SECRET_KEY: z.string().optional(),
  FEDAPAY_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),
  LEMONSQUEEZY_VARIANT_STARTER_USD: z.string().optional(),
  LEMONSQUEEZY_VARIANT_POPULAIRE_USD: z.string().optional(),
  LEMONSQUEEZY_VARIANT_PRO_USD: z.string().optional(),
  ADMIN_EMAIL: z.string().email(),
  /** Base64, 32 bytes — encrypts API keys stored via the admin UI (`openssl rand -base64 32`). */
  ADMIN_SECRETS_ENCRYPTION_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

const clientResult = clientSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!clientResult.success) {
  throw new Error(
    `Invalid client environment variables:\n${JSON.stringify(clientResult.error.flatten().fieldErrors, null, 2)}`,
  );
}

export const clientEnv: ClientEnv = clientResult.data;

const isServer = typeof window === "undefined";

function buildServerEnv(): ServerEnv {
  const result = serverSchema.safeParse(process.env);
  if (!result.success) {
    throw new Error(
      `Invalid server environment variables:\n${JSON.stringify(result.error.flatten().fieldErrors, null, 2)}`,
    );
  }
  return result.data;
}

// Lazy singleton — validated on first access, not at import time.
// This prevents build-time failures when server env vars are not present.
let _serverEnv: ServerEnv | null = null;
function getServerEnv(): ServerEnv {
  if (!_serverEnv) _serverEnv = buildServerEnv();
  return _serverEnv;
}

export const env: ServerEnv = isServer
  ? new Proxy({} as ServerEnv, {
      get(_, prop: string) {
        return getServerEnv()[prop as keyof ServerEnv];
      },
    })
  : new Proxy({} as ServerEnv, {
      get(_, prop: string) {
        if (prop in clientEnv)
          return clientEnv[prop as keyof ClientEnv];
        throw new Error(
          `Server environment variable "${prop}" must not be accessed from the browser.`,
        );
      },
    });
