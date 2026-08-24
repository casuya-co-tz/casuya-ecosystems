import { InvoiceService } from '../src/modules/invoices/invoice.service';
import { EventBusImpl } from '../src/events/event-bus';
import { InvoiceStatus, PaymentStatus, InvoiceItem } from '../src/interfaces';

describe('InvoiceService', () => {
  let eventBus: EventBusImpl;
  let service: InvoiceService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new InvoiceService(eventBus);
  });

  describe('generateInvoice', () => {
    it('should generate an invoice with defaults', async () => {
      const invoice = await service.generateInvoice({});
      expect(invoice.id).toMatch(/^inv_/);
      expect(invoice.invoice_number).toMatch(/^INV-/);
      expect(invoice.amount).toBe(0);
      expect(invoice.currency).toBe('USD');
      expect(invoice.status).toBe(InvoiceStatus.PENDING);
      expect(invoice.tax_amount).toBe(0);
      expect(invoice.discount_amount).toBe(0);
      expect(invoice.total_amount).toBe(0);
    });

    it('should generate invoice with provided data', async () => {
      const items: InvoiceItem[] = [
        { id: '1', description: 'Widget', quantity: 2, unit_price: 50, tax_rate: 0.1, discount_rate: 0, amount: 100 },
      ];
      const invoice = await service.generateInvoice({
        payment_id: 'pay_1',
        amount: 100,
        currency: 'EUR',
        tax_amount: 10,
        discount_amount: 5,
        items,
        customer_info: { name: 'John', email: 'john@example.com' },
      });
      expect(invoice.payment_id).toBe('pay_1');
      expect(invoice.amount).toBe(100);
      expect(invoice.currency).toBe('EUR');
      expect(invoice.tax_amount).toBe(10);
      expect(invoice.discount_amount).toBe(5);
      expect(invoice.total_amount).toBe(105);
      expect(invoice.items).toHaveLength(1);
      expect(invoice.customer_info.name).toBe('John');
    });

    it('should increment invoice numbers sequentially', async () => {
      const inv1 = await service.generateInvoice({});
      const inv2 = await service.generateInvoice({});
      const num1 = parseInt(inv1.invoice_number.split('-')[1], 10);
      const num2 = parseInt(inv2.invoice_number.split('-')[1], 10);
      expect(num2).toBe(num1 + 1);
    });

    it('should pad invoice numbers to 6 digits', async () => {
      const invoice = await service.generateInvoice({});
      const numPart = invoice.invoice_number.split('-')[1];
      expect(numPart).toHaveLength(6);
    });
  });

  describe('generateReceipt', () => {
    it('should generate a receipt from a payment', async () => {
      const payment = {
        id: 'pay_1',
        amount: 250,
        currency: 'GBP',
        status: PaymentStatus.SUCCESS,
        customer_id: 'cust_1',
        provider: 'stripe',
        provider_payment_id: 'pi_1',
        created_at: new Date(),
        updated_at: new Date(),
      };
      const receipt = await service.generateReceipt(payment);
      expect(receipt.id).toMatch(/^rct_/);
      expect(receipt.invoice_number).toMatch(/^RCT-/);
      expect(receipt.amount).toBe(250);
      expect(receipt.currency).toBe('GBP');
      expect(receipt.status).toBe(InvoiceStatus.PAID);
      expect(receipt.total_amount).toBe(250);
      expect(receipt.items).toHaveLength(1);
      expect(receipt.items[0].description).toBe('Payment');
      expect(receipt.customer_info.name).toBe('cust_1');
    });
  });

  describe('getInvoice', () => {
    it('should retrieve an invoice by id', async () => {
      const created = await service.generateInvoice({ amount: 100 });
      const retrieved = await service.getInvoice(created.id);
      expect(retrieved.id).toBe(created.id);
    });

    it('should throw for non-existent invoice', async () => {
      await expect(service.getInvoice('inv_nonexistent')).rejects.toThrow('Invoice not found');
    });
  });

  describe('getReceipt', () => {
    it('should retrieve a receipt (which is an invoice)', async () => {
      const payment = {
        id: 'pay_1', amount: 100, currency: 'USD', status: PaymentStatus.SUCCESS,
        customer_id: 'cust_1', provider: 'stripe', provider_payment_id: 'pi_1',
        created_at: new Date(), updated_at: new Date(),
      };
      const receipt = await service.generateReceipt(payment);
      const retrieved = await service.getReceipt(receipt.id);
      expect(retrieved.id).toBe(receipt.id);
    });
  });
});
