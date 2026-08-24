import { CacheProvider } from '../interfaces';

export class CacheRegistry {
  private providers: Map<string, CacheProvider> = new Map();
  private defaultProvider: string | null = null;

  register(name: string, provider: CacheProvider, setAsDefault = false): void {
    if (this.providers.has(name)) {
      throw new Error(`Cache provider '${name}' is already registered`);
    }
    this.providers.set(name, provider);
    if (setAsDefault || this.providers.size === 1) {
      this.defaultProvider = name;
    }
  }

  unregister(name: string): boolean {
    const removed = this.providers.delete(name);
    if (this.defaultProvider === name) {
      this.defaultProvider = this.providers.size > 0
        ? this.providers.keys().next().value ?? null
        : null;
    }
    return removed;
  }

  get(name?: string): CacheProvider | undefined {
    return name ? this.providers.get(name) : this.getDefault();
  }

  getDefault(): CacheProvider | undefined {
    return this.defaultProvider ? this.providers.get(this.defaultProvider) : undefined;
  }

  getAll(): CacheProvider[] {
    return Array.from(this.providers.values());
  }

  async shutdownAll(): Promise<void> {
    for (const provider of this.providers.values()) {
      await provider.shutdown();
    }
  }
}
