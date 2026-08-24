import { Module } from '../module.interface';
import { TransactionManager } from '../../core/management/transaction.manager';
import { EventBusImpl } from '../../events/event-bus';

export class TransactionModule implements Module {
  private _manager: TransactionManager | undefined;

  constructor(private eventBus: EventBusImpl) {}

  async initialize(): Promise<void> {
    this._manager = new TransactionManager(this.eventBus);
  }

  get manager(): TransactionManager {
    if (!this._manager) throw new Error('TransactionModule not initialized');
    return this._manager;
  }

  async terminate(): Promise<void> {
    this._manager = undefined;
  }
}
