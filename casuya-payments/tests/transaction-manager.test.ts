import { TransactionManager } from '../src/core/management/transaction.manager';
import { EventBusImpl } from '../src/events/event-bus';
import { TransactionType, TransactionStatus } from '../src/interfaces';

describe('TransactionManager', () => {
  let eventBus: EventBusImpl;
  let manager: TransactionManager;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    manager = new TransactionManager(eventBus);
  });

  describe('createTransaction', () => {
    it('should create a transaction with defaults', async () => {
      const txn = await manager.createTransaction({});
      expect(txn.id).toMatch(/^txn_/);
      expect(txn.amount).toBe(0);
      expect(txn.currency).toBe('USD');
      expect(txn.type).toBe(TransactionType.PAYMENT);
      expect(txn.status).toBe(TransactionStatus.PENDING);
      expect(txn.created_at).toBeInstanceOf(Date);
    });

    it('should create a transaction with provided data', async () => {
      const txn = await manager.createTransaction({
        payment_id: 'pay_123',
        amount: 5000,
        currency: 'EUR',
        type: TransactionType.REFUND,
        status: TransactionStatus.COMPLETED,
        provider: 'stripe',
        metadata: { note: 'test' },
      });
      expect(txn.payment_id).toBe('pay_123');
      expect(txn.amount).toBe(5000);
      expect(txn.currency).toBe('EUR');
      expect(txn.type).toBe(TransactionType.REFUND);
      expect(txn.status).toBe(TransactionStatus.COMPLETED);
      expect(txn.provider).toBe('stripe');
      expect(txn.metadata).toEqual({ note: 'test' });
    });

    it('should publish TRANSACTION_CREATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('TRANSACTION_CREATED', handler);
      await manager.createTransaction({ amount: 100 });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.transaction.amount).toBe(100);
    });

    it('should generate unique ids', async () => {
      const t1 = await manager.createTransaction({});
      const t2 = await manager.createTransaction({});
      expect(t1.id).not.toBe(t2.id);
    });
  });

  describe('getTransaction', () => {
    it('should retrieve a created transaction', async () => {
      const created = await manager.createTransaction({ amount: 200 });
      const retrieved = await manager.getTransaction(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.amount).toBe(200);
    });

    it('should throw for non-existent transaction', async () => {
      await expect(manager.getTransaction('txn_nonexistent')).rejects.toThrow('Transaction not found');
    });
  });

  describe('getTransactionByPaymentId', () => {
    it('should find transaction by payment_id', async () => {
      await manager.createTransaction({ payment_id: 'pay_abc', amount: 100 });
      const result = await manager.getTransactionByPaymentId('pay_abc');
      expect(result).toBeDefined();
      expect(result!.payment_id).toBe('pay_abc');
    });

    it('should return undefined for unknown payment_id', async () => {
      const result = await manager.getTransactionByPaymentId('pay_unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction fields', async () => {
      const created = await manager.createTransaction({});
      const updated = await manager.updateTransaction(created.id, { status: TransactionStatus.COMPLETED, amount: 999 });
      expect(updated.status).toBe(TransactionStatus.COMPLETED);
      expect(updated.amount).toBe(999);
      expect(updated.updated_at.getTime()).toBeGreaterThanOrEqual(created.updated_at.getTime());
    });

    it('should throw for non-existent transaction', async () => {
      await expect(manager.updateTransaction('txn_fake', { amount: 100 })).rejects.toThrow('Transaction not found');
    });

    it('should publish TRANSACTION_UPDATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('TRANSACTION_UPDATED', handler);
      const created = await manager.createTransaction({});
      await manager.updateTransaction(created.id, { amount: 500 });
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('listTransactions', () => {
    it('should list all transactions', async () => {
      await manager.createTransaction({ amount: 10 });
      await manager.createTransaction({ amount: 20 });
      await manager.createTransaction({ amount: 30 });
      const all = await manager.listTransactions();
      expect(all).toHaveLength(3);
    });

    it('should return empty array when no transactions', async () => {
      const all = await manager.listTransactions();
      expect(all).toHaveLength(0);
    });
  });

  describe('associatePaymentWithTransaction', () => {
    it('should associate and retrieve payment-transaction mapping', async () => {
      await manager.associatePaymentWithTransaction('pay_1', 'txn_1');
      expect(manager.getAssociatedTransactionId('pay_1')).toBe('txn_1');
    });

    it('should return undefined for unknown payment', () => {
      expect(manager.getAssociatedTransactionId('pay_unknown')).toBeUndefined();
    });
  });
});
