type Bucket = { timestamps: number[] };

export function createContentRateLimiter(options: { windowMs: number; maxRequests: number }) {
  const buckets = new Map<string, Bucket>();
  return (key: string): { allowed: boolean; retryAfterSeconds: number } => {
    const now = Date.now();
    const cutoff = now - options.windowMs;
    const bucket = buckets.get(key) ?? { timestamps: [] };
    bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > cutoff);
    if (bucket.timestamps.length >= options.maxRequests) {
      const oldest = bucket.timestamps[0] ?? now;
      buckets.set(key, bucket);
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + options.windowMs - now) / 1000)) };
    }
    bucket.timestamps.push(now);
    buckets.set(key, bucket);
    if (buckets.size > 1000) {
      for (const [bucketKey, entry] of buckets) if (!entry.timestamps.length || entry.timestamps[entry.timestamps.length - 1] <= cutoff) buckets.delete(bucketKey);
    }
    return { allowed: true, retryAfterSeconds: 0 };
  };
}
