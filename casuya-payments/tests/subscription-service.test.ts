import { SubscriptionService } from '../src/modules/subscriptions/subscription.service';
import { EventBusImpl } from '../src/events/event-bus';
import { SubscriptionStatus } from '../src/interfaces';

describe('SubscriptionService', () => {
  let eventBus: EventBusImpl;
  let service: SubscriptionService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new SubscriptionService(eventBus);
  });

  describe('createSubscription', () => {
    it('should create an active subscription', async () => {
      const sub = await service.createSubscription('plan_1', 'cust_1', 'pm_1');
      expect(sub.id).toMatch(/^sub_/);
      expect(sub.plan_id).toBe('plan_1');
      expect(sub.customer_id).toBe('cust_1');
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
      expect(sub.payment_id).toBe('pm_1');
      expect(sub.cancel_at_period_end).toBe(false);
      expect(sub.current_period_start).toBeInstanceOf(Date);
      expect(sub.current_period_end).toBeInstanceOf(Date);
    });

    it('should set period end to 30 days from now', async () => {
      const sub = await service.createSubscription('plan_1', 'cust_1');
      const now = Date.now();
      const expectedEnd = now + 30 * 86400000;
      expect(Math.abs(sub.current_period_end.getTime() - expectedEnd)).toBeLessThan(1000);
    });

    it('should publish SUBSCRIPTION_CREATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('SUBSCRIPTION_CREATED', handler);
      await service.createSubscription('plan_1', 'cust_1');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('retrieveSubscription', () => {
    it('should retrieve a subscription', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      const retrieved = await service.retrieveSubscription(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent subscription', async () => {
      await expect(service.retrieveSubscription('sub_nonexistent')).rejects.toThrow('Subscription not found');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription fields', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      const updated = await service.updateSubscription(created.id, { plan_id: 'plan_2' });
      expect(updated.plan_id).toBe('plan_2');
      expect(updated.updated_at.getTime()).toBeGreaterThanOrEqual(created.updated_at.getTime());
    });

    it('should throw for non-existent subscription', async () => {
      await expect(service.updateSubscription('sub_fake', { plan_id: 'p' })).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel at period end by default', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      const cancelled = await service.cancelSubscription(created.id);
      expect(cancelled.cancel_at_period_end).toBe(true);
      expect(cancelled.status).toBe(SubscriptionStatus.ACTIVE);
    });

    it('should cancel immediately when immediate=true', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      const cancelled = await service.cancelSubscription(created.id, true);
      expect(cancelled.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });

  describe('pauseSubscription', () => {
    it('should set status to inactive', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      const paused = await service.pauseSubscription(created.id);
      expect(paused.status).toBe(SubscriptionStatus.INACTIVE);
    });

    it('should throw for non-existent subscription', async () => {
      await expect(service.pauseSubscription('sub_fake')).rejects.toThrow('Subscription not found');
    });
  });

  describe('resumeSubscription', () => {
    it('should set status back to active', async () => {
      const created = await service.createSubscription('plan_1', 'cust_1');
      await service.pauseSubscription(created.id);
      const resumed = await service.resumeSubscription(created.id);
      expect(resumed.status).toBe(SubscriptionStatus.ACTIVE);
    });
  });

  describe('getInvoices', () => {
    it('should return empty array', async () => {
      const invoices = await service.getInvoices('sub_1');
      expect(invoices).toEqual([]);
    });
  });

  describe('full lifecycle', () => {
    it('should handle create -> pause -> resume -> cancel at period end -> cancel immediately', async () => {
      let sub = await service.createSubscription('plan_1', 'cust_1');
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);

      sub = await service.pauseSubscription(sub.id);
      expect(sub.status).toBe(SubscriptionStatus.INACTIVE);

      sub = await service.resumeSubscription(sub.id);
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);

      sub = await service.cancelSubscription(sub.id);
      expect(sub.cancel_at_period_end).toBe(true);
      expect(sub.status).toBe(SubscriptionStatus.ACTIVE);

      sub = await service.cancelSubscription(sub.id, true);
      expect(sub.status).toBe(SubscriptionStatus.CANCELLED);
    });
  });
});
