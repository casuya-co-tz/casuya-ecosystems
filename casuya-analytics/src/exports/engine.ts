import { ExportFormat, ExportProvider } from '../interfaces';

export class ExportEngine {
  private providers: Map<string, ExportProvider> = new Map();

  register(provider: ExportProvider): void {
    if (this.providers.has(provider.name)) {
      throw new Error(`Export provider '${provider.name}' is already registered`);
    }
    this.providers.set(provider.name, provider);
  }

  unregister(name: string): boolean {
    return this.providers.delete(name);
  }

  get(name: string): ExportProvider | undefined {
    return this.providers.get(name);
  }

  getByFormat(format: ExportFormat): ExportProvider[] {
    return this.getAll().filter(p => p.supportedFormats.includes(format));
  }

  getAll(): ExportProvider[] {
    return Array.from(this.providers.values());
  }

  async export(data: Record<string, unknown>[], format: ExportFormat): Promise<string> {
    const providers = this.getByFormat(format);
    if (providers.length === 0) {
      throw new Error(`No export provider found for format '${format}'`);
    }
    return providers[0].export(data);
  }

  async shutdownAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}
