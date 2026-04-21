import { describe, expect, it, vi } from "vitest";
import { getPostAuthPath } from "@/lib/subscription/post-auth-redirect";

describe("getPostAuthPath", () => {
  it("returns /dashboard when user has subscription", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hasSubscription: true }),
    });

    const result = await getPostAuthPath();

    expect(result).toBe("/dashboard");
    expect(global.fetch).toHaveBeenCalledWith("/api/subscription/status");
  });

  it("returns /subscribe when user has no subscription", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hasSubscription: false }),
    });

    const result = await getPostAuthPath();

    expect(result).toBe("/subscribe");
  });

  it("returns /subscribe when response is not ok", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    });

    const result = await getPostAuthPath();

    expect(result).toBe("/subscribe");
  });

  it("returns /subscribe when fetch throws error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await getPostAuthPath();

    expect(result).toBe("/subscribe");
  });

  it("returns /subscribe when response has no hasSubscription field", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({}),
    });

    const result = await getPostAuthPath();

    expect(result).toBe("/subscribe");
  });

  it("returns /subscribe when hasSubscription is undefined", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ hasSubscription: undefined }),
    });

    const result = await getPostAuthPath();

    expect(result).toBe("/subscribe");
  });
});
