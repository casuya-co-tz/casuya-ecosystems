import { randomUUID } from 'crypto';
import { ISubscriptionService, ISubscription, IInvoice, SubscriptionStatus, EventBus } from '../../interfaces';

export class SubscriptionService implements ISubscriptionService {
  private subscriptions: Map<string, ISubscription> = new Map();

  constructor(private eventBus: EventBus) {}

  async createSubscription(planId: string, customerId: string, paymentMethodId?: string): Promise<ISubscription> {
    const sub: ISubscription = {
      id: `sub_${randomUUID()}`,
      customer_id: customerId,
      plan_id: planId,
      status: SubscriptionStatus.ACTIVE,
      current_period_start: new Date(),
      current_period_end: new Date(Date.now() + 30 * 86400000),
      cancel_at_period_end: false,
      payment_id: paymentMethodId,
      metadata: {},
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.subscriptions.set(sub.id, sub);

    this.eventBus.publish({
      id: `subscription_created_${randomUUID()}`,
      type: 'SUBSCRIPTION_CREATED',
      payload: { subscription: sub },
      timestamp: new Date(),
      source: 'SubscriptionService',
    });

    return sub;
  }

  async retrieveSubscription(subscriptionId: string): Promise<ISubscription> {
    const sub = this.subscriptions.get(subscriptionId);
    if (!sub) throw new Error(`Subscription not found: ${subscriptionId}`);
    return sub;
  }

  async updateSubscription(subscriptionId: string, updates: Partial<ISubscription>): Promise<ISubscription> {
    const sub = await this.retrieveSubscription(subscriptionId);
    const updated = { ...sub, ...updates, updated_at: new Date() };
    this.subscriptions.set(subscriptionId, updated);
    return updated;
  }

  async cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<ISubscription> {
    const sub = await this.retrieveSubscription(subscriptionId);
    if (immediate) {
      sub.status = SubscriptionStatus.CANCELLED;
    } else {
      sub.cancel_at_period_end = true;
    }
    sub.updated_at = new Date();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async pauseSubscription(subscriptionId: string): Promise<ISubscription> {
    const sub = await this.retrieveSubscription(subscriptionId);
    sub.status = SubscriptionStatus.INACTIVE;
    sub.updated_at = new Date();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async resumeSubscription(subscriptionId: string): Promise<ISubscription> {
    const sub = await this.retrieveSubscription(subscriptionId);
    sub.status = SubscriptionStatus.ACTIVE;
    sub.updated_at = new Date();
    this.subscriptions.set(subscriptionId, sub);
    return sub;
  }

  async getInvoices(subscriptionId: string): Promise<IInvoice[]> {
    return [];
  }
}
