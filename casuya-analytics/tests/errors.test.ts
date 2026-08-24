import {
  AnalyticsError,
  CollectorError,
  MetricError,
  PipelineError,
  PredictionError,
  ExportError,
  CacheError,
  RetentionError,
  ValidationError,
  ConfigurationError,
  ProviderNotFoundError,
  DuplicateProviderError,
} from '../src/errors';

describe('Error types', () => {
  it('should create AnalyticsError with code and status', () => {
    const err = new AnalyticsError('Something broke', 'FAIL', 500);
    expect(err.message).toBe('Something broke');
    expect(err.code).toBe('FAIL');
    expect(err.statusCode).toBe(500);
    expect(err.name).toBe('AnalyticsError');
  });

  it('should create CollectorError', () => {
    const err = new CollectorError('collect failed', { source: 'api' });
    expect(err).toBeInstanceOf(AnalyticsError);
    expect(err.code).toBe('COLLECTOR_ERROR');
    expect(err.statusCode).toBe(502);
  });

  it('should create MetricError', () => {
    const err = new MetricError('bad metric');
    expect(err.code).toBe('METRIC_ERROR');
    expect(err.statusCode).toBe(500);
  });

  it('should create PipelineError', () => {
    const err = new PipelineError('pipeline broke');
    expect(err.code).toBe('PIPELINE_ERROR');
  });

  it('should create PredictionError', () => {
    const err = new PredictionError('no data');
    expect(err.code).toBe('PREDICTION_ERROR');
  });

  it('should create ExportError', () => {
    const err = new ExportError('export failed');
    expect(err.code).toBe('EXPORT_ERROR');
  });

  it('should create CacheError', () => {
    const err = new CacheError('cache miss');
    expect(err.code).toBe('CACHE_ERROR');
  });

  it('should create RetentionError', () => {
    const err = new RetentionError('retention issue');
    expect(err.code).toBe('RETENTION_ERROR');
  });

  it('should create ValidationError with 400', () => {
    const err = new ValidationError('invalid input', { field: 'name' });
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ field: 'name' });
  });

  it('should create ConfigurationError', () => {
    const err = new ConfigurationError('bad config');
    expect(err.code).toBe('CONFIGURATION_ERROR');
  });

  it('should create ProviderNotFoundError', () => {
    const err = new ProviderNotFoundError('cache', 'redis');
    expect(err.code).toBe('PROVIDER_NOT_FOUND');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('redis');
    expect(err.message).toContain('cache');
  });

  it('should create DuplicateProviderError', () => {
    const err = new DuplicateProviderError('metric', 'in-memory');
    expect(err.code).toBe('DUPLICATE_PROVIDER');
    expect(err.statusCode).toBe(409);
  });
});
