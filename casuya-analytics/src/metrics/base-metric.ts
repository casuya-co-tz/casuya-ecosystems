import { MetricValue, TimeSeriesPoint } from '../interfaces';
import { MetricProvider } from '../interfaces';

export abstract class BaseMetricProvider implements MetricProvider {
  public abstract readonly name: string;
  protected initialized = false;

  abstract configure(options: Record<string, unknown>): Promise<void>;

  abstract record(value: MetricValue): Promise<void>;

  abstract recordBatch(values: MetricValue[]): Promise<void>;

  abstract query(
    name: string,
    tags: Record<string, string>,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]>;

  abstract delete(name: string, tags: Record<string, string>): Promise<void>;

  async shutdown(): Promise<void> {
    this.initialized = false;
  }
}
