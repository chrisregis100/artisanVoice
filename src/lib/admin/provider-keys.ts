import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";
import { env } from "@/lib/env";
import { decryptSecret, encryptSecret } from "@/lib/admin/secret-crypto";
import { getSecretsEncryptionKey } from "@/lib/admin/secrets-settings";

export const ADMIN_SECRET_KEY_OPENAI = "secret_openai_api_key";
export const ADMIN_SECRET_KEY_GEMINI = "secret_gemini_api_key";

interface StoredSecretV1 {
  v: 1;
  ciphertext: string;
  last4: string;
}

export function parseStoredSecret(value: unknown): StoredSecretV1 | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;
  if (o.v !== 1 || typeof o.ciphertext !== "string" || typeof o.last4 !== "string") {
    return null;
  }
  return { v: 1, ciphertext: o.ciphertext, last4: o.last4 };
}

export async function getSecretKeyRow(
  settingKey: string,
): Promise<StoredSecretV1 | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", settingKey)
    .maybeSingle();

  return parseStoredSecret(data?.value);
}

export async function decryptStoredApiKey(
  row: StoredSecretV1 | null,
): Promise<string | undefined> {
  if (!row) return undefined;
  const master = getSecretsEncryptionKey();
  if (!master) return undefined;
  try {
    return decryptSecret(row.ciphertext, master);
  } catch {
    console.error("Failed to decrypt admin API secret — check ADMIN_SECRETS_ENCRYPTION_KEY");
    return undefined;
  }
}

export async function getServerApiKeyForProvider(
  provider: "openai" | "gemini",
): Promise<string | undefined> {
  const settingKey =
    provider === "gemini" ? ADMIN_SECRET_KEY_GEMINI : ADMIN_SECRET_KEY_OPENAI;
  const row = await getSecretKeyRow(settingKey);
  const fromDb = await decryptStoredApiKey(row);
  if (fromDb) return fromDb;
  return provider === "gemini" ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
}

export function maskFromStored(row: StoredSecretV1 | null): string {
  if (!row) return "Non configurée";
  return `****...${row.last4}`;
}

export function buildSecretPayload(plaintext: string): Json {
  const master = getSecretsEncryptionKey();
  if (!master) {
    throw new Error("MISSING_ENCRYPTION_KEY");
  }
  const last4 = plaintext.length >= 4 ? plaintext.slice(-4) : plaintext;
  const ciphertext = encryptSecret(plaintext, master);
  return { v: 1, ciphertext, last4 } as unknown as Json;
}
