import { env } from "@/lib/config/env";
import { AppError } from "@/lib/core/errors";

interface Bucket {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private buckets: Map<string, Bucket> = new Map();

  public consume(key: string, limit?: number, windowMs?: number): void {
    const max = limit ?? env.rateLimit.max;
    const window = windowMs ?? env.rateLimit.windowMs;
    const now = Date.now();

    let bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + window };
      this.buckets.set(key, bucket);
    }

    bucket.count += 1;

    if (bucket.count > max) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000);
      throw new AppError("RATE_LIMITED", `Too many requests. Retry in ${retryAfterSec}s.`, {
        retryAfterSec,
        limit: max,
      });
    }

    if (this.buckets.size > 5000) this.gc(now);
  }

  public remaining(key: string): number {
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= Date.now()) return env.rateLimit.max;
    return Math.max(0, env.rateLimit.max - bucket.count);
  }

  public reset(key: string): void {
    this.buckets.delete(key);
  }

  private gc(now: number): void {
    for (const [key, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export const rateLimiter = new RateLimiter();

export function clientKey(req: Request, scope = "global"): string {
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip = forwarded.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
  return `${scope}:${ip}`;
}