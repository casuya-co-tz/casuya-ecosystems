import { IPaymentProvider, EventBus, Event } from '../../interfaces';

export class ProviderRegistry {
  private providers: Map<string, IPaymentProvider> = new Map();

  constructor(private eventBus: EventBus) {}

  registerProvider(name: string, provider: IPaymentProvider): void {
    this.providers.set(name, provider);
    this.eventBus.publish({
      id: `evt_provider_registered_${Date.now()}`,
      type: 'PROVIDER_REGISTERED',
      payload: { name, provider },
      timestamp: new Date(),
      source: 'ProviderRegistry',
    });
  }

  getProvider(name: string): IPaymentProvider | undefined {
    return this.providers.get(name);
  }

  getAllProviders(): IPaymentProvider[] {
    return Array.from(this.providers.values());
  }

  removeProvider(name: string): boolean {
    const wasRemoved = this.providers.delete(name);
    if (wasRemoved) {
      this.eventBus.publish({
        id: `evt_provider_removed_${Date.now()}`,
        type: 'PROVIDER_REMOVED',
        payload: { name },
        timestamp: new Date(),
        source: 'ProviderRegistry',
      });
    }
    return wasRemoved;
  }

  listProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}
