import { randomUUID } from 'crypto';
import { IPayment, ITransaction, IPaymentProvider, PaymentStatus, TransactionType, TransactionStatus } from '../../interfaces';
import { EventBusImpl } from '../../events/event-bus';
import { TransactionManager } from '../management/transaction.manager';

export class PaymentEngine implements IPaymentProvider {
  private payments: Map<string, IPayment> = new Map();

  readonly name = 'payment-engine';
  readonly config: Record<string, unknown> = {};

  constructor(
    private transactionManager: TransactionManager,
    private eventBus: EventBusImpl
  ) {}

  async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const paymentId = `pay_${randomUUID()}`;

    const payment: IPayment = {
      id: paymentId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      provider: (customerInfo?.provider as string) || 'default',
      provider_payment_id: '',
      customer_id: (customerInfo?.id as string) || '',
      metadata: (customerInfo?.metadata as Record<string, unknown>) || {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    this.payments.set(paymentId, payment);

    this.eventBus.publish({
      id: `payment_created_${randomUUID()}`,
      type: 'PAYMENT_CREATED',
      payload: { payment },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return payment;
  }

  async retrievePayment(paymentId: string): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }
    return payment;
  }

  async processPayment(paymentId: string): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    payment.status = PaymentStatus.PROCESSING;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);

    const transaction = await this.transactionManager.createTransaction({
      payment_id: paymentId,
      amount: payment.amount,
      currency: payment.currency,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.PROCESSING,
      provider: payment.provider,
    });

    this.eventBus.publish({
      id: `payment_processed_${randomUUID()}`,
      type: 'PAYMENT_PROCESSED',
      payload: { payment, transaction },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return payment;
  }

  async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    if (payment.status !== PaymentStatus.SUCCESS && payment.status !== PaymentStatus.REFUNDED) {
      throw new Error(`Cannot refund payment in '${payment.status}' status. Payment must be completed or captured.`);
    }

    payment.status = PaymentStatus.REFUNDED;
    payment.updated_at = new Date();
    payment.completed_at = new Date();

    this.payments.set(paymentId, payment);

    this.eventBus.publish({
      id: `payment_refunded_${randomUUID()}`,
      type: 'PAYMENT_REFUNDED',
      payload: { payment, refundAmount: amount || payment.amount },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return payment;
  }

  async cancelPayment(paymentId: string): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    payment.status = PaymentStatus.CANCELLED;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);

    this.eventBus.publish({
      id: `payment_cancelled_${randomUUID()}`,
      type: 'PAYMENT_CANCELLED',
      payload: { payment },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return payment;
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const transaction = await this.transactionManager.getTransaction(transactionId);
    if (!transaction) {
      throw new Error(`Transaction not found: ${transactionId}`);
    }
    return transaction;
  }

  async createRefund(amount: number, currency: string, paymentId: string, reason?: string): Promise<ITransaction> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    if (amount <= 0) {
      throw new Error('Refund amount must be greater than 0');
    }

    const totalRefunded = (payment.metadata?.total_refunded as number) || 0;
    if (amount > payment.amount - totalRefunded) {
      throw new Error(`Refund amount ${amount} exceeds available refundable amount ${payment.amount - totalRefunded}`);
    }

    const transaction: ITransaction = {
      id: `txn_refund_${randomUUID()}`,
      payment_id: paymentId,
      amount,
      currency,
      type: TransactionType.REFUND,
      status: TransactionStatus.COMPLETED,
      provider: payment.provider,
      provider_transaction_id: `ref_${randomUUID()}`,
      metadata: { reason, payment_status: payment.status },
      created_at: new Date(),
      updated_at: new Date(),
    };

    await this.transactionManager.createTransaction(transaction);

    payment.status = PaymentStatus.REFUNDED;
    payment.updated_at = new Date();
    payment.metadata = { ...payment.metadata, total_refunded: totalRefunded + amount };
    this.payments.set(paymentId, payment);

    this.eventBus.publish({
      id: `refund_created_${randomUUID()}`,
      type: 'REFUND_CREATED',
      payload: { transaction, payment },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return transaction;
  }

  async capturePayment(paymentId: string, amount: number): Promise<IPayment> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error(`Payment not found: ${paymentId}`);
    }

    if (amount <= 0) {
      throw new Error('Capture amount must be greater than 0');
    }
    if (amount > payment.amount) {
      throw new Error(`Capture amount ${amount} exceeds payment amount ${payment.amount}`);
    }

    payment.status = PaymentStatus.SUCCESS;
    payment.completed_at = new Date();
    payment.updated_at = new Date();
    payment.metadata = { ...payment.metadata, captured_amount: amount };
    this.payments.set(paymentId, payment);

    this.eventBus.publish({
      id: `payment_captured_${randomUUID()}`,
      type: 'PAYMENT_CAPTURED',
      payload: { payment, amount },
      timestamp: new Date(),
      source: 'PaymentEngine',
    });

    return payment;
  }

  async getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>> {
    return payload;
  }

  getTransactionManager(): TransactionManager {
    return this.transactionManager;
  }

  async getPayment(paymentId: string): Promise<IPayment | undefined> {
    return this.payments.get(paymentId);
  }

  async listPayments(): Promise<IPayment[]> {
    return Array.from(this.payments.values());
  }
}
