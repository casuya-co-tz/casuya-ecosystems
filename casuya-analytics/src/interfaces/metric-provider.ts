import { MetricValue, TimeSeriesPoint } from './types';

export interface MetricProvider {
  readonly name: string;
  configure(options: Record<string, unknown>): Promise<void>;
  record(value: MetricValue): Promise<void>;
  recordBatch(values: MetricValue[]): Promise<void>;
  query(name: string, tags: Record<string, string>, start: Date, end: Date): Promise<TimeSeriesPoint[]>;
  delete(name: string, tags: Record<string, string>): Promise<void>;
  shutdown(): Promise<void>;
}
