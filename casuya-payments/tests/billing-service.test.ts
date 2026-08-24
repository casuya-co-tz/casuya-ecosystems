import { BillingService } from '../src/modules/billing/billing.service';
import { EventBusImpl } from '../src/events/event-bus';

describe('BillingService', () => {
  let eventBus: EventBusImpl;
  let service: BillingService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new BillingService(eventBus);
  });

  describe('createBillingRecord', () => {
    it('should create a billing record with defaults', async () => {
      const record = await service.createBillingRecord({});
      expect(record.id).toMatch(/^bill_/);
      expect(record.customerId).toBe('');
      expect(record.amount).toBe(0);
      expect(record.currency).toBe('USD');
      expect(record.period).toBe('monthly');
      expect(record.status).toBe('pending');
      expect(record.createdAt).toBeInstanceOf(Date);
    });

    it('should create a record with provided data', async () => {
      const dueDate = new Date('2026-08-01');
      const record = await service.createBillingRecord({
        customerId: 'cust_1',
        amount: 99.99,
        currency: 'EUR',
        period: 'weekly',
        dueDate,
      });
      expect(record.customerId).toBe('cust_1');
      expect(record.amount).toBe(99.99);
      expect(record.currency).toBe('EUR');
      expect(record.period).toBe('weekly');
      expect(record.dueDate).toBe(dueDate);
    });
  });

  describe('getBillingRecord', () => {
    it('should retrieve a billing record', async () => {
      const created = await service.createBillingRecord({ amount: 100 });
      const retrieved = await service.getBillingRecord(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent record', async () => {
      await expect(service.getBillingRecord('bill_nonexistent')).rejects.toThrow('Billing record not found');
    });
  });

  describe('updateBillingRecord', () => {
    it('should update billing record fields', async () => {
      const created = await service.createBillingRecord({ amount: 100 });
      const updated = await service.updateBillingRecord(created.id, { status: 'paid', paidAt: new Date() });
      expect(updated.status).toBe('paid');
      expect(updated.paidAt).toBeInstanceOf(Date);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
    });

    it('should throw for non-existent record', async () => {
      await expect(service.updateBillingRecord('bill_fake', { amount: 50 })).rejects.toThrow('Billing record not found');
    });
  });

  describe('getBillingHistory', () => {
    it('should return billing history for a customer', async () => {
      await service.createBillingRecord({ customerId: 'cust_1', amount: 100, period: 'monthly' });
      await service.createBillingRecord({ customerId: 'cust_1', amount: 200, period: 'monthly' });
      await service.createBillingRecord({ customerId: 'cust_2', amount: 300, period: 'monthly' });
      const history = await service.getBillingHistory('cust_1');
      expect(history).toHaveLength(2);
    });

    it('should filter by period', async () => {
      await service.createBillingRecord({ customerId: 'cust_1', amount: 100, period: 'monthly' });
      await service.createBillingRecord({ customerId: 'cust_1', amount: 200, period: 'weekly' });
      const history = await service.getBillingHistory('cust_1', 'monthly');
      expect(history).toHaveLength(1);
      expect(history[0].amount).toBe(100);
    });

    it('should return empty array for customer with no records', async () => {
      const history = await service.getBillingHistory('cust_unknown');
      expect(history).toHaveLength(0);
    });

    it('should sort by createdAt descending', async () => {
      const h1 = await service.createBillingRecord({ customerId: 'cust_1', amount: 100 });
      await new Promise(r => setTimeout(r, 5));
      const h2 = await service.createBillingRecord({ customerId: 'cust_1', amount: 200 });
      const history = await service.getBillingHistory('cust_1');
      expect(history[0].id).toBe(h2.id);
      expect(history[1].id).toBe(h1.id);
    });
  });
});
