import { randomUUID } from 'crypto';
import { ITransaction, EventBus, TransactionType, TransactionStatus } from '../../interfaces';

export class TransactionManager {
  private transactions: Map<string, ITransaction> = new Map();
  private payments: Map<string, string> = new Map();

  constructor(private eventBus: EventBus) {}

  async createTransaction(transactionData: Partial<ITransaction>): Promise<ITransaction> {
    const transaction: ITransaction = {
      id: `txn_${randomUUID()}`,
      payment_id: transactionData.payment_id || '',
      amount: transactionData.amount || 0,
      currency: transactionData.currency || 'USD',
      type: transactionData.type || TransactionType.PAYMENT,
      status: transactionData.status || TransactionStatus.PENDING,
      provider: transactionData.provider || '',
      provider_transaction_id: transactionData.provider_transaction_id || `${transactionData.type || TransactionType.PAYMENT}_${randomUUID()}`,
      metadata: transactionData.metadata || {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.transactions.set(transaction.id, transaction);

    this.eventBus.publish({
      id: `txn_created_${randomUUID()}`,
      type: 'TRANSACTION_CREATED',
      payload: { transaction },
      timestamp: new Date(),
      source: 'TransactionManager',
    });

    return transaction;
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    return transaction;
  }

  async getTransactionByPaymentId(paymentId: string): Promise<ITransaction | undefined> {
    return Array.from(this.transactions.values()).find(t => t.payment_id === paymentId);
  }

  async updateTransaction(transactionId: string, updates: Partial<ITransaction>): Promise<ITransaction> {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }

    const updated: ITransaction = {
      ...transaction,
      ...updates,
      updated_at: new Date(),
    };

    this.transactions.set(transactionId, updated);

    this.eventBus.publish({
      id: `txn_updated_${randomUUID()}`,
      type: 'TRANSACTION_UPDATED',
      payload: { transaction: updated },
      timestamp: new Date(),
      source: 'TransactionManager',
    });

    return updated;
  }

  async listTransactions(): Promise<ITransaction[]> {
    return Array.from(this.transactions.values());
  }

  async associatePaymentWithTransaction(paymentId: string, transactionId: string): Promise<void> {
    this.payments.set(paymentId, transactionId);
  }

  getAssociatedTransactionId(paymentId: string): string | undefined {
    return this.payments.get(paymentId);
  }
}
