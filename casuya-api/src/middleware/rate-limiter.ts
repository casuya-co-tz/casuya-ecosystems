import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  count: number;
  resetAt: number;
}

/**
 * Pluggable backing store for rate-limit counters. In-memory is the default
 * and is only correct for a single process. For horizontally-scaled
 * deployments (e.g. the 60-pod API tier sized for 100k concurrent users),
 * inject a distributed store (Redis) so limits are enforced fleet-wide.
 */
export interface RateLimitStore {
  /** Atomically increment the counter for `key`, creating a window if needed. */
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
  destroy?(): void;
}

/** Default in-process store. NOT shared across pods. */
export class MemoryRateLimitStore implements RateLimitStore {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.cleanupTimer = setInterval(() => this.cleanup(), 60000);
    if (typeof this.cleanupTimer === 'object' && 'unref' in this.cleanupTimer) {
      (this.cleanupTimer as unknown as { unref: () => void }).unref();
    }
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now();
    let entry = this.store.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      this.store.set(key, entry);
    }
    entry.count++;
    return { count: entry.count, resetAt: entry.resetAt };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetAt) {
        this.store.delete(key);
      }
    }
  }

  size(): number {
    return this.store.size;
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * Redis-backed distributed store. Enforces limits across all API pods.
 * `client` must be a redis client exposing `incr` and `pexpire`
 * (e.g. ioredis or node-redis). Kept dependency-free so it can be wired up
 * when a shared Redis is available.
 */
export interface MinimalRedisClient {
  incr(key: string): Promise<number>;
  pexpire(key: string, ms: number): Promise<unknown>;
  pttl(key: string): Promise<number>;
  pipeline?(): any;
}

export class RedisRateLimitStore implements RateLimitStore {
  constructor(
    private client: MinimalRedisClient,
    private prefix: string = 'ratelimit:',
  ) {}

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const redisKey = `${this.prefix}${key}`;

    if (this.client.pipeline) {
      const pipeline = this.client.pipeline();
      pipeline.incr(redisKey);
      pipeline.pexpire(redisKey, windowMs);
      pipeline.pttl(redisKey);
      const results = await pipeline.exec();

      const count = results[0][1] as number;
      let ttl = results[2][1] as number;
      if (ttl < 0) ttl = windowMs;
      return { count, resetAt: Date.now() + ttl };
    }

    const count = await this.client.incr(redisKey);
    if (count === 1) {
      await this.client.pexpire(redisKey, windowMs);
    }
    let ttl = await this.client.pttl(redisKey);
    if (ttl < 0) ttl = windowMs;
    return { count, resetAt: Date.now() + ttl };
  }
}

export class RateLimiter {
  private windowMs: number;
  private maxRequests: number;
  private store: RateLimitStore;

  constructor(
    windowMs: number = 60000,
    maxRequests: number = 100,
    store?: RateLimitStore,
  ) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.store = store ?? new MemoryRateLimitStore();
  }

  destroy(): void {
    this.store.destroy?.();
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const key = this.getKey(req);
      const now = Date.now();

      let result: RateLimitResult;
      try {
        result = await this.store.increment(key, this.windowMs);
      } catch {
        // Fail open: never let a rate-limit store outage take down the API.
        next();
        return;
      }

      res.setHeader('X-RateLimit-Limit', String(this.maxRequests));
      res.setHeader(
        'X-RateLimit-Remaining',
        String(Math.max(0, this.maxRequests - result.count)),
      );
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

      if (result.count > this.maxRequests) {
        const retryAfter = Math.ceil((result.resetAt - now) / 1000);
        res.setHeader('Retry-After', String(retryAfter));
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            details: { retryAfter },
          },
        });
        return;
      }

      next();
    };
  }

  private getKey(req: Request): string {
    return req.ip || 'unknown';
  }

  cleanup(): void {
    if (this.store instanceof MemoryRateLimitStore) {
      this.store.cleanup();
    }
  }

  getStoreSize(): number {
    if (this.store instanceof MemoryRateLimitStore) {
      return this.store.size();
    }
    return 0;
  }
}
