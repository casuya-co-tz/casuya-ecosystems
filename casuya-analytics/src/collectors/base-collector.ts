import { AnalyticsEvent } from '../interfaces';
import { CollectorConfig, CollectorProvider } from '../interfaces';

export abstract class BaseCollector implements CollectorProvider {
  public abstract readonly name: string;
  protected config!: CollectorConfig;
  protected initialized = false;

  async initialize(config: CollectorConfig): Promise<void> {
    this.config = config;
    this.initialized = true;
  }

  abstract collect(): Promise<AnalyticsEvent[]>;

  validate(event: AnalyticsEvent): boolean {
    return !!(event.id && event.name && event.timestamp && event.category);
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }
}
