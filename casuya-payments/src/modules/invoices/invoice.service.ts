import { randomUUID } from 'crypto';
import { IInvoiceGenerator, IPayment, ITransaction, IInvoice, InvoiceStatus, EventBus, InvoiceItem, CustomerInfo } from '../../interfaces';

export class InvoiceService implements IInvoiceGenerator {
  private invoices: Map<string, IInvoice> = new Map();
  private invoiceCounter = 1000;

  constructor(private eventBus: EventBus) {}

  async generateInvoice(invoiceData: Partial<IInvoice>): Promise<IInvoice> {
    this.invoiceCounter++;
    const invoice: IInvoice = {
      id: `inv_${randomUUID()}`,
      payment_id: invoiceData.payment_id || '',
      invoice_number: `INV-${this.invoiceCounter.toString().padStart(6, '0')}`,
      amount: invoiceData.amount || 0,
      currency: invoiceData.currency || 'USD',
      issue_date: new Date(),
      due_date: invoiceData.due_date || new Date(Date.now() + 30 * 86400000),
      status: InvoiceStatus.PENDING,
      items: invoiceData.items || [],
      customer_info: invoiceData.customer_info || { name: '', email: '' },
      tax_amount: invoiceData.tax_amount || 0,
      discount_amount: invoiceData.discount_amount || 0,
      total_amount: (invoiceData.amount || 0) + (invoiceData.tax_amount || 0) - (invoiceData.discount_amount || 0),
    };
    this.invoices.set(invoice.id, invoice);
    return invoice;
  }

  async generateReceipt(payment: IPayment, transaction?: ITransaction): Promise<IInvoice> {
    this.invoiceCounter++;
    const receipt: IInvoice = {
      id: `rct_${randomUUID()}`,
      payment_id: payment.id,
      invoice_number: `RCT-${this.invoiceCounter.toString().padStart(6, '0')}`,
      amount: payment.amount,
      currency: payment.currency,
      issue_date: new Date(),
      due_date: new Date(),
      status: InvoiceStatus.PAID,
      items: [{ id: '1', description: 'Payment', quantity: 1, unit_price: payment.amount, tax_rate: 0, discount_rate: 0, amount: payment.amount }],
      customer_info: { name: payment.customer_id, email: '' },
      tax_amount: 0,
      discount_amount: 0,
      total_amount: payment.amount,
    };
    this.invoices.set(receipt.id, receipt);
    return receipt;
  }

  async getInvoice(invoiceId: string): Promise<IInvoice> {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);
    return invoice;
  }

  async getReceipt(receiptId: string): Promise<IInvoice> {
    return this.getInvoice(receiptId);
  }
}
