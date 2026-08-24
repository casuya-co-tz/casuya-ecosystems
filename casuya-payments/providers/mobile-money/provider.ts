import { BasePaymentProvider } from '../../src/core/providers/base-provider';
import { IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../src/interfaces';

export interface MobileMoneyConfig {
  provider?: string;
  countryCode?: string;
  merchantCode?: string;
  apiKey?: string;
  callbackUrl?: string;
}

export class MobileMoneyProvider extends BasePaymentProvider {
  readonly name = 'mobile-money';
  protected paymentIdPrefix = 'pay_mm';
  protected providerRefPrefix = 'mm';
  private mmConfig: MobileMoneyConfig;
  private readonly pendingPayments: Map<string, { msisdn: string; expiresAt: Date }> = new Map();

  constructor(config: MobileMoneyConfig = {}) {
    super();
    this.mmConfig = { provider: 'africastalking', countryCode: 'TZ', ...config };
  }

  override async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const msisdn = (customerInfo?.phone ?? customerInfo?.msisdn) as string | undefined;
    if (!msisdn) {
      throw new Error('Phone number (msisdn) is required for mobile money payments');
    }
    const payment = await super.createPayment(amount, currency, customerInfo);
    payment.metadata = {
      ...payment.metadata,
      msisdn: this.normalizeMsisdn(msisdn),
      mm_provider: this.mmConfig.provider,
      country_code: this.mmConfig.countryCode,
      merchant_code: this.mmConfig.merchantCode,
      checkout_request_id: `CK${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    };
    this.payments.set(payment.id, payment);
    this.pendingPayments.set(payment.id, {
      msisdn: payment.metadata?.msisdn as string,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return payment;
  }

  override async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await super.processPayment(paymentId);
    payment.status = PaymentStatus.PROCESSING;
    payment.updated_at = new Date();
    payment.metadata = { ...payment.metadata, processing_started_at: new Date().toISOString() };
    this.payments.set(paymentId, payment);
    return payment;
  }

  async handlePaymentCallback(paymentId: string, callbackData: {
    resultCode: string;
    resultDesc: string;
    amount?: number;
    mpesaReceiptNumber?: string;
    transactionDate?: string;
  }): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    const success = callbackData.resultCode === '0' || callbackData.resultCode === '2001';

    if (success) {
      const txn: ITransaction = {
        id: `txn_mm_${Date.now()}`,
        payment_id: paymentId,
        amount: callbackData.amount ?? payment.amount,
        currency: payment.currency,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.COMPLETED,
        provider: this.name,
        provider_transaction_id: callbackData.mpesaReceiptNumber ?? `MMTX-${Date.now()}`,
        metadata: {
          result_code: callbackData.resultCode,
          result_desc: callbackData.resultDesc,
          receipt_number: callbackData.mpesaReceiptNumber,
          transaction_date: callbackData.transactionDate,
          msisdn: payment.metadata?.msisdn as string,
        },
        created_at: new Date(),
        updated_at: new Date(),
      };
      this.transactions.set(txn.id, txn);
      payment.status = PaymentStatus.SUCCESS;
      payment.completed_at = new Date();
    } else {
      payment.status = PaymentStatus.FAILED;
      payment.metadata = { ...payment.metadata, failure_reason: callbackData.resultDesc, result_code: callbackData.resultCode };
    }

    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    this.pendingPayments.delete(paymentId);
    return payment;
  }

  async checkPaymentStatus(paymentId: string): Promise<{ status: string; pending: boolean; expiresAt?: Date }> {
    const pending = this.pendingPayments.get(paymentId);
    if (pending) {
      if (new Date() > pending.expiresAt) {
        return { status: 'expired', pending: false, expiresAt: pending.expiresAt };
      }
      return { status: 'awaiting_push', pending: true, expiresAt: pending.expiresAt };
    }
    const payment = await this.retrievePayment(paymentId);
    return { status: payment.status, pending: false };
  }

  override async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    const refundAmount = amount ?? payment.amount;
    const txn: ITransaction = {
      id: `txn_mm_ref_${Date.now()}`,
      payment_id: paymentId,
      amount: refundAmount,
      currency: payment.currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `MMREF-${Date.now()}`,
      metadata: { refund_initiated: new Date().toISOString() },
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
    return {
      event_type: payload.event_type ?? 'mobile_money.payment',
      checkout_request_id: (payload.Body as Record<string, unknown>)?.stkCallback,
      result_code: ((payload.Body as Record<string, unknown>)?.stkCallback as Record<string, unknown>)?.ResultCode?.toString(),
      result_desc: ((payload.Body as Record<string, unknown>)?.stkCallback as Record<string, unknown>)?.ResultDesc,
      amount: (((payload.Body as Record<string, unknown>)?.stkCallback as Record<string, unknown>)?.CallbackMetadata as Record<string, unknown>)?.Item,
      mpesa_receipt: (((payload.Body as Record<string, unknown>)?.stkCallback as Record<string, unknown>)?.CallbackMetadata as Record<string, unknown>)?.Item,
    } as Record<string, unknown>;
  }

  private normalizeMsisdn(msisdn: string): string {
    const cleaned = msisdn.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+')) return cleaned.substring(1);
    if (cleaned.startsWith('255')) return cleaned;
    if (cleaned.startsWith('0')) return `255${cleaned.substring(1)}`;
    return cleaned;
  }
}
