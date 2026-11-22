interface BucketEntry {
  timestamps: number[];
}

const aiBuckets = new Map<string, BucketEntry>();
const previewBuckets = new Map<string, BucketEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

function evaluateBucket(
  store: Map<string, BucketEntry>,
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(key, entry);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  // Periodic lightweight cleanup to keep memory bounded
  if (store.size > 500) {
    for (const [k, v] of store.entries()) {
      if (v.timestamps.length === 0 || v.timestamps[v.timestamps.length - 1] <= cutoff) {
        store.delete(k);
      }
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.timestamps.length),
    retryAfterSeconds: 0,
  };
}

export function checkAiRateLimit(clientKey: string): RateLimitResult {
  return evaluateBucket(aiBuckets, clientKey, 40, 10 * 60 * 1000);
}

export function checkPreviewRateLimit(clientKey: string): RateLimitResult {
  return evaluateBucket(previewBuckets, clientKey, 180, 5 * 60 * 1000);
}
