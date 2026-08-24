import { ICacheProvider, CacheStats } from '../interfaces';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
}

export class MemoryCache implements ICacheProvider {
  readonly name = 'memory-cache';
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private accessOrder: string[] = [];
  private hits = 0;
  private misses = 0;
  private defaultTtlMs: number;
  private maxSize: number;

  constructor(defaultTtlMs: number = 60000, maxSize: number = 10000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxSize = maxSize;
    this.startCleanup();
  }

  async get<T>(key: string): Promise<T | undefined> {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      return undefined;
    }

    this.updateAccessOrder(key);
    this.hits++;
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (ttlMs ?? this.defaultTtlMs);
    this.store.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
    this.updateAccessOrder(key);
  }

  async delete(key: string): Promise<boolean> {
    const deleted = this.store.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
    }
    return deleted;
  }

  async clear(): Promise<void> {
    this.store.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }
    return true;
  }

  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.store.size,
      keys: this.store.size,
    };
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getKeys(): string[] {
    return Array.from(this.store.keys());
  }

  prune(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        this.removeFromAccessOrder(key);
        removed++;
      }
    }

    return removed;
  }

  private evictLRU(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.store.delete(lruKey);
    }
  }

  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private startCleanup(): void {
    setInterval(() => this.prune(), 60000);
  }
}
