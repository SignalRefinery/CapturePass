type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitRecord>();

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const record = buckets.get(key);

  if (!record || record.resetAt <= now) {
    const fresh = {
      count: 1,
      resetAt: now + windowMs
    };
    buckets.set(key, fresh);

    return {
      allowed: true,
      remaining: Math.max(limit - fresh.count, 0),
      resetAt: fresh.resetAt
    };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }

  record.count += 1;
  buckets.set(key, record);

  return {
    allowed: true,
    remaining: Math.max(limit - record.count, 0),
    resetAt: record.resetAt
  };
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}
