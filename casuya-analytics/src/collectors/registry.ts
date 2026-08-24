import { CollectorProvider, CollectorConfig } from '../interfaces';

export class CollectorRegistry {
  private providers: Map<string, CollectorProvider> = new Map();

  register(provider: CollectorProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Collector '${provider.name}' is already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  get(name: string): CollectorProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): CollectorProvider[] {
    return Array.from(this.providers.values());
  }

  async initializeAll(configs: CollectorConfig[]): Promise<void> {
    for (const config of configs) {
      const provider = this.providers.get(config.name);
      if (provider && config.enabled) {
        await provider.initialize(config);
      }
    }
  }

  async collectAll(): Promise<Map<string, ReturnType<CollectorProvider['collect']>>> {
    const results = new Map<string, ReturnType<CollectorProvider['collect']>>();
    for (const [name, provider] of this.providers) {
      results.set(name, provider.collect());
    }
    return results;
  }

  async shutdownAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}
