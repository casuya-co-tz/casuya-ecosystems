import { IPaymentProvider, IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../interfaces';

export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly name: string;
  readonly config: Record<string, unknown> = {};

  protected abstract paymentIdPrefix: string;
  protected abstract providerRefPrefix: string;

  protected payments = new Map<string, IPayment>();
  protected transactions = new Map<string, ITransaction>();

  async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const paymentId = `${this.paymentIdPrefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const payment: IPayment = {
      id: paymentId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      provider: this.name,
      provider_payment_id: `${this.providerRefPrefix}_${Date.now()}`,
      customer_id: (customerInfo?.id as string) || '',
      metadata: (customerInfo?.metadata as Record<string, unknown>) || {},
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.payments.set(paymentId, payment);
    return payment;
  }

  async retrievePayment(paymentId: string): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    return payment;
  }

  async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    payment.status = PaymentStatus.PROCESSING;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    payment.status = PaymentStatus.REFUNDED;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  async cancelPayment(paymentId: string): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    payment.status = PaymentStatus.CANCELLED;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const txn = this.transactions.get(transactionId);
    if (!txn) throw new Error(`Transaction not found: ${transactionId}`);
    return txn;
  }

  async createRefund(amount: number, currency: string, paymentId: string, reason?: string): Promise<ITransaction> {
    const payment = await this.retrievePayment(paymentId);
    const txn: ITransaction = {
      id: `txn_refund_${this.name}_${Date.now()}`,
      payment_id: paymentId,
      amount,
      currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `${this.providerRefPrefix}_ref_${Date.now()}`,
      metadata: { reason },
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.set(txn.id, txn);
    payment.status = PaymentStatus.REFUNDED;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return txn;
  }

  async capturePayment(paymentId: string, amount: number): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    payment.status = PaymentStatus.SUCCESS;
    payment.completed_at = new Date();
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  async getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>> {
    let data: Record<string, unknown>;
    if (typeof payload === 'string') {
      try {
        data = JSON.parse(payload);
      } catch {
        return { valid: false, data: {}, error: 'Invalid JSON payload' } as Record<string, unknown>;
      }
    } else {
      data = payload;
    }
    if (!signature) {
      return { valid: true, data } as Record<string, unknown>;
    }
    try {
      const { createHmac } = await import('crypto');
      const secret = (this.config as Record<string, unknown>)?.webhookSecret;
      if (!secret) {
        return { valid: false, data, error: 'No webhook secret configured' } as Record<string, unknown>;
      }
      const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = createHmac('sha256', String(secret)).update(body).digest('hex');
      const valid = expected === signature;
      return { valid, data, error: valid ? undefined : 'Signature mismatch' } as Record<string, unknown>;
    } catch {
      return { valid: false, data, error: 'Signature verification failed' } as Record<string, unknown>;
    }
  }
}
