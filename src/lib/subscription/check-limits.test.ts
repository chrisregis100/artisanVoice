import { describe, expect, it, vi } from "vitest";
import {
  canCreateInvoice,
  commitDocumentExport,
  getUserSubscription,
  incrementInvoiceCount,
  precheckDocumentExport,
} from "@/lib/subscription/check-limits";

// Mock the Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// Mock the expire module
vi.mock("@/lib/subscription/expire", () => ({
  downgradeExpiredProIfNeeded: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { downgradeExpiredProIfNeeded } from "@/lib/subscription/expire";

const mockSupabase = () => {
  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  const mockClient = {
    ...chainMethods,
  };

  vi.mocked(createClient).mockResolvedValue(mockClient as any);
  return { mockClient, chainMethods };
};

describe("getUserSubscription", () => {
  it("returns null when no subscription found", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await getUserSubscription("user-123");

    expect(downgradeExpiredProIfNeeded).toHaveBeenCalledWith(expect.anything(), "user-123");
    expect(result).toBeNull();
  });

  it("returns null when subscription has no plan", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        current_period_end: null,
        plans: null,
      },
      error: null,
    });

    const result = await getUserSubscription("user-123");

    expect(result).toBeNull();
  });

  it("returns subscription with plan data (object plans)", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        current_period_end: "2026-12-31",
        plans: {
          name: "pro",
          display_name: "Pro Plan",
          invoice_limit: 100,
        },
      },
      error: null,
    });

    const result = await getUserSubscription("user-123");

    expect(result).toEqual({
      id: "sub-1",
      planName: "pro",
      planDisplayName: "Pro Plan",
      invoiceLimit: 100,
      status: "active",
      currentPeriodEnd: "2026-12-31",
    });
  });

  it("returns subscription with plan data (array plans)", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        current_period_end: "2026-12-31",
        plans: [
          {
            name: "free",
            display_name: "Free Plan",
            invoice_limit: 10,
          },
        ],
      },
      error: null,
    });

    const result = await getUserSubscription("user-123");

    expect(result).toEqual({
      id: "sub-1",
      planName: "free",
      planDisplayName: "Free Plan",
      invoiceLimit: 10,
      status: "active",
      currentPeriodEnd: "2026-12-31",
    });
  });

  it("handles unlimited invoice limit (null)", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({
      data: {
        id: "sub-1",
        status: "active",
        current_period_end: null,
        plans: {
          name: "enterprise",
          display_name: "Enterprise",
          invoice_limit: null,
        },
      },
      error: null,
    });

    const result = await getUserSubscription("user-123");

    expect(result?.invoiceLimit).toBeNull();
  });
});

describe("canCreateInvoice", () => {
  it("rejects when no subscription exists", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await canCreateInvoice("user-123");

    expect(result).toEqual({ allowed: false, remaining: 0, plan: "none" });
  });

  it("allows unlimited when invoiceLimit is null", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "enterprise", display_name: "Enterprise", invoice_limit: null },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const result = await canCreateInvoice("user-123");

    expect(result).toEqual({ allowed: true, remaining: null, plan: "enterprise" });
  });

  it("allows when under limit", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null });

    const result = await canCreateInvoice("user-123");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
    expect(result.plan).toBe("pro");
  });

  it("rejects when at limit", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 10 }, error: null });

    const result = await canCreateInvoice("user-123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.plan).toBe("pro");
  });

  it("rejects when over limit", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 15 }, error: null });

    const result = await canCreateInvoice("user-123");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("allows when no usage record exists (fresh month)", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "free", display_name: "Free", invoice_limit: 5 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const result = await canCreateInvoice("user-123");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});

describe("incrementInvoiceCount", () => {
  it("creates new usage record when none exists", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } }) // No existing record
      .mockResolvedValueOnce({ data: { id: "usage-1" }, error: null }); // Insert result

    await incrementInvoiceCount("user-123");

    expect(chainMethods.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      month_year: expect.any(String),
      invoice_count: 1,
    });
  });

  it("updates existing usage record", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.single.mockResolvedValueOnce({
      data: { id: "usage-1", invoice_count: 5 },
      error: null,
    });

    await incrementInvoiceCount("user-123");

    expect(chainMethods.update).toHaveBeenCalledWith({ invoice_count: 6 });
    expect(chainMethods.eq).toHaveBeenCalledWith("id", "usage-1");
  });
});

