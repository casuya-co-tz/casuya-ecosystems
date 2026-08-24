import { CacheProvider, CacheConfig, CacheStats } from '../interfaces';
import { CacheStrategy } from '../interfaces';

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  createdAt: number;
  lastAccessed: number;
}

export class InMemoryCacheProvider implements CacheProvider {
  readonly name = 'in-memory';
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private config!: CacheConfig;
  private hits = 0;
  private misses = 0;

  async configure(config: CacheConfig): Promise<void> {
    this.config = config;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    entry.lastAccessed = Date.now();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl_seconds?: number): Promise<void> {
    if (this.config.max_size && this.store.size >= this.config.max_size) {
      this.evict();
    }

    const ttl = ttl_seconds ?? this.config.ttl_seconds;
    const hasTtl = ttl !== undefined && ttl !== null;
    this.store.set(key, {
      value,
      expiresAt: hasTtl ? Date.now() + ttl * 1000 : null,
      createdAt: Date.now(),
      lastAccessed: Date.now(),
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.hits = 0;
    this.misses = 0;
  }

  async getStats(): Promise<CacheStats> {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      hit_rate: total > 0 ? this.hits / total : 0,
    };
  }

  async shutdown(): Promise<void> {
    await this.clear();
  }

  private evict(): void {
    if (this.config.strategy === CacheStrategy.LRU) {
      let oldest: string | null = null;
      let oldestAccess = Infinity;
      for (const [key, entry] of this.store) {
        if (entry.lastAccessed < oldestAccess) {
          oldestAccess = entry.lastAccessed;
          oldest = key;
        }
      }
      if (oldest) this.store.delete(oldest);
    } else if (this.config.strategy === CacheStrategy.FIFO) {
      let oldest: string | null = null;
      let oldestCreated = Infinity;
      for (const [key, entry] of this.store) {
        if (entry.createdAt < oldestCreated) {
          oldestCreated = entry.createdAt;
          oldest = key;
        }
      }
      if (oldest) this.store.delete(oldest);
    }
  }
}
