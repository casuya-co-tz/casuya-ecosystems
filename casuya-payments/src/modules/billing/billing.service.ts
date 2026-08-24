import { randomUUID } from 'crypto';
import { IBillingSystem, EventBus } from '../../interfaces';

export type BillingRecord = {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  period: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class BillingService implements IBillingSystem {
  private records: Map<string, BillingRecord> = new Map();

  constructor(private eventBus: EventBus) {}

  async createBillingRecord(data: Record<string, unknown>): Promise<BillingRecord> {
    const record: BillingRecord = {
      id: `bill_${randomUUID()}`,
      customerId: (data.customerId as string) || '',
      amount: (data.amount as number) || 0,
      currency: (data.currency as string) || 'USD',
      period: (data.period as string) || 'monthly',
      status: 'pending',
      dueDate: (data.dueDate as Date) || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.records.set(record.id, record);
    return record;
  }

  async updateBillingRecord(billingId: string, updates: Partial<BillingRecord>): Promise<BillingRecord> {
    const record = await this.getBillingRecord(billingId);
    const updated = { ...record, ...updates, updatedAt: new Date() };
    this.records.set(billingId, updated);
    return updated;
  }

  async getBillingRecord(billingId: string): Promise<BillingRecord> {
    const record = this.records.get(billingId);
    if (!record) throw new Error(`Billing record not found: ${billingId}`);
    return record;
  }

  async getBillingHistory(customerId: string, period?: string): Promise<BillingRecord[]> {
    let result = Array.from(this.records.values()).filter(r => r.customerId === customerId);
    if (period) result = result.filter(r => r.period === period);
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
