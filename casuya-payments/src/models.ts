// casuya-payments

export interface IPayment {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  provider_payment_id: string;
  customer_id: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

export interface ITransaction {
  id: string;
  payment_id: string;
  amount: number;
  currency: string;
  type: TransactionType;
  status: TransactionStatus;
  provider: string;
  provider_transaction_id: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface IInvoice {
  id: string;
  payment_id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: Date;
  due_date: Date;
  status: InvoiceStatus;
  items: InvoiceItem[];
  customer_info: CustomerInfo;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  pdf_url?: string;
  html_url?: string;
}

export interface ISubscription {
  id: string;
  customer_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  current_period_start: Date;
  current_period_end: Date;
  cancel_at_period_end: boolean;
  payment_id?: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  FEE = 'fee',
  ADJUSTMENT = 'adjustment',
}

export enum TransactionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_rate: number;
  amount: number;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
}
