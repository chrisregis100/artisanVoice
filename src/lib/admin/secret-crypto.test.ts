import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/admin/secret-crypto";
import { randomBytes } from "node:crypto";

describe("secret-crypto", () => {
  // Generate a fixed 32-byte key for deterministic testing
  const testKey = Buffer.from(
    "0123456789abcdef0123456789abcdef",
    "utf8"
  );

  beforeEach(() => {
    // Ensure we have a 32-byte key
    expect(testKey.length).toBe(32);
  });

  describe("encryptSecret", () => {
    it("should encrypt plaintext and return base64 string", () => {
      const plaintext = "my-secret-api-key";
      const ciphertext = encryptSecret(plaintext, testKey);

      // Should return a non-empty base64 string
      expect(typeof ciphertext).toBe("string");
      expect(ciphertext.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => Buffer.from(ciphertext, "base64")).not.toThrow();
    });

    it("should produce different ciphertexts for same plaintext (random IV)", () => {
      const plaintext = "my-secret-api-key";
      const ciphertext1 = encryptSecret(plaintext, testKey);
      const ciphertext2 = encryptSecret(plaintext, testKey);

      // Should be different due to random IV
      expect(ciphertext1).not.toBe(ciphertext2);

      // Both should decrypt to same plaintext
      expect(decryptSecret(ciphertext1, testKey)).toBe(plaintext);
      expect(decryptSecret(ciphertext2, testKey)).toBe(plaintext);
    });

    it("should handle empty string encryption", () => {
      const plaintext = "";
      const ciphertext = encryptSecret(plaintext, testKey);

      expect(typeof ciphertext).toBe("string");
      expect(ciphertext.length).toBeGreaterThan(0);

      // Empty string produces only IV (12) + auth tag (16) = 28 bytes
      // which is below minimum (29), so decrypt fails with INVALID_SECRET_PAYLOAD
      expect(() => decryptSecret(ciphertext, testKey)).toThrow(
        "INVALID_SECRET_PAYLOAD"
      );
    });

    it("should handle unicode characters", () => {
      const plaintext = "🔐 ñoño 中文 日本語";
      const ciphertext = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(ciphertext, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long plaintext", () => {
      const plaintext = "a".repeat(10000);
      const ciphertext = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(ciphertext, testKey);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe("decryptSecret", () => {
    it("should decrypt ciphertext back to original plaintext", () => {
      const plaintext = "sk-1234567890abcdef";
      const ciphertext = encryptSecret(plaintext, testKey);
      const decrypted = decryptSecret(ciphertext, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw INVALID_SECRET_PAYLOAD for too short input", () => {
      // Minimum valid payload: 12 (IV) + 16 (auth tag) + 1 (min ciphertext) = 29 bytes
      const shortPayload = Buffer.alloc(10).toString("base64");

      expect(() => decryptSecret(shortPayload, testKey)).toThrow(
        "INVALID_SECRET_PAYLOAD"
      );
    });

    it("should throw for exactly 28 bytes (one byte short)", () => {
      // 12 (IV) + 16 (auth tag) + 0 = 28 bytes - should fail
      const payload = Buffer.alloc(28).toString("base64");

      expect(() => decryptSecret(payload, testKey)).toThrow(
        "INVALID_SECRET_PAYLOAD"
      );
    });

    it("should throw for invalid auth tag", () => {
      // Create a 29-byte payload (minimum valid length) with zeros
      // IV=12, tag=16, enc=1 byte
      const invalidPayload = Buffer.alloc(29).toString("base64");

      expect(() => decryptSecret(invalidPayload, testKey)).toThrow();
    });

    it("should throw when using wrong key", () => {
      const plaintext = "secret-data";
      const ciphertext = encryptSecret(plaintext, testKey);

      const wrongKey = Buffer.from(
        "wrongkeywrongkeywrongkeywrongkey",
        "utf8"
      );

      // Should throw (likely auth tag verification failure)
      expect(() => decryptSecret(ciphertext, wrongKey)).toThrow();
    });

    it("should throw for corrupted ciphertext", () => {
      const plaintext = "secret-data";
      const ciphertext = encryptSecret(plaintext, testKey);

      // Corrupt the payload by modifying a character
      const corrupted =
        ciphertext.slice(0, -5) +
        String.fromCharCode(ciphertext.charCodeAt(ciphertext.length - 5) + 1) +
        ciphertext.slice(-4);

      expect(() => decryptSecret(corrupted, testKey)).toThrow();
    });

    it("should throw for empty string", () => {
      expect(() => decryptSecret("", testKey)).toThrow(
        "INVALID_SECRET_PAYLOAD"
      );
    });
  });

  describe("roundtrip", () => {
    it("should handle various API key formats", () => {
      const testCases = [
        "sk-abc123",
        "sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "Bearer token_with-special.chars~",
        "Basic dXNlcjpwYXNz",
      ];

      for (const plaintext of testCases) {
        const ciphertext = encryptSecret(plaintext, testKey);
        const decrypted = decryptSecret(ciphertext, testKey);
        expect(decrypted).toBe(plaintext);
      }
    });
  });
});
