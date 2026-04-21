import { describe, expect, it } from "vitest";
import {
  adminApiKeyUpdateSchema,
  documentExportSchema,
  fedapayWebhookSchema,
  realtimeSessionSchema,
  subscriptionCreateSchema,
} from "./schemas";

describe("adminApiKeyUpdateSchema", () => {
  it("accepts apiKey when clear is absent", () => {
    const parsed = adminApiKeyUpdateSchema.parse({
      type: "api_key",
      provider: "openai",
      apiKey: "sk-test-key-12",
    });
    expect(parsed.provider).toBe("openai");
    expect(parsed.apiKey).toBe("sk-test-key-12");
  });

  it("accepts clear: true without apiKey", () => {
    const parsed = adminApiKeyUpdateSchema.parse({
      type: "api_key",
      provider: "gemini",
      clear: true,
    });
    expect(parsed.clear).toBe(true);
  });

  it("rejects missing apiKey when clear is not true", () => {
    const result = adminApiKeyUpdateSchema.safeParse({
      type: "api_key",
      provider: "openai",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const apiKeyIssue = result.error.issues.find((i) =>
        i.path.includes("apiKey")
      );
      expect(apiKeyIssue?.message).toContain("apiKey");
    }
  });

  it("rejects whitespace-only apiKey when clear is absent", () => {
    const result = adminApiKeyUpdateSchema.safeParse({
      type: "api_key",
      provider: "openai",
      apiKey: "   ",
    });
    expect(result.success).toBe(false);
  });
});

describe("subscriptionCreateSchema", () => {
  it("accepts free plan", () => {
    expect(subscriptionCreateSchema.parse({ planName: "free" }).planName).toBe(
      "free"
    );
  });

  it("accepts pro with optional fedapay provider", () => {
    const parsed = subscriptionCreateSchema.parse({
      planName: "pro",
      provider: "fedapay",
    });
    expect(parsed.provider).toBe("fedapay");
  });

  it("rejects invalid plan name", () => {
    const result = subscriptionCreateSchema.safeParse({
      planName: "enterprise",
    });
    expect(result.success).toBe(false);
  });
});

describe("documentExportSchema", () => {
  it("accepts precheck phase", () => {
    const parsed = documentExportSchema.parse({
      documentId: "doc-1",
      phase: "precheck",
    });
    expect(parsed.phase).toBe("precheck");
  });

  it("rejects empty documentId", () => {
    const result = documentExportSchema.safeParse({
      documentId: "",
      phase: "commit",
    });
    expect(result.success).toBe(false);
  });
});

describe("realtimeSessionSchema", () => {
  it("accepts empty object", () => {
    expect(realtimeSessionSchema.parse({})).toEqual({});
  });

  it("trims userApiKey when present", () => {
    const parsed = realtimeSessionSchema.parse({
      userApiKey: "  my-key  ",
    });
    expect(parsed.userApiKey).toBe("my-key");
  });
});

describe("fedapayWebhookSchema", () => {
  it("parses minimal valid payload", () => {
    const payload = {
      name: "transaction.approved",
      object: "event",
      data: {
        object: {
          id: 42,
          klass: "Transaction",
          reference: "REF-001",
          amount: 5000,
          status: "approved",
          metadata: null,
        },
      },
    };
    const parsed = fedapayWebhookSchema.parse(payload);
    expect(parsed.data.object.reference).toBe("REF-001");
    expect(parsed.data.object.metadata).toBeNull();
  });
});
