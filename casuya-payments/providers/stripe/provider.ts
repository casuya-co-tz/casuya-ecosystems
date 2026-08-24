import { BasePaymentProvider } from '../../src/core/providers/base-provider';
import { IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../src/interfaces';

export interface StripeConfig {
  apiKey?: string;
  webhookSecret?: string;
  apiVersion?: string;
}

export class StripeProvider extends BasePaymentProvider {
  readonly name = 'stripe';
  protected paymentIdPrefix = 'pay_stripe';
  protected providerRefPrefix = 'stripe';
  private stripeConfig: StripeConfig;

  constructor(config: StripeConfig = {}) {
    super();
    this.stripeConfig = config;
  }

  override async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const payment = await super.createPayment(amount, currency, customerInfo);
    payment.metadata = {
      ...payment.metadata,
      stripe_api_version: this.stripeConfig.apiVersion ?? '2024-06-20',
      idempotency_key: `idem_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      capture_method: 'automatic',
      payment_method_types: ['card'],
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  override async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await super.processPayment(paymentId);
    const txn: ITransaction = {
      id: `txn_stripe_${Date.now()}`,
      payment_id: paymentId,
      amount: payment.amount,
      currency: payment.currency,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `pi_${Date.now()}${Math.random().toString(36).substr(2, 12)}`,
      metadata: {
        stripe_charge_id: `ch_${Date.now()}`,
        stripe_balance_transaction: `txn_${Date.now()}`,
        receipt_url: `https://pay.stripe.com/receipts/${Date.now()}`,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.set(txn.id, txn);
    payment.status = PaymentStatus.SUCCESS;
    payment.completed_at = new Date();
    payment.updated_at = new Date();
    payment.metadata = { ...payment.metadata, stripe_charge_id: (txn.metadata as Record<string, unknown>).stripe_charge_id as string };
    this.payments.set(paymentId, payment);
    return payment;
  }

  override async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    const refundAmount = amount ?? payment.amount;
    const txn: ITransaction = {
      id: `txn_stripe_ref_${Date.now()}`,
      payment_id: paymentId,
      amount: refundAmount,
      currency: payment.currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `re_${Date.now()}${Math.random().toString(36).substr(2, 8)}`,
      metadata: {
        stripe_refund_id: `re_${Date.now()}`,
        reason: 'requested_by_customer',
      },
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.set(txn.id, txn);
    payment.status = PaymentStatus.REFUNDED;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  override async getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>> {
    if (this.stripeConfig.webhookSecret && signature) {
      const expectedSig = this.computeWebhookSignature(JSON.stringify(payload), this.stripeConfig.webhookSecret);
      if (signature !== expectedSig) {
        throw new Error('Invalid Stripe webhook signature');
      }
    }
    return {
      type: payload.type,
      data: (payload.data as Record<string, unknown>)?.object,
      livemode: payload.livemode ?? false,
      created: payload.created,
    } as Record<string, unknown>;
  }

  async createSetupIntent(customerId: string): Promise<{ clientSecret: string; setupIntentId: string }> {
    const setupIntentId = `si_${Date.now()}${Math.random().toString(36).substr(2, 8)}`;
    return {
      clientSecret: `${setupIntentId}_secret_${Math.random().toString(36).substr(2, 16)}`,
      setupIntentId,
    };
  }

  async createCustomer(email: string, name?: string): Promise<{ customerId: string }> {
    return {
      customerId: `cus_${Date.now()}${Math.random().toString(36).substr(2, 8)}`,
    };
  }

  private computeWebhookSignature(payload: string, secret: string): string {
    let hash = 0;
    const combined = secret + payload;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `v1=${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }
}
