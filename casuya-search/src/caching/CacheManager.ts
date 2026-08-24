/**
 * CacheManager - Caching layer for search results
 * Supports multiple eviction strategies and TTL
 */

import { CacheConfig } from '../types';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  accessCount: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private accessOrder: string[];
  private hits: number;
  private misses: number;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.config = config;
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      return undefined;
    }

    // Update access statistics
    this.hits++;
    entry.accessCount++;
    this.updateAccessOrder(key);

    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });

    this.updateAccessOrder(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check TTL
    if (Date.now() - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    this.removeFromAccessOrder(key);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      hits: this.hits,
      misses: this.misses,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        accessCount: entry.accessCount,
        age: Date.now() - entry.timestamp,
      })),
    };
  }

  /**
   * Evict an entry based on configured strategy
   */
  private evict(): void {
    if (this.accessOrder.length === 0) return;

    let keyToEvict: string = this.accessOrder[0];

    switch (this.config.strategy) {
      case 'lru':
        // Least Recently Used - first in access order
        keyToEvict = this.accessOrder[0];
        break;
      case 'fifo':
        // First In First Out - first in access order
        keyToEvict = this.accessOrder[0];
        break;
      case 'lfu': {
        // Least Frequently Used - find entry with lowest access count
        let minAccess = Infinity;
        for (const [key, entry] of this.cache) {
          if (entry.accessCount < minAccess) {
            minAccess = entry.accessCount;
            keyToEvict = key;
          }
        }
        break;
      }
      default:
        keyToEvict = this.accessOrder[0];
    }

    this.cache.delete(keyToEvict);
    this.removeFromAccessOrder(keyToEvict);
  }

  /**
   * Update access order based on strategy
   */
  private updateAccessOrder(key: string): void {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  /**
   * Remove key from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * Calculate hit rate based on tracked hits and misses
   */
  private calculateHitRate(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return this.hits / total;
  }

  /**
   * Reset hit/miss counters
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hits: number;
  misses: number;
  entries: Array<{
    key: string;
    accessCount: number;
    age: number;
  }>;
}
