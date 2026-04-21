import { describe, expect, it, vi } from "vitest";
import {
  downgradeExpiredProIfNeeded,
  downgradeProToFree,
} from "@/lib/subscription/expire";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type MockSupabase = ReturnType<typeof createMockSupabase>;

function createMockSupabase() {
  const updateEqMock = vi.fn();

  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
    maybeSingle: vi.fn(),
    update: vi.fn(() => ({
      eq: updateEqMock,
    })),
    // Expose updateEq for assertions
    _updateEq: updateEqMock,
  };

  return {
    mockClient: chainMethods as unknown as SupabaseClient<Database>,
    chainMethods,
  };
}

describe("downgradeExpiredProIfNeeded", () => {
  it("returns false when no subscription found", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });

  it("returns false when plan is not pro", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: "2025-01-01",
        plans: { name: "free" },
      },
      error: null,
    });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });

  it("returns false when current_period_end is null", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: null,
        plans: { name: "pro" },
      },
      error: null,
    });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });

  it("returns false when period has not expired yet", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: futureDate.toISOString(),
        plans: { name: "pro" },
      },
      error: null,
    });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });

  it("returns false when free plan not found", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    chainMethods.maybeSingle
      .mockResolvedValueOnce({
        data: {
          id: "sub-1",
          current_period_end: pastDate.toISOString(),
          plans: { name: "pro" },
        },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: { message: "Not found" } });
    chainMethods.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });

  it("downgrades expired pro subscription to free", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: pastDate.toISOString(),
        plans: { name: "pro" },
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: null });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(true);
    expect(chainMethods.update).toHaveBeenCalledWith({
      plan_id: "free-plan-id",
      payment_provider: null,
      payment_reference: null,
      current_period_start: expect.any(String),
      current_period_end: null,
    });
    expect(chainMethods._updateEq).toHaveBeenCalledWith("id", "sub-1");
  });

  it("handles array plans format", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: pastDate.toISOString(),
        plans: [{ name: "pro" }],
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: null });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(true);
  });

  it("returns false when update fails", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);

    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        current_period_end: pastDate.toISOString(),
        plans: { name: "pro" },
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: { message: "Update failed" } });

    const result = await downgradeExpiredProIfNeeded(mockClient, "user-123");

    expect(result).toBe(false);
  });
});

describe("downgradeProToFree", () => {
  it("returns error when no subscription found", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result).toEqual({ ok: false, error: "no_subscription" });
  });

  it("returns error when not on pro plan", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValue({
      data: {
        id: "sub-1",
        plans: { name: "free" },
      },
      error: null,
    });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result).toEqual({ ok: false, error: "not_pro" });
  });

  it("returns error when free plan not found", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "sub-1",
        plans: { name: "pro" },
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({ data: null, error: { message: "Not found" } });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result).toEqual({ ok: false, error: "free_plan_missing" });
  });

  it("successfully downgrades pro to free", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "sub-1",
        plans: { name: "pro" },
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: null });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result).toEqual({ ok: true });
    expect(chainMethods.update).toHaveBeenCalledWith({
      plan_id: "free-plan-id",
      payment_provider: null,
      payment_reference: null,
      current_period_start: expect.any(String),
      current_period_end: null,
    });
    expect(chainMethods._updateEq).toHaveBeenCalledWith("id", "sub-1");
  });

  it("handles array plans format", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "sub-1",
        plans: [{ name: "pro" }],
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: null });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result.ok).toBe(true);
  });

  it("returns error when update fails", async () => {
    const { mockClient, chainMethods } = createMockSupabase();
    chainMethods.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "sub-1",
        plans: { name: "pro" },
      },
      error: null,
    });
    chainMethods.single.mockResolvedValue({
      data: { id: "free-plan-id" },
      error: null,
    });
    chainMethods._updateEq.mockResolvedValue({ error: { message: "Update failed" } });

    const result = await downgradeProToFree(mockClient, "user-123");

    expect(result).toEqual({ ok: false, error: "update_failed" });
  });
});
