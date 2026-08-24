import { ReceiptsService } from '../src/modules/receipts/receipts.service';
import { EventBusImpl } from '../src/events/event-bus';

describe('ReceiptsService', () => {
  let eventBus: EventBusImpl;
  let service: ReceiptsService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new ReceiptsService(eventBus);
  });

  describe('generateReceipt', () => {
    it('should generate a receipt with correct fields', async () => {
      const receipt = await service.generateReceipt('pay_1', 'txn_1');
      expect(receipt.id).toMatch(/^rct_/);
      expect(receipt.paymentId).toBe('pay_1');
      expect(receipt.transactionId).toBe('txn_1');
      expect(receipt.receiptNumber).toMatch(/^RCT-/);
      expect(receipt.status).toBe('issued');
      expect(receipt.issuedAt).toBeInstanceOf(Date);
      expect(receipt.amount).toBe(0);
      expect(receipt.currency).toBe('USD');
      expect(receipt.items).toEqual([]);
    });

    it('should generate unique receipt ids', async () => {
      const r1 = await service.generateReceipt('pay_1', 'txn_1');
      const r2 = await service.generateReceipt('pay_2', 'txn_2');
      expect(r1.id).not.toBe(r2.id);
    });
  });

  describe('getReceipt', () => {
    it('should retrieve a receipt by id', async () => {
      const created = await service.generateReceipt('pay_1', 'txn_1');
      const retrieved = await service.getReceipt(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent receipt', async () => {
      await expect(service.getReceipt('rct_nonexistent')).rejects.toThrow('Receipt not found');
    });
  });

  describe('getCustomerReceipts', () => {
    it('should return receipts for a specific customer', async () => {
      const r1 = await service.generateReceipt('pay_1', 'txn_1');
      const r2 = await service.generateReceipt('pay_2', 'txn_2');
      await service.generateReceipt('pay_3', 'txn_3');

      r1.customerId = 'cust_1';
      r2.customerId = 'cust_1';

      const receipts = await service.getCustomerReceipts('cust_1');
      expect(receipts).toHaveLength(2);
      expect(receipts.map(r => r.id)).toContain(r1.id);
      expect(receipts.map(r => r.id)).toContain(r2.id);
    });

    it('should return empty array when no receipts match customer', async () => {
      const receipts = await service.getCustomerReceipts('cust_nonexistent');
      expect(receipts).toHaveLength(0);
    });
  });
});
