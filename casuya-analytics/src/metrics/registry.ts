import { MetricProvider, MetricValue } from '../interfaces';

export class MetricRegistry {
  private providers: Map<string, MetricProvider> = new Map();

  register(provider: MetricProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Metric provider '${provider.name}' is already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  get(name: string): MetricProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): MetricProvider[] {
    return Array.from(this.providers.values());
  }

  async recordToAll(value: MetricValue): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.record(value);
    }
  }

  async batchToAll(values: MetricValue[]): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.recordBatch(values);
    }
  }

  async shutdownAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}
