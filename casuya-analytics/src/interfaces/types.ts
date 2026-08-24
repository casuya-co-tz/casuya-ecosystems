export enum EventCategory {
  USER_ACTION = 'user_action',
  SYSTEM_EVENT = 'system_event',
  PERFORMANCE = 'performance',
  BUSINESS = 'business',
  ERROR = 'error',
  CUSTOM = 'custom',
}

export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  TIMER = 'timer',
}

export enum AggregationType {
  SUM = 'sum',
  AVG = 'avg',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  PERCENTILE_50 = 'p50',
  PERCENTILE_90 = 'p90',
  PERCENTILE_95 = 'p95',
  PERCENTILE_99 = 'p99',
  UNIQUE = 'unique',
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PARQUET = 'parquet',
  AVRO = 'avro',
  EXCEL = 'xlsx',
}

export enum RetentionStrategy {
  DELETE = 'delete',
  ARCHIVE = 'archive',
  AGGREGATE = 'aggregate',
  ANONYMIZE = 'anonymize',
}

export enum CacheStrategy {
  LRU = 'lru',
  TTL = 'ttl',
  FIFO = 'fifo',
  LIFO = 'lifo',
}

export interface AnalyticsEvent {
  id: string;
  category: EventCategory;
  name: string;
  source: string;
  timestamp: Date;
  payload: Record<string, unknown>;
  user_id?: string;
  school_id?: string;
  session_id?: string;
  correlation_id?: string;
  metadata?: Record<string, unknown>;
}

export interface MetricValue {
  name: string;
  type: MetricType;
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
  labels?: Record<string, string>;
}

export interface AggregationResult {
  id: string;
  type: AggregationType;
  field: string;
  value: number;
  group_by: Record<string, string>;
  time_bucket: string;
  start_time: Date;
  end_time: Date;
  metadata?: Record<string, unknown>;
}

export interface TimeSeriesPoint {
  timestamp: Date;
  value: number;
  tags?: Record<string, string>;
}

export interface PredictionResult {
  id: string;
  metric: string;
  model: string;
  predicted_value: number;
  confidence_interval: [number, number];
  confidence_level: number;
  forecast_horizon: string;
  generated_at: Date;
  valid_until: Date;
  metadata?: Record<string, unknown>;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  metrics: string[];
  filters: ReportFilter[];
  group_by: string[];
  time_range: TimeRange;
  format: ExportFormat;
  schedule?: ScheduleConfig;
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'regex';
  value: unknown;
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'raw' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly' | 'cron';
  cron_expression?: string;
  timezone: string;
  recipients: string[];
}

export interface RetentionRule {
  id: string;
  match: RetentionMatch;
  strategy: RetentionStrategy;
  ttl: string;
  priority: number;
}

export interface RetentionMatch {
  category?: EventCategory;
  metric_name?: string;
  source?: string;
  tags?: Record<string, string>;
}

export interface PipelineConfig {
  id: string;
  name: string;
  stages: PipelineStageConfig[];
  error_handler?: string;
  max_retries?: number;
}

export interface PipelineStageConfig {
  name: string;
  type: 'filter' | 'transform' | 'aggregate' | 'enrich' | 'sink';
  config: Record<string, unknown>;
}

export interface RetentionResult {
  rule_id: string;
  affected_records: number;
  strategy: string;
  executed_at: Date;
  success: boolean;
  error?: string;
}
