import { InMemoryMetricProvider } from '../src/metrics/providers/in-memory-metric';
import { MetricType } from '../src/interfaces';

describe('InMemoryMetricProvider', () => {
  let provider: InMemoryMetricProvider;

  beforeEach(async () => {
    provider = new InMemoryMetricProvider(10000);
    await provider.configure({});
  });

  afterEach(async () => {
    await provider.shutdown();
  });

  it('should record and query metrics', async () => {
    const now = new Date();
    await provider.record({
      name: 'page_views',
      type: MetricType.COUNTER,
      value: 42,
      tags: { page: '/home' },
      timestamp: now,
    });

    const results = await provider.query('page_views', {}, new Date(now.getTime() - 1000), new Date(now.getTime() + 1000));
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(42);
  });

  it('should filter by tag', async () => {
    const now = new Date();
    await provider.record({ name: 'api_calls', type: MetricType.COUNTER, value: 10, tags: { env: 'prod' }, timestamp: now });
    await provider.record({ name: 'api_calls', type: MetricType.COUNTER, value: 20, tags: { env: 'staging' }, timestamp: now });
    await provider.record({ name: 'api_calls', type: MetricType.COUNTER, value: 30, tags: { env: 'prod' }, timestamp: now });

    const prodResults = await provider.query('api_calls', { env: 'prod' }, new Date(0), new Date());
    expect(prodResults).toHaveLength(2);

    const allResults = await provider.query('api_calls', {}, new Date(0), new Date());
    expect(allResults).toHaveLength(3);
  });

  it('should handle batch recording', async () => {
    const now = new Date();
    const batch = Array.from({ length: 100 }, (_, i) => ({
      name: 'batch_test',
      type: MetricType.COUNTER as const,
      value: i,
      tags: { batch: '1' },
      timestamp: new Date(now.getTime() + i * 1000),
    }));

    await provider.recordBatch(batch);

    const end = new Date(Date.now() + 100000);
    const results = await provider.query('batch_test', {}, new Date(0), end);
    expect(results.length).toBe(100);
    expect(results[0].value).toBe(0);
    expect(results[99].value).toBe(99);
  });

  it('should delete metrics by tag', async () => {
    const now = new Date();
    await provider.record({ name: 'test', type: MetricType.GAUGE, value: 1, tags: { env: 'prod' }, timestamp: now });
    await provider.record({ name: 'test', type: MetricType.GAUGE, value: 2, tags: { env: 'staging' }, timestamp: now });

    await provider.delete('test', { env: 'prod' });
    const results = await provider.query('test', {}, new Date(0), new Date());
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe(2);
  });

  it('should enforce max entries', async () => {
    const small = new InMemoryMetricProvider(5);
    await small.configure({});

    for (let i = 0; i < 10; i++) {
      await small.record({
        name: 'overflow',
        type: MetricType.COUNTER,
        value: i,
        tags: {},
        timestamp: new Date(),
      });
    }

    expect(small.count()).toBe(5);
    await small.shutdown();
  });

  it('should provide stats', async () => {
    const now = new Date();
    await provider.record({ name: 'a', type: MetricType.COUNTER, value: 1, tags: {}, timestamp: now });
    await provider.record({ name: 'a', type: MetricType.COUNTER, value: 2, tags: {}, timestamp: now });
    await provider.record({ name: 'b', type: MetricType.GAUGE, value: 3, tags: {}, timestamp: now });

    const stats = provider.getStats();
    expect(stats.totalMetrics).toBe(3);
    expect(stats.uniqueNames).toBe(2);
  });
});