describe("precheckDocumentExport", () => {
  it("allows export for duplicate document", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({
      data: { id: "existing-doc" },
      error: null,
    });

    const result = await precheckDocumentExport("user-123", "doc-1");

    expect(result).toEqual({ canExport: true, duplicate: true });
  });

  it("rejects when no subscription", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } })
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } });

    const result = await precheckDocumentExport("user-123", "doc-1");

    expect(result).toEqual({ canExport: false, reason: "no_subscription" });
  });

  it("rejects when quota exceeded", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 5 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null });

    const result = await precheckDocumentExport("user-123", "doc-1");

    expect(result).toEqual({ canExport: false, reason: "quota_exceeded" });
  });

  it("allows new export when under quota", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null });

    const result = await precheckDocumentExport("user-123", "doc-1");

    expect(result).toEqual({ canExport: true, duplicate: false });
  });
});

describe("commitDocumentExport", () => {
  it("returns duplicate when document already counted", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({
      data: { id: "existing-doc" },
      error: null,
    });

    const result = await commitDocumentExport("user-123", "doc-1");

    expect(result).toBe("duplicate");
  });

  it("returns quota_exceeded when at limit", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 5 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null });

    const result = await commitDocumentExport("user-123", "doc-1");

    expect(result).toBe("quota_exceeded");
  });

  it("counts document and increments usage on success", async () => {
    const { chainMethods } = mockSupabase();
    // commitDocumentExport calls canCreateInvoice which calls getUserSubscription
    // Then commitDocumentExport does its own queries
    // Then incrementInvoiceCount is called which creates a NEW client (same mock)

    // Flow breakdown:
    // Client 1 (commitDocumentExport initial): maybeSingle for existing doc
    // Client 2 (getUserSubscription via canCreateInvoice): single for subscription
    // Client 2 (canCreateInvoice): single for usage
    // Client 1 (commitDocumentExport insert): single for insert result
    // Client 3 (incrementInvoiceCount): single for existing usage

    chainMethods.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // No existing doc (precheck)
      .mockResolvedValueOnce({ data: { id: "usage-1", invoice_count: 5 }, error: null }); // incrementInvoiceCount: existing usage

    chainMethods.single
      .mockResolvedValueOnce({
        // getUserSubscription (via canCreateInvoice)
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null }) // canCreateInvoice usage check
      .mockResolvedValueOnce({ data: { id: "doc-record-1" }, error: null }) // commitDocumentExport insert result
      .mockResolvedValueOnce({ data: { id: "usage-1", invoice_count: 5 }, error: null }); // incrementInvoiceCount usage check

    // incrementInvoiceCount does update + eq after single
    chainMethods.update.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await commitDocumentExport("user-123", "doc-1");

    expect(result).toBe("counted");
    expect(chainMethods.insert).toHaveBeenCalledWith({
      user_id: "user-123",
      month_year: expect.any(String),
      document_id: "doc-1",
    });
  });

  it("handles unique constraint violation as duplicate", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null })
      .mockResolvedValueOnce({
        data: null,
        error: { code: "23505", message: "Unique constraint violation" },
      });

    const result = await commitDocumentExport("user-123", "doc-1");

    expect(result).toBe("duplicate");
  });

  it("throws on insert error and cleans up", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: null });
    chainMethods.single
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null })
      .mockResolvedValueOnce({
        data: { id: "doc-record-1" },
        error: null,
      }) // Insert success
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null }); // For increment

    const insertError = new Error("Database error");
    chainMethods.insert.mockImplementation(() => {
      throw insertError;
    });

    await expect(commitDocumentExport("user-123", "doc-1")).rejects.toThrow("Database error");
  });

  it("deletes document record if increment fails", async () => {
    const { chainMethods } = mockSupabase();
    chainMethods.maybeSingle
      .mockResolvedValueOnce({ data: null, error: null }) // precheck
      .mockResolvedValueOnce({ data: { id: "usage-1", invoice_count: 5 }, error: null }); // incrementInvoiceCount existing usage

    chainMethods.single
      .mockResolvedValueOnce({
        // getUserSubscription
        data: {
          id: "sub-1",
          status: "active",
          current_period_end: null,
          plans: { name: "pro", display_name: "Pro", invoice_limit: 10 },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: { invoice_count: 5 }, error: null }) // canCreateInvoice usage
      .mockResolvedValueOnce({
        data: { id: "doc-record-1" },
        error: null,
      }) // commitDocumentExport insert result
      .mockResolvedValueOnce({ data: { id: "usage-1", invoice_count: 5 }, error: null }); // incrementInvoiceCount usage check

    // incrementInvoiceCount update fails
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    chainMethods.delete.mockReturnValue({ eq: deleteEqMock });
    chainMethods.update.mockReturnValue({
      eq: vi.fn().mockRejectedValue(new Error("Increment failed")),
    });

    await expect(commitDocumentExport("user-123", "doc-1")).rejects.toThrow("Increment failed");
    expect(chainMethods.delete).toHaveBeenCalled();
    expect(deleteEqMock).toHaveBeenCalledWith("id", "doc-record-1");
  });
});
