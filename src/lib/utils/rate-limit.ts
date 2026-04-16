import { type NextRequest } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

interface RateLimitOptions {
  /** Window duration in milliseconds */
  interval: number;
  /** Maximum number of requests allowed per interval */
  maxRequests: number;
}

/**
 * In-memory fixed-window rate limit store.
 *
 * ⚠️ Serverless caveat: each function instance maintains its own isolated
 * store, so limits are not enforced globally across concurrent instances
 * (e.g. Vercel). This is acceptable as a basic abuse guard. For strict
 * global enforcement, replace with a distributed store such as Redis/Upstash.
 */
const store = new Map<string, RateLimitEntry>();

/** Purge entries that have already expired to prevent unbounded memory growth. */
const pruneExpired = (): void => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (now > entry.resetTime) store.delete(key);
  });
};

// Run cleanup every 5 minutes (server-side interval).
if (typeof setInterval !== "undefined") {
  setInterval(pruneExpired, 5 * 60 * 1000);
}

/**
 * Returns a per-IP rate-limit checker for the given window/cap.
 *
 * @example
 * const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });
 * const { success, remaining } = limiter(ip);
 */
export const rateLimit = (options: RateLimitOptions) => {
  const { interval, maxRequests } = options;

  return (ip: string): RateLimitResult => {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + interval });
      return { success: true, remaining: maxRequests - 1 };
    }

    if (entry.count >= maxRequests) {
      return { success: false, remaining: 0 };
    }

    entry.count += 1;
    return { success: true, remaining: maxRequests - entry.count };
  };
};

/** Extract the best-effort client IP from a Next.js / Vercel request. */
export const getClientIp = (request: NextRequest): string => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
};
