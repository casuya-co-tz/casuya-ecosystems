import { AggregationResult, AggregationType, TimeRange } from './types';

export interface AggregationConfig {
  type: AggregationType;
  field: string;
  group_by: string[];
  time_bucket: string;
}

export interface AggregationEngine {
  readonly name: string;
  initialize(): Promise<void>;
  aggregate(metric: string, config: AggregationConfig, range: TimeRange): Promise<AggregationResult[]>;
  rollup(source: string, destination: string, config: AggregationConfig): Promise<void>;
  shutdown(): Promise<void>;
}
