import { CacheManager } from '../src/caching/CacheManager';
import { CacheConfig } from '../src/types';

describe('CacheManager', () => {
  let cacheManager: CacheManager<string>;

  beforeEach(() => {
    const config: CacheConfig = {
      maxSize: 5,
      ttl: 1000,
      strategy: 'lru',
    };
    cacheManager = new CacheManager<string>(config);
  });

  describe('set and get', () => {
    it('should set and get value', () => {
      cacheManager.set('key1', 'value1');
      const value = cacheManager.get('key1');
      expect(value).toBe('value1');
    });

    it('should return undefined for non-existent key', () => {
      const value = cacheManager.get('nonexistent');
      expect(value).toBeUndefined();
    });

    it('should update existing key', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key1', 'value2');
      const value = cacheManager.get('key1');
      expect(value).toBe('value2');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cacheManager.set('key1', 'value1');
      expect(cacheManager.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cacheManager.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete a key', () => {
      cacheManager.set('key1', 'value1');
      const deleted = cacheManager.delete('key1');
      expect(deleted).toBe(true);
      expect(cacheManager.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      const deleted = cacheManager.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('eviction', () => {
    it('should evict when at capacity', () => {
      for (let i = 0; i < 6; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }
      expect(cacheManager['cache'].size).toBe(5);
    });

    it('should not evict when updating existing key', () => {
      for (let i = 0; i < 5; i++) {
        cacheManager.set(`key${i}`, `value${i}`);
      }
      cacheManager.set('key0', 'updated');
      expect(cacheManager.has('key0')).toBe(true);
    });
  });

  describe('TTL', () => {
    it('should expire after TTL', (done) => {
      const config: CacheConfig = {
        maxSize: 10,
        ttl: 100,
        strategy: 'lru',
      };
      const cache = new CacheManager<string>(config);
      cache.set('key1', 'value1');

      setTimeout(() => {
        const value = cache.get('key1');
        expect(value).toBeUndefined();
        done();
      }, 150);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      cacheManager.clear();
      const stats = cacheManager.getStats();
      expect(stats.size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheManager.set('key1', 'value1');
      cacheManager.set('key2', 'value2');
      const stats = cacheManager.getStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(5);
    });
  });
});
