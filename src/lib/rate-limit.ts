/**
 * Rate limiter port. The in-memory adapter is used until Redis is available (Docker on
 * hold); it is per-process, which is fine for a single dev server but NOT for multiple
 * production instances — swap in a Redis adapter there.
 */
export interface RateLimiter {
  /** Consumes one unit; returns whether the call is allowed and seconds until reset. */
  hit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<{ allowed: boolean; retryAfter: number }>;
  reset(key: string): Promise<void>;
}

export function createMemoryRateLimiter(now: () => number = Date.now): RateLimiter {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  return {
    async hit(key, limit, windowSeconds) {
      const t = now();
      let b = buckets.get(key);
      if (!b || b.resetAt <= t) {
        b = { count: 0, resetAt: t + windowSeconds * 1000 };
        buckets.set(key, b);
      }
      b.count += 1;
      if (buckets.size > 10_000) {
        for (const [k, v] of buckets) if (v.resetAt <= t) buckets.delete(k);
      }
      return { allowed: b.count <= limit, retryAfter: Math.ceil((b.resetAt - t) / 1000) };
    },
    async reset(key) {
      buckets.delete(key);
    },
  };
}

const globalForLimiter = globalThis as unknown as { __gmmLimiter?: RateLimiter };
export function getRateLimiter(): RateLimiter {
  globalForLimiter.__gmmLimiter ??= createMemoryRateLimiter();
  return globalForLimiter.__gmmLimiter;
}
