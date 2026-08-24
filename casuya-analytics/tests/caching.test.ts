import { InMemoryCacheProvider } from '../src/caching/engine';
import { CacheRegistry } from '../src/caching/registry';
import { CacheStrategy } from '../src/interfaces';

describe('InMemoryCacheProvider', () => {
  let cache: InMemoryCacheProvider;

  beforeEach(async () => {
    cache = new InMemoryCacheProvider();
    await cache.configure({ strategy: CacheStrategy.LRU, max_size: 1000 });
  });

  afterEach(async () => {
    await cache.shutdown();
  });

  it('should set and get values', async () => {
    await cache.set('key1', 'value1');
    expect(await cache.get('key1')).toBe('value1');
  });

  it('should return null for missing keys', async () => {
    expect(await cache.get('missing')).toBeNull();
  });

  it('should respect TTL', async () => {
    await cache.set('temp', 'value', 0);
    expect(await cache.get('temp')).toBeNull();
  });

  it('should delete keys', async () => {
    await cache.set('key', 'val');
    expect(await cache.delete('key')).toBe(true);
    expect(await cache.get('key')).toBeNull();
  });

  it('should check existence', async () => {
    await cache.set('exists', 'yes');
    expect(await cache.has('exists')).toBe(true);
    expect(await cache.has('no')).toBe(false);
  });

  it('should clear all entries', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.clear();
    expect(await cache.get('a')).toBeNull();
    expect(await cache.get('b')).toBeNull();
  });

  it('should track hit rate', async () => {
    await cache.set('hit', 'yes');
    await cache.get('hit');
    await cache.get('miss1');
    await cache.get('miss2');

    const stats = await cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(2);
    expect(stats.hit_rate).toBeCloseTo(1 / 3);
  });

  it('should evict LRU when max size reached', async () => {
    const small = new InMemoryCacheProvider();
    await small.configure({ strategy: CacheStrategy.LRU, max_size: 3 });

    await small.set('a', 1);
    await small.set('b', 2);
    await small.set('c', 3);
    await small.get('a');
    await small.set('d', 4);

    const stats = await small.getStats();
    expect(stats.size).toBe(3);
    await small.shutdown();
  });

  it('should handle complex objects', async () => {
    const obj = { nested: { array: [1, 2, 3] }, date: new Date('2026-01-01') };
    await cache.set('obj', obj);
    const retrieved = await cache.get<typeof obj>('obj');
    expect(retrieved?.nested.array).toEqual([1, 2, 3]);
  });
});

describe('CacheRegistry', () => {
  it('should register and retrieve providers', () => {
    const registry = new CacheRegistry();
    const provider = new InMemoryCacheProvider();
    registry.register('default', provider, true);

    expect(registry.get()).toBe(provider);
    expect(registry.get('default')).toBe(provider);
  });

  it('should prevent duplicate names', () => {
    const registry = new CacheRegistry();
    registry.register('a', new InMemoryCacheProvider());
    expect(() => registry.register('a', new InMemoryCacheProvider())).toThrow('already registered');
  });

  it('should unregister and fallback', () => {
    const registry = new CacheRegistry();
    const a = new InMemoryCacheProvider();
    registry.register('a', a, true);
    registry.register('b', new InMemoryCacheProvider());

    registry.unregister('a');
    expect(registry.get()).toBeDefined();
  });

  it('should list all providers', () => {
    const registry = new CacheRegistry();
    registry.register('a', new InMemoryCacheProvider());
    registry.register('b', new InMemoryCacheProvider());
    expect(registry.getAll()).toHaveLength(2);
  });
});
