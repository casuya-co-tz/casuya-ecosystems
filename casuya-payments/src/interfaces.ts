import { IPayment, PaymentStatus, ITransaction, TransactionType, TransactionStatus, IInvoice, InvoiceStatus, ISubscription, SubscriptionStatus, InvoiceItem, CustomerInfo, Address } from './models';
export { IPayment, PaymentStatus, ITransaction, TransactionType, TransactionStatus, IInvoice, InvoiceStatus, ISubscription, SubscriptionStatus, InvoiceItem, CustomerInfo, Address };

export interface IPaymentProvider {
  readonly name: string;
  readonly config: Record<string, unknown>;
  
  createPayment(amount: number, currency: string, customerInfo: Record<string, unknown>): Promise<IPayment>;
  retrievePayment(paymentId: string): Promise<IPayment>;
  processPayment(paymentId: string): Promise<IPayment>;
  refundPayment(paymentId: string, amount?: number): Promise<IPayment>;
  cancelPayment(paymentId: string): Promise<IPayment>;
  getTransaction(transactionId: string): Promise<ITransaction>;
  createRefund(amount: number, currency: string, paymentId: string, reason?: string): Promise<ITransaction>;
  capturePayment(paymentId: string, amount: number): Promise<IPayment>;
  getWebhookData(payload: Record<string, unknown>, signature?: string): Promise<Record<string, unknown>>;
}

export interface IInvoiceGenerator {
  generateInvoice(invoiceData: Partial<IInvoice>): Promise<IInvoice>;
  generateReceipt(payment: IPayment, transaction?: ITransaction): Promise<IInvoice>;
  getInvoice(invoiceId: string): Promise<IInvoice>;
  getReceipt(receiptId: string): Promise<IInvoice>;
}

export interface ISubscriptionService {
  createSubscription(planId: string, customerId: string, paymentMethodId?: string): Promise<ISubscription>;
  retrieveSubscription(subscriptionId: string): Promise<ISubscription>;
  updateSubscription(subscriptionId: string, updates: Partial<ISubscription>): Promise<ISubscription>;
  cancelSubscription(subscriptionId: string, immediate?: boolean): Promise<ISubscription>;
  pauseSubscription(subscriptionId: string): Promise<ISubscription>;
  resumeSubscription(subscriptionId: string): Promise<ISubscription>;
  getInvoices(subscriptionId: string): Promise<IInvoice[]>;
}

export interface IBillingSystem {
  createBillingRecord(data: Record<string, unknown>): Promise<Record<string, unknown>>;
  updateBillingRecord(billingId: string, updates: Record<string, unknown>): Promise<Record<string, unknown>>;
  getBillingRecord(billingId: string): Promise<Record<string, unknown>>;
  getBillingHistory(customerId: string, period?: string): Promise<Record<string, unknown>[]>;
}

export interface IRefundSystem {
  processRefund(data: Record<string, unknown>): Promise<ITransaction>;
  retrieveRefund(refundId: string): Promise<ITransaction>;
  updateRefundStatus(refundId: string, status: string): Promise<ITransaction>;
  getRefunds(paymentId?: string): Promise<ITransaction[]>;
}

export interface IReceiptsService {
  generateReceipt(paymentId: string, transactionId: string): Promise<Record<string, unknown>>;
  getReceipt(receiptId: string): Promise<Record<string, unknown>>;
  getCustomerReceipts(customerId: string): Promise<Record<string, unknown>[]>;
}

export interface ICurrencyManager {
  convert(amount: number, fromCurrency: string, toCurrency: string): number;
  formatAmount(amount: number, currency: string): string;
  getExchangeRate(fromCurrency: string, toCurrency: string): number;
  getSupportedCurrencies(): string[];
}

export interface IFraudDetector {
  checkPayment(payment: Partial<IPayment>): Promise<FraudResult>;
  checkTransaction(transaction: Partial<ITransaction>): Promise<FraudResult>;
  checkSubscription(subscription: Partial<ISubscription>): Promise<FraudResult>;
  getFraudScore(transactionId: string): Promise<number>;
  blockCard(cardNumber: string): Promise<boolean>;
  unblockCard(cardNumber: string): Promise<boolean>;
}

export interface IReconciliationService {
  reconcilePayments(startDate: Date, endDate: Date): Promise<ReconciliationResult>;
  reconcileTransactions(startDate: Date, endDate: Date): Promise<ReconciliationResult>;
  getTransactionLog(transactionId: string): Promise<TransactionLog>;
  getReconciliationLog(reconciliationId: string): Promise<ReconciliationLog>;
  createReconciliationReport(data: ReconciliationReport): Promise<ReconciliationReport>;
}

export interface IErrorHandler {
  handle(error: Error): void;
  getErrors(): Error[];
  clearErrors(): void;
}

export interface Event {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
  source: string;
}

export interface EventBus {
  subscribe(eventType: string, handler: (event: Event) => void): void;
  unsubscribe(eventType: string, handler: (event: Event) => void): void;
  publish(event: Event): void;
  getEvents(eventType?: string): Event[];
}

export interface IConfigService {
  get<T>(key: string): T;
  set<T>(key: string, value: T): void;
  getAll(): Record<string, unknown>;
  reset(): void;
}

export interface ICurrency {
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  exchange_rate?: number;
}

export interface FraudResult {
  is_fraud: boolean;
  risk_score: number;
  reasons: string[];
  flags: FraudFlag[];
}

export interface FraudFlag {
  type: string;
  severity: FraudSeverity;
  description: string;
}

export enum FraudSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ReconciliationResult {
  total_payments: number;
  successful_payments: number;
  failed_payments: number;
  total_amount: number;
  fees: number;
  net_amount: number;
}

export interface TransactionLog {
  id: string;
  transaction_id: string;
  action: string;
  timestamp: Date;
  user_id: string;
  metadata: Record<string, unknown>;
}

export interface ReconciliationLog {
  id: string;
  date: Date;
  period: string;
  total_volume: number;
  reconciled_at: Date;
  status: string;
}

export interface ReconciliationReport {
  id: string;
  date: Date;
  period: string;
  provider: string;
  summary: ReconciliationSummary;
  transactions: TransactionSummary[];
}

export interface ReconciliationSummary {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  total_amount: number;
  fees: number;
  net_amount: number;
  currency: string;
}

export interface TransactionSummary {
  id: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: Date;
  payment_method: string;
}
