import {
  EventCategory,
  MetricType,
  AggregationType,
  ExportFormat,
  RetentionStrategy,
  CacheStrategy,
} from '../src/interfaces';

describe('Enum values', () => {
  it('EventCategory should have expected values', () => {
    expect(EventCategory.USER_ACTION).toBe('user_action');
    expect(EventCategory.SYSTEM_EVENT).toBe('system_event');
    expect(EventCategory.PERFORMANCE).toBe('performance');
    expect(EventCategory.BUSINESS).toBe('business');
    expect(EventCategory.ERROR).toBe('error');
    expect(EventCategory.CUSTOM).toBe('custom');
  });

  it('MetricType should have expected values', () => {
    expect(MetricType.COUNTER).toBe('counter');
    expect(MetricType.GAUGE).toBe('gauge');
    expect(MetricType.HISTOGRAM).toBe('histogram');
    expect(MetricType.TIMER).toBe('timer');
  });

  it('AggregationType should have expected values', () => {
    expect(AggregationType.PERCENTILE_95).toBe('p95');
    expect(AggregationType.PERCENTILE_99).toBe('p99');
    expect(AggregationType.UNIQUE).toBe('unique');
  });

  it('ExportFormat should have expected values', () => {
    expect(ExportFormat.PARQUET).toBe('parquet');
    expect(ExportFormat.AVRO).toBe('avro');
  });

  it('RetentionStrategy should have expected values', () => {
    expect(RetentionStrategy.ANONYMIZE).toBe('anonymize');
  });

  it('CacheStrategy should have expected values', () => {
    expect(CacheStrategy.LRU).toBe('lru');
    expect(CacheStrategy.TTL).toBe('ttl');
    expect(CacheStrategy.FIFO).toBe('fifo');
    expect(CacheStrategy.LIFO).toBe('lifo');
  });
});
