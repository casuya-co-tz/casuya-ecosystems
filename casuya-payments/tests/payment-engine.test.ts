import { PaymentEngine } from '../src/core/engine/payment.engine';
import { EventBusImpl } from '../src/events/event-bus';
import { TransactionManager } from '../src/core/management/transaction.manager';
import { PaymentStatus, TransactionStatus } from '../src/interfaces';

describe('PaymentEngine', () => {
  let eventBus: EventBusImpl;
  let transactionManager: TransactionManager;
  let engine: PaymentEngine;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    transactionManager = new TransactionManager(eventBus);
    engine = new PaymentEngine(transactionManager, eventBus);
  });

  describe('createPayment', () => {
    it('should create a payment with pending status', async () => {
      const payment = await engine.createPayment(100, 'USD', { id: 'cust_1', provider: 'stripe' });
      expect(payment.id).toMatch(/^pay_/);
      expect(payment.amount).toBe(100);
      expect(payment.currency).toBe('USD');
      expect(payment.status).toBe(PaymentStatus.PENDING);
      expect(payment.provider).toBe('stripe');
      expect(payment.customer_id).toBe('cust_1');
    });

    it('should use default provider when not specified', async () => {
      const payment = await engine.createPayment(50, 'EUR', {});
      expect(payment.provider).toBe('default');
    });

    it('should store metadata', async () => {
      const payment = await engine.createPayment(100, 'USD', { metadata: { key: 'value' } });
      expect(payment.metadata).toEqual({ key: 'value' });
    });

    it('should publish PAYMENT_CREATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_CREATED', handler);
      await engine.createPayment(100, 'USD', {});
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('retrievePayment', () => {
    it('should retrieve an existing payment', async () => {
      const created = await engine.createPayment(100, 'USD', {});
      const retrieved = await engine.retrievePayment(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.retrievePayment('pay_nonexistent')).rejects.toThrow('Payment not found');
    });
  });

  describe('processPayment', () => {
    it('should change status to processing', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      const processed = await engine.processPayment(payment.id);
      expect(processed.status).toBe(PaymentStatus.PROCESSING);
    });

    it('should create a transaction for the payment', async () => {
      const payment = await engine.createPayment(200, 'EUR', {});
      const handler = jest.fn();
      eventBus.subscribe('TRANSACTION_CREATED', handler);
      await engine.processPayment(payment.id);
      expect(handler).toHaveBeenCalled();
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.processPayment('pay_fake')).rejects.toThrow('Payment not found');
    });

    it('should publish PAYMENT_PROCESSED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_PROCESSED', handler);
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.processPayment(payment.id);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('refundPayment', () => {
    it('should change status to refunded', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.capturePayment(payment.id, 100);
      const refunded = await engine.refundPayment(payment.id);
      expect(refunded.status).toBe(PaymentStatus.REFUNDED);
      expect(refunded.completed_at).toBeInstanceOf(Date);
    });

    it('should refund with specific amount', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_REFUNDED', handler);
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.capturePayment(payment.id, 100);
      await engine.refundPayment(payment.id, 50);
      expect(handler.mock.calls[0][0].payload.refundAmount).toBe(50);
    });

    it('should default refund amount to full payment amount', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_REFUNDED', handler);
      const payment = await engine.createPayment(200, 'USD', {});
      await engine.capturePayment(payment.id, 200);
      await engine.refundPayment(payment.id);
      expect(handler.mock.calls[0][0].payload.refundAmount).toBe(200);
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.refundPayment('pay_fake')).rejects.toThrow('Payment not found');
    });
  });

  describe('cancelPayment', () => {
    it('should change status to cancelled', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      const cancelled = await engine.cancelPayment(payment.id);
      expect(cancelled.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should publish PAYMENT_CANCELLED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_CANCELLED', handler);
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.cancelPayment(payment.id);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.cancelPayment('pay_fake')).rejects.toThrow('Payment not found');
    });
  });

  describe('capturePayment', () => {
    it('should change status to success', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      const captured = await engine.capturePayment(payment.id, 100);
      expect(captured.status).toBe(PaymentStatus.SUCCESS);
      expect(captured.completed_at).toBeInstanceOf(Date);
    });

    it('should publish PAYMENT_CAPTURED event with amount', async () => {
      const handler = jest.fn();
      eventBus.subscribe('PAYMENT_CAPTURED', handler);
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.capturePayment(payment.id, 75);
      expect(handler.mock.calls[0][0].payload.amount).toBe(75);
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.capturePayment('pay_fake', 100)).rejects.toThrow('Payment not found');
    });
  });

  describe('createRefund', () => {
    it('should create a refund transaction', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      const refund = await engine.createRefund(50, 'USD', payment.id, 'defective');
      expect(refund.id).toMatch(/^txn_refund_/);
      expect(refund.amount).toBe(50);
      expect(refund.currency).toBe('USD');
    });

    it('should update payment status to refunded', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.createRefund(100, 'USD', payment.id);
      const updated = await engine.retrievePayment(payment.id);
      expect(updated.status).toBe(PaymentStatus.REFUNDED);
    });

    it('should store reason in metadata', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      const refund = await engine.createRefund(100, 'USD', payment.id, 'customer request');
      expect(refund.metadata.reason).toBe('customer request');
    });

    it('should throw for non-existent payment', async () => {
      await expect(engine.createRefund(100, 'USD', 'pay_fake')).rejects.toThrow('Payment not found');
    });
  });

  describe('getTransaction', () => {
    it('should retrieve a transaction by id', async () => {
      const payment = await engine.createPayment(100, 'USD', {});
      await engine.processPayment(payment.id);
      const transactions = await transactionManager.listTransactions();
      const txn = await engine.getTransaction(transactions[0].id);
      expect(txn).toBeDefined();
    });
  });

  describe('getPayment / listPayments', () => {
    it('should get a payment via getPayment', async () => {
      const created = await engine.createPayment(100, 'USD', {});
      const retrieved = await engine.getPayment(created.id);
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for unknown payment via getPayment', async () => {
      const result = await engine.getPayment('pay_unknown');
      expect(result).toBeUndefined();
    });

    it('should list all payments', async () => {
      await engine.createPayment(10, 'USD', {});
      await engine.createPayment(20, 'EUR', {});
      const all = await engine.listPayments();
      expect(all).toHaveLength(2);
    });
  });

  describe('getTransactionManager', () => {
    it('should return the transaction manager instance', () => {
      expect(engine.getTransactionManager()).toBe(transactionManager);
    });
  });

  describe('getWebhookData', () => {
    it('should return the payload', async () => {
      const payload = { type: 'charge.succeeded' };
      const result = await engine.getWebhookData(payload, 'sig');
      expect(result).toBe(payload);
    });
  });
});
