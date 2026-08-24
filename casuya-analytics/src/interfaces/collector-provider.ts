import { AnalyticsEvent } from './types';

export interface CollectorConfig {
  name: string;
  enabled: boolean;
  options?: Record<string, unknown>;
}

export interface CollectorProvider {
  readonly name: string;
  initialize(config: CollectorConfig): Promise<void>;
  collect(): Promise<AnalyticsEvent[]>;
  validate(event: AnalyticsEvent): boolean;
  shutdown(): Promise<void>;
}
