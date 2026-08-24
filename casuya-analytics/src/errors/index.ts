export class AnalyticsError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode = 500,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'AnalyticsError';
  }
}

export class CollectorError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'COLLECTOR_ERROR', 502, details);
    this.name = 'CollectorError';
  }
}

export class MetricError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'METRIC_ERROR', 500, details);
    this.name = 'MetricError';
  }
}

export class PipelineError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PIPELINE_ERROR', 500, details);
    this.name = 'PipelineError';
  }
}

export class PredictionError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'PREDICTION_ERROR', 500, details);
    this.name = 'PredictionError';
  }
}

export class ExportError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'EXPORT_ERROR', 500, details);
    this.name = 'ExportError';
  }
}

export class CacheError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CACHE_ERROR', 500, details);
    this.name = 'CacheError';
  }
}

export class RetentionError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'RETENTION_ERROR', 500, details);
    this.name = 'RetentionError';
  }
}

export class ValidationError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class ConfigurationError extends AnalyticsError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

export class ProviderNotFoundError extends AnalyticsError {
  constructor(providerType: string, name: string) {
    super(
      `Provider '${name}' of type '${providerType}' not found`,
      'PROVIDER_NOT_FOUND',
      404,
      { providerType, providerName: name },
    );
    this.name = 'ProviderNotFoundError';
  }
}

export class DuplicateProviderError extends AnalyticsError {
  constructor(providerType: string, name: string) {
    super(
      `Provider '${name}' of type '${providerType}' is already registered`,
      'DUPLICATE_PROVIDER',
      409,
      { providerType, providerName: name },
    );
    this.name = 'DuplicateProviderError';
  }
}
