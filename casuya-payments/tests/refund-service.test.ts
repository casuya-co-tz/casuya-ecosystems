import { RefundService } from '../src/modules/refunds/refund.service';
import { EventBusImpl } from '../src/events/event-bus';
import { TransactionType, TransactionStatus } from '../src/interfaces';

describe('RefundService', () => {
  let eventBus: EventBusImpl;
  let service: RefundService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new RefundService(eventBus);
  });

  describe('processRefund', () => {
    it('should process a refund with provided data', async () => {
      const refund = await service.processRefund({
        payment_id: 'pay_1',
        amount: 100,
        currency: 'EUR',
        provider: 'stripe',
        metadata: { reason: 'defective' },
      });
      expect(refund.id).toMatch(/^ref_/);
      expect(refund.payment_id).toBe('pay_1');
      expect(refund.amount).toBe(100);
      expect(refund.currency).toBe('EUR');
      expect(refund.type).toBe(TransactionType.REFUND);
      expect(refund.status).toBe(TransactionStatus.COMPLETED);
      expect(refund.provider).toBe('stripe');
    });

    it('should use defaults for missing data', async () => {
      const refund = await service.processRefund({});
      expect(refund.payment_id).toBe('');
      expect(refund.amount).toBe(0);
      expect(refund.currency).toBe('USD');
      expect(refund.type).toBe(TransactionType.REFUND);
    });

    it('should publish REFUND_PROCESSED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('REFUND_PROCESSED', handler);
      await service.processRefund({ amount: 50 });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.refund.amount).toBe(50);
    });
  });

  describe('retrieveRefund', () => {
    it('should retrieve a refund by id', async () => {
      const created = await service.processRefund({ amount: 100 });
      const retrieved = await service.retrieveRefund(created.id);
      expect(retrieved.id).toBe(created.id);
      expect(retrieved.amount).toBe(100);
    });

    it('should throw for non-existent refund', async () => {
      await expect(service.retrieveRefund('ref_nonexistent')).rejects.toThrow('Refund not found');
    });
  });

  describe('updateRefundStatus', () => {
    it('should update the refund status', async () => {
      const created = await service.processRefund({ amount: 100 });
      const updated = await service.updateRefundStatus(created.id, 'completed');
      expect(updated.status).toBe('completed');
      expect(updated.updated_at.getTime()).toBeGreaterThanOrEqual(created.updated_at.getTime());
    });

    it('should throw for non-existent refund', async () => {
      await expect(service.updateRefundStatus('ref_fake', 'completed')).rejects.toThrow('Refund not found');
    });
  });

  describe('getRefunds', () => {
    it('should return all refunds', async () => {
      await service.processRefund({ payment_id: 'pay_1', amount: 100 });
      await service.processRefund({ payment_id: 'pay_2', amount: 200 });
      const all = await service.getRefunds();
      expect(all).toHaveLength(2);
    });

    it('should filter by payment_id', async () => {
      await service.processRefund({ payment_id: 'pay_1', amount: 100 });
      await service.processRefund({ payment_id: 'pay_1', amount: 50 });
      await service.processRefund({ payment_id: 'pay_2', amount: 200 });
      const filtered = await service.getRefunds('pay_1');
      expect(filtered).toHaveLength(2);
    });

    it('should return empty array when no refunds match', async () => {
      await service.processRefund({ payment_id: 'pay_1', amount: 100 });
      const result = await service.getRefunds('pay_999');
      expect(result).toHaveLength(0);
    });
  });
});
