import { Buffer } from "node:buffer";

let cachedKey: Buffer | null | undefined;

/**
 * 32-byte key, base64-encoded (generate: `openssl rand -base64 32`).
 * Used only server-side to encrypt API keys stored in `admin_settings`.
 */
export function getSecretsEncryptionKey(): Buffer | null {
  if (cachedKey !== undefined) return cachedKey;
  const raw = process.env.ADMIN_SECRETS_ENCRYPTION_KEY?.trim();
  if (!raw) {
    cachedKey = null;
    return null;
  }
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) {
    console.error(
      "ADMIN_SECRETS_ENCRYPTION_KEY must be base64 decoding to exactly 32 bytes.",
    );
    cachedKey = null;
    return null;
  }
  cachedKey = buf;
  return buf;
}
