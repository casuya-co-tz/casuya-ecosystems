import { EventBusImpl } from './events/event-bus';
import { PaymentsModule } from './modules/payments/payments.module';
import { TransactionModule } from './modules/transactions/transaction.module';
import { CurrencyService } from './modules/currencies/currency.service';
import { FraudService } from './modules/fraud/fraud.service';
import { AuditService } from './modules/logs/audit.service';
import { ReceiptsService } from './modules/receipts/receipts.service';
import { RefundService } from './modules/refunds/refund.service';
import { BillingService } from './modules/billing/billing.service';
import { InvoiceService } from './modules/invoices/invoice.service';
import { SubscriptionService } from './modules/subscriptions/subscription.service';
import { ReconciliationService } from './modules/reconciliation/reconciliation.service';
import { StripeProvider } from '../providers/stripe/provider';
import { PayPalProvider } from '../providers/paypal/provider';
import { BankTransferProvider } from '../providers/bank-transfer/provider';
import { MobileMoneyProvider } from '../providers/mobile-money/provider';

export class CasuyaPayments {
  readonly eventBus = new EventBusImpl();
  readonly payments = new PaymentsModule();
  readonly transactions = new TransactionModule(this.eventBus);
  readonly currencies = new CurrencyService(this.eventBus);
  readonly fraud = new FraudService(this.eventBus);
  readonly audit = new AuditService(this.eventBus);
  readonly receipts = new ReceiptsService(this.eventBus);
  readonly refunds = new RefundService(this.eventBus);
  readonly billing = new BillingService(this.eventBus);
  readonly invoices = new InvoiceService(this.eventBus);
  readonly subscriptions = new SubscriptionService(this.eventBus);
  readonly reconciliation = new ReconciliationService(this.eventBus);

  async initialize(): Promise<void> {
    await this.payments.initialize();

    this.payments.providerRegistry.registerProvider('stripe', new StripeProvider());
    this.payments.providerRegistry.registerProvider('paypal', new PayPalProvider());
    this.payments.providerRegistry.registerProvider('bank-transfer', new BankTransferProvider());
    this.payments.providerRegistry.registerProvider('mobile-money', new MobileMoneyProvider());

    await this.transactions.initialize();

    this.eventBus.publish({
      id: `casuya_payments_initialized_${Date.now()}`,
      type: 'CASUYA_PAYMENTS_INITIALIZED',
      payload: {},
      timestamp: new Date(),
      source: 'CasuyaPayments',
    });
  }

  async terminate(): Promise<void> {
    await this.payments.terminate();
    await this.transactions.terminate();
  }
}
