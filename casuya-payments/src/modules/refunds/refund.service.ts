import { randomUUID } from 'crypto';
import { IRefundSystem, ITransaction, EventBus, TransactionType, TransactionStatus } from '../../interfaces';

export class RefundService implements IRefundSystem {
  private refunds: Map<string, ITransaction> = new Map();

  constructor(private eventBus: EventBus) {}

  async processRefund(data: Record<string, unknown>): Promise<ITransaction> {
    const refund: ITransaction = {
      id: `ref_${randomUUID()}`,
      payment_id: (data.payment_id as string) || '',
      amount: (data.amount as number) || 0,
      currency: (data.currency as string) || 'USD',
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: (data.provider as string) || '',
      provider_transaction_id: `ref_prov_${randomUUID()}`,
      metadata: (data.metadata as Record<string, unknown>) || {},
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.refunds.set(refund.id, refund);

    this.eventBus.publish({
      id: `refund_processed_${randomUUID()}`,
      type: 'REFUND_PROCESSED',
      payload: { refund },
      timestamp: new Date(),
      source: 'RefundService',
    });

    return refund;
  }

  async retrieveRefund(refundId: string): Promise<ITransaction> {
    const refund = this.refunds.get(refundId);
    if (!refund) throw new Error(`Refund not found: ${refundId}`);
    return refund;
  }

  async updateRefundStatus(refundId: string, status: string): Promise<ITransaction> {
    const refund = await this.retrieveRefund(refundId);
    const updated = { ...refund, status: status as TransactionStatus, updated_at: new Date() };
    this.refunds.set(refundId, updated);
    return updated;
  }

  async getRefunds(paymentId?: string): Promise<ITransaction[]> {
    const all = Array.from(this.refunds.values());
    if (paymentId) return all.filter(r => r.payment_id === paymentId);
    return all;
  }
}
