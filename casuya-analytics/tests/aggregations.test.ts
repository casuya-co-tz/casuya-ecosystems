import { AggregationEngineImpl } from '../src/aggregations/engine';
import { AggregationType, MetricType, TimeRange } from '../src/interfaces';

describe('AggregationEngineImpl', () => {
  let engine: AggregationEngineImpl;

  beforeEach(async () => {
    engine = new AggregationEngineImpl();
    await engine.initialize();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  it('should aggregate sum correctly', () => {
    const now = new Date();
    for (let i = 1; i <= 5; i++) {
      engine.ingest('test_metric', {
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: i * 10,
        tags: { env: 'prod' },
        timestamp: new Date(now.getTime() + i * 1000),
      });
    }

    const range: TimeRange = {
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 10000),
      granularity: 'minute',
    };

    return engine.aggregate('test_metric', {
      type: AggregationType.SUM,
      field: 'value',
      group_by: [],
      time_bucket: 'day',
    }, range).then(results => {
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].value).toBe(150);
    });
  });

  it('should aggregate avg correctly', () => {
    const now = new Date();
    [10, 20, 30, 40, 50].forEach((v, i) => {
      engine.ingest('avg_test', {
        name: 'avg_test',
        type: MetricType.GAUGE,
        value: v,
        tags: {},
        timestamp: new Date(now.getTime() + i * 1000),
      });
    });

    const range: TimeRange = {
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 10000),
      granularity: 'day',
    };

    return engine.aggregate('avg_test', {
      type: AggregationType.AVG,
      field: 'value',
      group_by: [],
      time_bucket: 'day',
    }, range).then(results => {
      expect(results[0].value).toBe(30);
    });
  });

  it('should aggregate min and max', () => {
    const now = new Date();
    [5, 50, 20, 3, 100].forEach((v, i) => {
      engine.ingest('range_test', {
        name: 'range_test',
        type: MetricType.GAUGE,
        value: v,
        tags: {},
        timestamp: new Date(now.getTime() + i * 1000),
      });
    });

    const range: TimeRange = {
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 10000),
      granularity: 'day',
    };

    return Promise.all([
      engine.aggregate('range_test', { type: AggregationType.MIN, field: 'value', group_by: [], time_bucket: 'day' }, range),
      engine.aggregate('range_test', { type: AggregationType.MAX, field: 'value', group_by: [], time_bucket: 'day' }, range),
    ]).then(([minRes, maxRes]) => {
      expect(minRes[0].value).toBe(3);
      expect(maxRes[0].value).toBe(100);
    });
  });

  it('should calculate percentile correctly', () => {
    const now = new Date();
    for (let i = 1; i <= 100; i++) {
      engine.ingest('pct_test', {
        name: 'pct_test',
        type: MetricType.HISTOGRAM,
        value: i,
        tags: {},
        timestamp: new Date(now.getTime() + i * 100),
      });
    }

    const range: TimeRange = {
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 20000),
      granularity: 'day',
    };

    return Promise.all([
      engine.aggregate('pct_test', { type: AggregationType.PERCENTILE_50, field: 'value', group_by: [], time_bucket: 'day' }, range),
      engine.aggregate('pct_test', { type: AggregationType.PERCENTILE_90, field: 'value', group_by: [], time_bucket: 'day' }, range),
      engine.aggregate('pct_test', { type: AggregationType.PERCENTILE_99, field: 'value', group_by: [], time_bucket: 'day' }, range),
    ]).then(([p50, p90, p99]) => {
      expect(p50[0].value).toBeCloseTo(50.5, 0);
      expect(p90[0].value).toBeCloseTo(90.5, 0);
      expect(p99[0].value).toBeCloseTo(99.5, 0);
    });
  });

  it('should group by tags', () => {
    const now = new Date();
    const groups = ['a', 'a', 'b', 'b', 'b'];
    groups.forEach((g, i) => {
      engine.ingest('group_test', {
        name: 'group_test',
        type: MetricType.COUNTER,
        value: i * 10,
        tags: { group: g },
        timestamp: new Date(now.getTime() + i * 1000),
      });
    });

    const range: TimeRange = {
      start: new Date(now.getTime() - 1000),
      end: new Date(now.getTime() + 10000),
      granularity: 'day',
    };

    return engine.aggregate('group_test', {
      type: AggregationType.COUNT,
      field: 'value',
      group_by: ['group'],
      time_bucket: 'day',
    }, range).then(results => {
      expect(results.length).toBe(2);
      const groupA = results.find(r => r.group_by.group === 'a');
      const groupB = results.find(r => r.group_by.group === 'b');
      expect(groupA?.value).toBe(2);
      expect(groupB?.value).toBe(3);
    });
  });

  it('should return empty for nonexistent metric', () => {
    const range: TimeRange = {
      start: new Date(0),
      end: new Date(),
      granularity: 'day',
    };
    return engine.aggregate('nonexistent', {
      type: AggregationType.SUM,
      field: 'value',
      group_by: [],
      time_bucket: 'day',
    }, range).then(results => {
      expect(results).toEqual([]);
    });
  });

  it('should rollup data', async () => {
    const now = new Date();
    for (let i = 1; i <= 10; i++) {
      engine.ingest('source_metric', {
        name: 'source_metric',
        type: MetricType.COUNTER,
        value: i,
        tags: {},
        timestamp: new Date(now.getTime() + i * 1000),
      });
    }

    await engine.rollup('source_metric', 'dest_metric', {
      type: AggregationType.SUM,
      field: 'value',
      group_by: [],
      time_bucket: 'day',
    });

    const range: TimeRange = {
      start: new Date(0),
      end: new Date(),
      granularity: 'day',
    };

    const results = await engine.aggregate('dest_metric', {
      type: AggregationType.SUM,
      field: 'value',
      group_by: [],
      time_bucket: 'day',
    }, range);

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].value).toBe(55);
  });
});
