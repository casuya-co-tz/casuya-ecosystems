import { MetricValue, TimeSeriesPoint } from '../../interfaces';
import { BaseMetricProvider } from '../base-metric';

interface MetricEntry {
  value: MetricValue;
  ingestedAt: Date;
}

export class InMemoryMetricProvider extends BaseMetricProvider {
  readonly name = 'in-memory-metrics';
  private store: MetricEntry[] = [];
  private maxEntries: number;

  constructor(maxEntries = 100000) {
    super();
    this.maxEntries = maxEntries;
  }

  async configure(options: Record<string, unknown>): Promise<void> {
    if (typeof options.maxEntries === 'number') {
      this.maxEntries = options.maxEntries;
    }
    this.initialized = true;
  }

  async record(value: MetricValue): Promise<void> {
    this.ensureInitialized();
    this.store.push({ value, ingestedAt: new Date() });

    if (this.store.length > this.maxEntries) {
      this.store.splice(0, this.store.length - this.maxEntries);
    }
  }

  async recordBatch(values: MetricValue[]): Promise<void> {
    this.ensureInitialized();
    for (const value of values) {
      this.store.push({ value, ingestedAt: new Date() });
    }

    if (this.store.length > this.maxEntries) {
      this.store.splice(0, this.store.length - this.maxEntries);
    }
  }

  async query(
    name: string,
    tags: Record<string, string>,
    start: Date,
    end: Date,
  ): Promise<TimeSeriesPoint[]> {
    this.ensureInitialized();

    const tagEntries = Object.entries(tags);

    return this.store
      .filter(entry => {
        if (entry.value.name !== name) return false;
        if (entry.value.timestamp < start || entry.value.timestamp > end) return false;
        for (const [key, value] of tagEntries) {
          if (entry.value.tags[key] !== value) return false;
        }
        return true;
      })
      .map(entry => ({
        timestamp: entry.value.timestamp,
        value: entry.value.value,
        tags: entry.value.tags,
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async delete(name: string, tags: Record<string, string>): Promise<void> {
    this.ensureInitialized();
    const tagEntries = Object.entries(tags);

    this.store = this.store.filter(entry => {
      if (entry.value.name !== name) return true;
      for (const [key, value] of tagEntries) {
        if (entry.value.tags[key] === value) return false;
      }
      return true;
    });
  }

  getStats(): { totalMetrics: number; uniqueNames: number; oldest: Date | null; newest: Date | null } {
    if (this.store.length === 0) {
      return { totalMetrics: 0, uniqueNames: 0, oldest: null, newest: null };
    }

    const names = new Set(this.store.map(e => e.value.name));
    const times = this.store.map(e => e.value.timestamp);

    return {
      totalMetrics: this.store.length,
      uniqueNames: names.size,
      oldest: new Date(Math.min(...times.map(t => t.getTime()))),
      newest: new Date(Math.max(...times.map(t => t.getTime()))),
    };
  }

  count(): number {
    return this.store.length;
  }

  private ensureInitialized(): void {
    if (!this.initialized) throw new Error('InMemoryMetricProvider not initialized');
  }
}
