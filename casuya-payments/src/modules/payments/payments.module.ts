import { Module } from '../module.interface';
import { PaymentService } from './services/payment.service';
import { PaymentEngine } from '../../core/engine/payment.engine';
import { ProviderRegistry } from '../../core/providers/provider.registry';
import { TransactionManager } from '../../core/management/transaction.manager';
import { EventBusImpl } from '../../events/event-bus';

export class PaymentsModule implements Module {
  private _paymentService: PaymentService | undefined;
  private _paymentEngine: PaymentEngine | undefined;
  private _providerRegistry: ProviderRegistry | undefined;
  private _transactionManager: TransactionManager | undefined;
  private _eventBus: EventBusImpl | undefined;

  async initialize(): Promise<void> {
    this._eventBus = new EventBusImpl();
    this._transactionManager = new TransactionManager(this._eventBus);
    this._providerRegistry = new ProviderRegistry(this._eventBus);
    this._paymentEngine = new PaymentEngine(this._transactionManager, this._eventBus);
    this._paymentService = new PaymentService(
      this._paymentEngine,
      this._providerRegistry,
      this._eventBus
    );

    this.eventBus.publish({
      id: `module_initialized_${Date.now()}`,
      type: 'MODULE_INITIALIZED',
      payload: { module: 'PaymentsModule' },
      timestamp: new Date(),
      source: 'PaymentsModule',
    });
  }

  get paymentService(): PaymentService {
    if (!this._paymentService) {
      throw new Error('PaymentsModule not initialized. Call initialize() first.');
    }
    return this._paymentService;
  }

  get paymentEngine(): PaymentEngine {
    if (!this._paymentEngine) {
      throw new Error('PaymentsModule not initialized. Call initialize() first.');
    }
    return this._paymentEngine;
  }

  get providerRegistry(): ProviderRegistry {
    if (!this._providerRegistry) {
      throw new Error('PaymentsModule not initialized. Call initialize() first.');
    }
    return this._providerRegistry;
  }

  get transactionManager(): TransactionManager {
    if (!this._transactionManager) {
      throw new Error('PaymentsModule not initialized. Call initialize() first.');
    }
    return this._transactionManager;
  }

  get eventBus(): EventBusImpl {
    if (!this._eventBus) {
      throw new Error('PaymentsModule not initialized. Call initialize() first.');
    }
    return this._eventBus;
  }

  async terminate(): Promise<void> {
    this.eventBus.publish({
      id: `module_terminating_${Date.now()}`,
      type: 'MODULE_TERMINATING',
      payload: { module: 'PaymentsModule' },
      timestamp: new Date(),
      source: 'PaymentsModule',
    });

    this._paymentService = undefined;
    this._paymentEngine = undefined;
    this._providerRegistry = undefined;
    this._transactionManager = undefined;
    this._eventBus = undefined;
  }
}
