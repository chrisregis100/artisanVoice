import { describe, expect, it, vi } from "vitest";
import { type NextRequest } from "next/server";

// Dynamic import to get fresh module state for each test
async function importFresh() {
  const mod = await import("./rate-limit");
  return mod;
}

describe("rateLimit", () => {
  it("accepts requests within the limit", async () => {
    const { rateLimit } = await importFresh();
    const limiter = rateLimit({ interval: 60000, maxRequests: 3 });

    const result1 = limiter("192.168.1.1");
    expect(result1.success).toBe(true);
    expect(result1.remaining).toBe(2);

    const result2 = limiter("192.168.1.1");
    expect(result2.success).toBe(true);
    expect(result2.remaining).toBe(1);

    const result3 = limiter("192.168.1.1");
    expect(result3.success).toBe(true);
    expect(result3.remaining).toBe(0);
  });

  it("rejects requests over the limit", async () => {
    const { rateLimit } = await importFresh();
    const limiter = rateLimit({ interval: 60000, maxRequests: 2 });

    limiter("192.168.1.1");
    limiter("192.168.1.1");

    const result = limiter("192.168.1.1");
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("tracks different IPs independently", async () => {
    const { rateLimit } = await importFresh();
    const limiter = rateLimit({ interval: 60000, maxRequests: 2 });

    limiter("192.168.1.1");
    limiter("192.168.1.1");

    const otherIpResult = limiter("192.168.1.2");
    expect(otherIpResult.success).toBe(true);
    expect(otherIpResult.remaining).toBe(1);
  });

  it("resets the window after interval expires", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await importFresh();
    const limiter = rateLimit({ interval: 60000, maxRequests: 2 });

    limiter("192.168.1.1");
    limiter("192.168.1.1");

    const blockedResult = limiter("192.168.1.1");
    expect(blockedResult.success).toBe(false);

    vi.advanceTimersByTime(61000);

    const resetResult = limiter("192.168.1.1");
    expect(resetResult.success).toBe(true);
    expect(resetResult.remaining).toBe(1);

    vi.useRealTimers();
  });

  it("returns correct remaining count after partial usage", async () => {
    const { rateLimit } = await importFresh();
    const limiter = rateLimit({ interval: 60000, maxRequests: 3 });

    // Use a unique IP to avoid state leakage from other tests
    const result1 = limiter("10.0.0.5");
    expect(result1.remaining).toBe(2);

    const result2 = limiter("10.0.0.5");
    expect(result2.remaining).toBe(1);
  });
});

describe("getClientIp", () => {
  it("extracts IP from x-forwarded-for header", async () => {
    const { getClientIp } = await importFresh();
    const request = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return "203.0.113.42, 70.41.3.18";
          return null;
        }),
      },
    } as unknown as NextRequest;

    expect(getClientIp(request)).toBe("203.0.113.42");
  });

  it("falls back to x-real-ip when x-forwarded-for is not present", async () => {
    const { getClientIp } = await importFresh();
    const request = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return null;
          if (name === "x-real-ip") return "192.168.1.100";
          return null;
        }),
      },
    } as unknown as NextRequest;

    expect(getClientIp(request)).toBe("192.168.1.100");
  });

  it("returns 'unknown' when no IP headers are present", async () => {
    const { getClientIp } = await importFresh();
    const request = {
      headers: {
        get: vi.fn(() => null),
      },
    } as unknown as NextRequest;

    expect(getClientIp(request)).toBe("unknown");
  });

  it("trims whitespace from forwarded IP", async () => {
    const { getClientIp } = await importFresh();
    const request = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return "  203.0.113.42  ";
          return null;
        }),
      },
    } as unknown as NextRequest;

    expect(getClientIp(request)).toBe("203.0.113.42");
  });

  it("trims whitespace from real-ip", async () => {
    const { getClientIp } = await importFresh();
    const request = {
      headers: {
        get: vi.fn((name: string) => {
          if (name === "x-forwarded-for") return null;
          if (name === "x-real-ip") return "  192.168.1.100  ";
          return null;
        }),
      },
    } as unknown as NextRequest;

    expect(getClientIp(request)).toBe("192.168.1.100");
  });
});
