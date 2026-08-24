import { PredictionProvider, PredictionResult, TimeSeriesPoint, TimeRange } from '../interfaces';

export class PredictionEngine {
  private providers: Map<string, PredictionProvider> = new Map();

  register(provider: PredictionProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Prediction provider '${provider.name}' is already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  get(name: string): PredictionProvider | undefined {
    return this.providers.get(name);
  }

  getAll(): PredictionProvider[] {
    return Array.from(this.providers.values());
  }

  async trainAll(metric: string, data: TimeSeriesPoint[]): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.train(metric, data);
    }
  }

  async predictFromAll(metric: string, horizon: string, range: TimeRange): Promise<Map<string, PredictionResult>> {
    const results = new Map<string, PredictionResult>();
    for (const [name, provider] of this.providers) {
      results.set(name, await provider.predict(metric, horizon, range));
    }
    return results;
  }

  async shutdownAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}
