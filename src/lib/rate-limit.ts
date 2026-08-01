import "server-only";

/**
 * Lightweight fixed-window rate limiter (in-memory, per-instance).
 *
 * Best-effort defense against a single client hammering a sensitive action.
 * For robust, distributed limiting in production, layer Cloudflare's edge
 * rate-limiting rules on top of this.
 */
type Bucket = { count: number; reset: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true as const, remaining: limit - 1 };
  }
  if (bucket.count >= limit) {
    return { ok: false as const, remaining: 0 };
  }
  bucket.count += 1;
  return { ok: true as const, remaining: limit - bucket.count };
}
