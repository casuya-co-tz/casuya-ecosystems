import { randomUUID } from 'crypto';
import { IReceiptsService, EventBus } from '../../interfaces';

export type Receipt = {
  id: string;
  paymentId: string;
  transactionId: string;
  receiptNumber: string;
  amount: number;
  currency: string;
  status: string;
  issuedAt: Date;
  customerId: string;
  items: Array<{ description: string; amount: number }>;
}

export class ReceiptsService implements IReceiptsService {
  private receipts: Map<string, Receipt> = new Map();

  constructor(private eventBus: EventBus) {}

  async generateReceipt(paymentId: string, transactionId: string): Promise<Receipt> {
    const receipt: Receipt = {
      id: `rct_${randomUUID()}`,
      paymentId,
      transactionId,
      receiptNumber: `RCT-${randomUUID()}`,
      amount: 0,
      currency: 'USD',
      status: 'issued',
      issuedAt: new Date(),
      customerId: '',
      items: [],
    };
    this.receipts.set(receipt.id, receipt);
    return receipt;
  }

  async getReceipt(receiptId: string): Promise<Receipt> {
    const receipt = this.receipts.get(receiptId);
    if (!receipt) throw new Error(`Receipt not found: ${receiptId}`);
    return receipt;
  }

  async getCustomerReceipts(customerId: string): Promise<Receipt[]> {
    return Array.from(this.receipts.values()).filter(r => r.customerId === customerId);
  }
}
