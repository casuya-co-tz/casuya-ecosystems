import { BasePaymentProvider } from '../../src/core/providers/base-provider';
import { IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../../src/interfaces';

export interface BankTransferConfig {
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  iban?: string;
  instructionsTemplate?: string;
}

export class BankTransferProvider extends BasePaymentProvider {
  readonly name = 'bank-transfer';
  protected paymentIdPrefix = 'pay_bnk';
  protected providerRefPrefix = 'bank';
  private bankConfig: BankTransferConfig;
  private readonly pendingTransfers: Map<string, { expiresAt: Date; instructions: string }> = new Map();

  constructor(config: BankTransferConfig = {}) {
    super();
    this.bankConfig = config;
  }

  override async createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment> {
    const payment = await super.createPayment(amount, currency, customerInfo);
    const reference = `BNK-${currency}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    payment.metadata = {
      ...payment.metadata,
      bank_reference: reference,
      bank_name: this.bankConfig.bankName ?? 'Casuya Bank',
      account_number: this.maskAccountNumber(this.bankConfig.accountNumber ?? '0000000000'),
      swift_code: this.bankConfig.swiftCode,
      iban: this.bankConfig.iban,
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      payment_instructions: this.getPaymentInstructions(reference, amount, currency),
    };
    this.payments.set(payment.id, payment);
    this.pendingTransfers.set(payment.id, {
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      instructions: payment.metadata.payment_instructions as string,
    });
    return payment;
  }

  override async processPayment(paymentId: string): Promise<IPayment> {
    const payment = await super.processPayment(paymentId);
    payment.status = PaymentStatus.PROCESSING;
    payment.updated_at = new Date();
    this.payments.set(paymentId, payment);
    return payment;
  }

  async confirmTransfer(paymentId: string, confirmationData: { senderName?: string; amount?: number; proofOfPayment?: string }): Promise<IPayment> {
    const payment = await this.retrievePayment(paymentId);
    const txn: ITransaction = {
      id: `txn_bank_${Date.now()}`,
      payment_id: paymentId,
      amount: confirmationData.amount ?? payment.amount,
      currency: payment.currency,
      type: TransactionType.PAYMENT,
      status: TransactionStatus.COMPLETED,
      provider: this.name,
      provider_transaction_id: `BTX-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      metadata: {
        sender_name: confirmationData.senderName,
        proof_of_payment: confirmationData.proofOfPayment,
        confirmed_at: new Date().toISOString(),
        verification_status: 'pending_manual_review',
      },
      created_at: new Date(),
      updated_at: new Date(),
    };
    this.transactions.set(txn.id, txn);
    payment.status = PaymentStatus.SUCCESS;
    payment.completed_at = new Date();
    payment.updated_at = new Date();
    payment.metadata = { ...payment.metadata, confirmation_txn_id: txn.id };
    this.payments.set(paymentId, payment);
    this.pendingTransfers.delete(paymentId);
    return payment;
  }

  async checkTransferStatus(paymentId: string): Promise<{ status: string; expiresAt?: Date; pending: boolean }> {
    const pending = this.pendingTransfers.get(paymentId);
    if (pending) {
      if (new Date() > pending.expiresAt) {
        return { status: 'expired', expiresAt: pending.expiresAt, pending: false };
      }
      return { status: 'awaiting_transfer', expiresAt: pending.expiresAt, pending: true };
    }
    const payment = await this.retrievePayment(paymentId);
    return { status: payment.status, pending: false };
  }

  override async getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>> {
    return {
      event_type: payload.event_type ?? 'bank_transfer.received',
      reference: payload.reference,
      amount: payload.amount,
      currency: payload.currency,
      sender: payload.sender,
    } as Record<string, unknown>;
  }

  private getPaymentInstructions(reference: string, amount: number, currency: string): string {
    const bankName = this.bankConfig.bankName ?? 'Casuya Bank';
    const accountNum = this.maskAccountNumber(this.bankConfig.accountNumber ?? '0000000000');
    const lines = [
      `Bank Transfer Payment Instructions`,
      ``,
      `Bank: ${bankName}`,
      `Account Number: ${accountNum}`,
    ];
    if (this.bankConfig.routingNumber) {
      lines.push(`Routing Number: ${this.bankConfig.routingNumber}`);
    }
    if (this.bankConfig.swiftCode) {
      lines.push(`SWIFT Code: ${this.bankConfig.swiftCode}`);
    }
    if (this.bankConfig.iban) {
      lines.push(`IBAN: ${this.bankConfig.iban}`);
    }
    lines.push(
      ``,
      `Amount: ${currency} ${amount.toFixed(2)}`,
      `Reference: ${reference}`,
      ``,
      `Important: Include the reference number in your transfer description.`,
      `Transfer must be completed within 48 hours.`,
    );
    return lines.join('\n');
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return '****' + accountNumber.slice(-4);
  }
}
