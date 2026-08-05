type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// El proceso es de larga duración: sin esto los buckets vencidos se acumulan sin límite.
function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (buckets.size > 500) sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

export const LOGIN_LIMIT = { limit: 5, windowMs: 15 * 60 * 1000 };
export const FORM_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };
