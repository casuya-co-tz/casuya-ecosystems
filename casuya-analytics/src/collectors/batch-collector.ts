import { AnalyticsEvent } from '../interfaces';
import { BaseCollector } from './base-collector';
import { CollectorConfig } from '../interfaces';

interface BufferedEvent {
  event: AnalyticsEvent;
  receivedAt: Date;
}

export class BatchCollector extends BaseCollector {
  readonly name = 'batch-collector';
  private buffer: BufferedEvent[] = [];
  private flushInterval: number = 60000;
  private maxBatchSize: number = 1000;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushCallback: ((events: AnalyticsEvent[]) => Promise<void>) | null = null;

  async initialize(config: CollectorConfig): Promise<void> {
    await super.initialize(config);
    this.maxBatchSize = (config.options?.maxBatchSize as number) ?? 1000;
    this.flushInterval = (config.options?.flushIntervalMs as number) ?? 60000;

    if (this.flushInterval > 0) {
      this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    }
  }

  onFlush(callback: (events: AnalyticsEvent[]) => Promise<void>): void {
    this.flushCallback = callback;
  }

  add(event: AnalyticsEvent): void {
    this.buffer.push({ event, receivedAt: new Date() });

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  addBatch(events: AnalyticsEvent[]): void {
    for (const event of events) {
      this.buffer.push({ event, receivedAt: new Date() });
    }

    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  async collect(): Promise<AnalyticsEvent[]> {
    const events = this.buffer.map(b => b.event);
    this.buffer = [];
    return events;
  }

  bufferSize(): number {
    return this.buffer.length;
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.maxBatchSize);
    const events = batch.map(b => b.event);

    if (this.flushCallback) {
      try {
        await this.flushCallback(events);
      } catch (err) {
        console.error('[BatchCollector] Flush callback failed:', err);
        this.buffer.unshift(...batch);
      }
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
    await super.shutdown();
  }
}
