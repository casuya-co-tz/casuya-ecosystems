import { BasePaymentProvider } from '../../src/core/providers/base-provider';
import { IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../src/interfaces';
import { runQuery, runSingle, runExec, generateId, now } from '../../src/database';

interface AzamPayConfig {
  clientId: string;
  clientSecret: string;
  sandbox?: boolean;
}

export class AzamPayProvider extends BasePaymentProvider {
  readonly name = 'azampay';
  protected paymentIdPrefix = 'pay_az';
  protected providerRefPrefix = 'az';
  private azamPayConfig: AzamPayConfig;

  constructor(config: AzamPayConfig) {
    super();
    this.azamPayConfig = { sandbox: true, ...config };
  }

  private getBaseUrl(): string {
    return this.azamPayConfig.sandbox
      ? 'https://sandbox.azampay.co.tz'
      : 'https://api.azampay.co.tz';
  }

  async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const paymentId = generateId('pay_az');
    const nowStr = now();

    runExec(`
      INSERT INTO payments (id, user_id, amount, currency, status, provider, customer_id, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      paymentId,
      (customerInfo?.user_id as string) || null,
      amount,
      currency,
      PaymentStatus.PENDING,
      'azampay',
      (customerInfo?.id as string) || '',
      JSON.stringify(customerInfo?.metadata || {}),
      nowStr,
      nowStr,
    ]);

    return {
      id: paymentId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      provider: 'azampay',
      provider_payment_id: '',
      customer_id: (customerInfo?.id as string) || '',
      metadata: (customerInfo?.metadata as Record<string, unknown>) || {},
      created_at: new Date(nowStr),
      updated_at: new Date(nowStr),
    };
  }

  async processPayment(paymentId: string): Promise<IPayment> {
    const row = runSingle('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!row) throw new Error(`Payment not found: ${paymentId}`);

    runExec('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', [PaymentStatus.PROCESSING, now(), paymentId]);

    const txnId = generateId('txn_az');
    runExec(`
      INSERT INTO transactions (id, payment_id, amount, currency, type, status, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [txnId, paymentId, row.amount, row.currency, TransactionType.PAYMENT, TransactionStatus.PROCESSING, 'azampay', now(), now()]);

    return this.retrievePayment(paymentId);
  }

  async createMobileCheckout(
    amount: number,
    mobileNumber: string,
    provider: string,
    externalId: string
  ): Promise<Record<string, unknown>> {
    const baseUrl = this.getBaseUrl();

    const resp = await fetch(`${baseUrl}/api/v1/mobile-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount,
        mobileNumber,
        provider,
        externalId,
        clientId: this.azamPayConfig.clientId,
        clientSecret: this.azamPayConfig.clientSecret,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`AzamPay checkout failed: ${resp.status} ${err}`);
    }

    return resp.json() as Promise<Record<string, unknown>>;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<{ id: string; status: string }> {
    const paymentId = payload.external_id as string;
    const status = payload.status === 'success' ? 'success' : 'failed';
    const reference = payload.reference as string | undefined;
    const nowStr = now();

    const row = runSingle('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!row) throw new Error(`Payment not found: ${paymentId}`);

    if (row.status === 'success') {
      return { id: paymentId, status: 'success' };
    }

    runExec('UPDATE payments SET status = ?, provider_payment_id = ?, updated_at = ?, completed_at = ? WHERE id = ?',
      [status, reference || null, nowStr, status === 'success' ? nowStr : null, paymentId]);

    runExec('UPDATE transactions SET status = ?, updated_at = ? WHERE payment_id = ? AND type = ?',
      [status === 'success' ? 'completed' : 'failed', nowStr, paymentId, TransactionType.PAYMENT]);

    return { id: paymentId, status };
  }

  async retrievePayment(paymentId: string): Promise<IPayment> {
    const row = runSingle('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!row) throw new Error(`Payment not found: ${paymentId}`);

    return {
      id: row.id as string,
      amount: row.amount as number,
      currency: row.currency as string,
      status: row.status as PaymentStatus,
      provider: row.provider as string,
      provider_payment_id: (row.provider_payment_id as string) || '',
      customer_id: (row.customer_id as string) || '',
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
      completed_at: row.completed_at ? new Date(row.completed_at as string) : undefined,
    };
  }

  async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    const row = runSingle('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!row) throw new Error(`Payment not found: ${paymentId}`);

    const refundAmount = amount || row.amount;
    const refundId = generateId('ref_az');
    const nowStr = now();

    runExec(`
      INSERT INTO refunds (id, payment_id, amount, currency, reason, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [refundId, paymentId, refundAmount, row.currency as string, 'refund', 'completed', nowStr, nowStr]);

    runExec('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', [PaymentStatus.REFUNDED, nowStr, paymentId]);

    return this.retrievePayment(paymentId);
  }

  async cancelPayment(paymentId: string): Promise<IPayment> {
    runExec('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', [PaymentStatus.CANCELLED, now(), paymentId]);
    return this.retrievePayment(paymentId);
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    const row = runSingle('SELECT * FROM transactions WHERE id = ?', [transactionId]);
    if (!row) throw new Error(`Transaction not found: ${transactionId}`);

    return {
      id: row.id as string,
      payment_id: row.payment_id as string,
      amount: row.amount as number,
      currency: row.currency as string,
      type: row.type as TransactionType,
      status: row.status as TransactionStatus,
      provider: row.provider as string,
      provider_transaction_id: (row.provider_transaction_id as string) || '',
      metadata: row.metadata ? JSON.parse(row.metadata as string) : {},
      created_at: new Date(row.created_at as string),
      updated_at: new Date(row.updated_at as string),
    };
  }

  async createRefund(amount: number, currency: string, paymentId: string, reason?: string): Promise<ITransaction> {
    const refundId = generateId('ref_txn');
    const nowStr = now();

    runExec(`
      INSERT INTO refunds (id, payment_id, amount, currency, reason, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [refundId, paymentId, amount, currency, reason || '', 'completed', nowStr, nowStr]);

    const txnId = generateId('txn_ref');
    runExec(`
      INSERT INTO transactions (id, payment_id, amount, currency, type, status, provider, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [txnId, paymentId, amount, currency, TransactionType.REFUND, TransactionStatus.COMPLETED, 'azampay', nowStr, nowStr]);

    return this.getTransaction(txnId);
  }

  async capturePayment(paymentId: string, amount: number): Promise<IPayment> {
    runExec('UPDATE payments SET status = ?, completed_at = ?, updated_at = ? WHERE id = ?',
      [PaymentStatus.SUCCESS, now(), now(), paymentId]);
    return this.retrievePayment(paymentId);
  }

  async getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>> {
    return payload;
  }
}
