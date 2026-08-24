import { ICacheProvider } from '../interfaces';
import { ConsoleLogger } from '../utilities';
import { MemoryCache } from './memory-cache';

export class CacheManager {
  private provider: ICacheProvider;
  private logger: ConsoleLogger;
  private defaultTtl: number;
  private inflight = new Map<string, Promise<any>>();

  constructor(provider: ICacheProvider, defaultTtl: number = 60000, logger?: ConsoleLogger) {
    this.provider = provider;
    this.defaultTtl = defaultTtl;
    this.logger = logger || new ConsoleLogger();
  }

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    const cached = await this.provider.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = this.factoryWithDedup(key, factory, ttlMs);
    this.inflight.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inflight.delete(key);
    }
  }

  private async factoryWithDedup<T>(
    key: string,
    factory: () => Promise<T>,
    ttlMs?: number,
  ): Promise<T> {
    try {
      const value = await factory();
      await this.provider.set(key, value, ttlMs ?? this.defaultTtl);
      return value;
    } catch (error) {
      throw error;
    }
  }

  async invalidate(pattern?: string): Promise<void> {
    if (!pattern) {
      await this.provider.clear();
      return;
    }

    this.logger.debug(`Cache invalidation called with pattern: ${pattern}`);
  }

  async invalidateByPrefix(prefix: string): Promise<number> {
    let count = 0;

    if (this.provider instanceof MemoryCache) {
      const keysToDelete: string[] = [];
      for (const key of this.provider.getKeys()) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }
      for (const key of keysToDelete) {
        await this.provider.delete(key);
        count++;
      }
    } else {
      const redis = (this.provider as any).client;
      if (redis && redis.scan) {
        let cursor = 0;
        do {
          const [newCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
          cursor = newCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
            count += keys.length;
          }
        } while (cursor !== 0);
      }
    }

    this.logger.debug(`Invalidated ${count} keys with prefix: ${prefix}`);
    return count;
  }

  getProvider(): ICacheProvider {
    return this.provider;
  }
}
