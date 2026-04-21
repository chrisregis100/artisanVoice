import { describe, expect, it } from "vitest";
import {
  adminApiKeyUpdateSchema,
  adminPlanUpdateSchema,
  adminSettingKeyValueSchema,
  documentExportSchema,
  fedapayWebhookSchema,
  flutterwaveWebhookSchema,
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

describe("adminPlanUpdateSchema", () => {
  it("accepts valid plan update with price_amount", () => {
    const parsed = adminPlanUpdateSchema.parse({
      type: "plan",
      id: "plan-pro",
      updates: {
        price_amount: 999,
      },
    });
    expect(parsed.type).toBe("plan");
    expect(parsed.id).toBe("plan-pro");
    expect(parsed.updates.price_amount).toBe(999);
  });

  it("accepts valid plan update with invoice_limit", () => {
    const parsed = adminPlanUpdateSchema.parse({
      type: "plan",
      id: "plan-pro",
      updates: {
        invoice_limit: 100,
      },
    });
    expect(parsed.updates.invoice_limit).toBe(100);
  });

  it("accepts valid plan update with both optional fields", () => {
    const parsed = adminPlanUpdateSchema.parse({
      type: "plan",
      id: "plan-pro",
      updates: {
        price_amount: 999,
        invoice_limit: 100,
      },
    });
    expect(parsed.updates.price_amount).toBe(999);
    expect(parsed.updates.invoice_limit).toBe(100);
  });

  it("accepts valid plan update with empty updates object", () => {
    const parsed = adminPlanUpdateSchema.parse({
      type: "plan",
      id: "plan-pro",
      updates: {},
    });
    expect(parsed.updates).toEqual({});
  });

  it("rejects missing type field", () => {
    const result = adminPlanUpdateSchema.safeParse({
      id: "plan-pro",
      updates: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid type value", () => {
    const result = adminPlanUpdateSchema.safeParse({
      type: "api_key",
      id: "plan-pro",
      updates: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty id", () => {
    const result = adminPlanUpdateSchema.safeParse({
      type: "plan",
      id: "",
      updates: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id field", () => {
    const result = adminPlanUpdateSchema.safeParse({
      type: "plan",
      updates: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing updates field", () => {
    const result = adminPlanUpdateSchema.safeParse({
      type: "plan",
      id: "plan-pro",
    });
    expect(result.success).toBe(false);
  });
});

describe("adminSettingKeyValueSchema", () => {
  it("accepts valid key-value with string value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "site_name",
      value: "My Site",
    });
    expect(parsed.key).toBe("site_name");
    expect(parsed.value).toBe("My Site");
  });

  it("accepts valid key-value with number value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "max_users",
      value: 100,
    });
    expect(parsed.value).toBe(100);
  });

  it("accepts valid key-value with boolean value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "maintenance_mode",
      value: true,
    });
    expect(parsed.value).toBe(true);
  });

  it("accepts valid key-value with object value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "config",
      value: { nested: "data" },
    });
    expect(parsed.value).toEqual({ nested: "data" });
  });

  it("accepts valid key-value with null value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "deleted_setting",
      value: null,
    });
    expect(parsed.value).toBeNull();
  });

  it("rejects empty key", () => {
    const result = adminSettingKeyValueSchema.safeParse({
      key: "",
      value: "some value",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing key field", () => {
    const result = adminSettingKeyValueSchema.safeParse({
      value: "some value",
    });
    expect(result.success).toBe(false);
  });

  it("accepts undefined as value", () => {
    const parsed = adminSettingKeyValueSchema.parse({
      key: "setting_key",
      value: undefined,
    });
    expect(parsed.key).toBe("setting_key");
    expect(parsed.value).toBeUndefined();
  });
});

describe("flutterwaveWebhookSchema", () => {
  it("accepts valid complete payload", () => {
    const payload = {
      event: "charge.completed",
      data: {
        id: 12345,
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: {
          user_id: "user-123",
          plan_id: "plan-pro",
        },
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: "+2348012345678",
          email: "john@example.com",
        },
      },
    };
    const parsed = flutterwaveWebhookSchema.parse(payload);
    expect(parsed.event).toBe("charge.completed");
    expect(parsed.data.id).toBe(12345);
    expect(parsed.data.tx_ref).toBe("TX-REF-001");
    expect(parsed.data.amount).toBe(5000);
    expect(parsed.data.meta?.user_id).toBe("user-123");
    expect(parsed.data.customer.email).toBe("john@example.com");
  });

  it("accepts valid payload with null meta", () => {
    const payload = {
      event: "charge.completed",
      data: {
        id: 12345,
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: null,
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
          email: "john@example.com",
        },
      },
    };
    const parsed = flutterwaveWebhookSchema.parse(payload);
    expect(parsed.data.meta).toBeNull();
  });

  it("accepts valid payload with minimal meta", () => {
    const payload = {
      event: "charge.completed",
      data: {
        id: 12345,
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: {},
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
          email: "john@example.com",
        },
      },
    };
    const parsed = flutterwaveWebhookSchema.parse(payload);
    expect(parsed.data.meta).toEqual({});
  });

  it("rejects missing event field", () => {
    const result = flutterwaveWebhookSchema.safeParse({
      data: {
        id: 12345,
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: null,
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
          email: "john@example.com",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing data field", () => {
    const result = flutterwaveWebhookSchema.safeParse({
      event: "charge.completed",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required data.id field", () => {
    const result = flutterwaveWebhookSchema.safeParse({
      event: "charge.completed",
      data: {
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: null,
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
          email: "john@example.com",
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required customer fields", () => {
    const result = flutterwaveWebhookSchema.safeParse({
      event: "charge.completed",
      data: {
        id: 12345,
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: null,
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
        },
      },
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid data.id type", () => {
    const result = flutterwaveWebhookSchema.safeParse({
      event: "charge.completed",
      data: {
        id: "not-a-number",
        tx_ref: "TX-REF-001",
        flw_ref: "FLW-REF-001",
        amount: 5000,
        currency: "NGN",
        charged_amount: 5000,
        status: "successful",
        payment_type: "card",
        meta: null,
        customer: {
          id: 987,
          name: "John Doe",
          phone_number: null,
          email: "john@example.com",
        },
      },
    });
    expect(result.success).toBe(false);
  });
});
