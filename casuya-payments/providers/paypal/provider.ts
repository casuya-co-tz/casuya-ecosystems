import { BasePaymentProvider } from '../../src/core/providers/base-provider';
import { IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../src/interfaces';

export interface PayPalConfig {
  clientId?: string;
  clientSecret?: string;
  mode?: 'live' | 'sandbox';
  webhookId?: string;
}

export class PayPalProvider extends BasePaymentProvider {
  readonly name = 'paypal';
  protected paymentIdPrefix = 'pay_pp';
  protected providerRefPrefix = 'pp';
  private paypalConfig: PayPalConfig;

  constructor(config: PayPalConfig = {}) {
    super();
    this.paypalConfig = { mode: 'sandbox', ...config };
  }

  override async createPayment(amount: number, currency: string, customerInfo: any): Promise<IPayment> {
    const payment = await super.createPayment(amount, currency, customerInfo);
    payment.metadata = {
      ...payment.metadata,
      paypal_mode: this.paypalConfig.mode,
      intent: 'capture',
      payer_email: customerInfo?.email,
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  override async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await super.processPayment(paymentId);
    const txn: ITransaction = {
      id: `txn_pp_${Date.now()}`,
      payment_id: paymentId,
      amount: payment.amount,
      currency: payment.currency,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `PAYID-${Date.now()}${Math.random().toString(36).substr(2, 8)}`,
      metadata: {
        paypal_order_id: `PP${Date.now()}`,
        paypal_capture_id: `05P${Date.now()}`,
        payer_id: `PP${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
        Links: [
          { rel: 'self', method: 'GET', href: `https://api.${this.paypalConfig.mode === 'live' ? '' : 'sandbox.'}paypal.com/v2/checkout/orders/PP${Date.now()}` },
        ],
      },
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.set(txn.id, txn);
    payment.status = PaymentStatus.SUCCESS;
    payment.completed_at = new Date();
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  override async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    const refundAmount = amount ?? payment.amount;
    const txn: ITransaction = {
      id: `txn_pp_ref_${Date.now()}`,
      payment_id: paymentId,
      amount: refundAmount,
      currency: payment.currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `REFUND-${Date.now()}${Math.random().toString(36).substr(2, 8)}`,
      metadata: {
        paypal_refund_id: `0RF${Date.now()}`,
        note_to_payer: 'Your payment has been refunded.',
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

  override async getWebhookData(payload: any, signature?: string): Promise<any> {
    return {
      event_type: payload.event_type,
      resource: payload.resource,
      id: payload.id,
      create_time: payload.create_time,
    };
  }

  async createOrder(amount: number, currency: string, returnUrl: string, cancelUrl: string): Promise<{ orderId: string; approvalUrl: string }> {
    const orderId = `PP${Date.now()}${Math.random().toString(36).substr(2, 8)}`;
    return {
      orderId,
      approvalUrl: `https://www.${this.paypalConfig.mode === 'live' ? '' : 'sandbox.'}paypal.com/checkoutnow?token=${orderId}`,
    };
  }

  async captureOrder(orderId: string): Promise<{ status: string; captureId: string }> {
    return {
      status: 'COMPLETED',
      captureId: `05P${Date.now()}`,
    };
  }
}
