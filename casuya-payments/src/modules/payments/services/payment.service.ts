import { IPaymentProvider, IPayment, ITransaction, EventBus } from '../../../interfaces';
import { PaymentEngine } from '../../../core/engine/payment.engine';
import { ProviderRegistry } from '../../../core/providers/provider.registry';

export class PaymentService {
  constructor(
    private paymentEngine: PaymentEngine,
    private providerRegistry: ProviderRegistry,
    private eventBus: EventBus
  ) {}

  async createPayment(request: Record<string, unknown>): Promise<IPayment> {
    const allProviders = this.providerRegistry.getAllProviders();
    if (allProviders.length === 0) {
      throw new Error('No payment providers registered');
    }

    const provider = allProviders[0];

    const paymentRequest = {
      amount: request.amount as number,
      currency: (request.currency as string) || 'USD',
      customer_id: (request.customer_id as string) || '',
      provider: (request.provider as string) || provider.name,
      metadata: (request.metadata as Record<string, unknown>) || {},
    };

    return await provider.createPayment(
      paymentRequest.amount,
      paymentRequest.currency,
      {
        id: paymentRequest.customer_id,
        provider: paymentRequest.provider,
        metadata: paymentRequest.metadata,
      }
    );
  }

  async retrievePayment(paymentId: string): Promise<IPayment> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.retrievePayment(paymentId);
      } catch (error) {
        console.warn(`[PaymentService] retrievePayment failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async processPayment(paymentId: string): Promise<IPayment> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.processPayment(paymentId);
      } catch (error) {
        console.warn(`[PaymentService] processPayment failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async refundPayment(paymentId: string, amount?: number): Promise<IPayment> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.refundPayment(paymentId, amount);
      } catch (error) {
        console.warn(`[PaymentService] refundPayment failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async cancelPayment(paymentId: string): Promise<IPayment> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.cancelPayment(paymentId);
      } catch (error) {
        console.warn(`[PaymentService] cancelPayment failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async getTransaction(transactionId: string): Promise<ITransaction> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.getTransaction(transactionId);
      } catch (error) {
        console.warn(`[PaymentService] getTransaction failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Transaction not found: ${transactionId}`);
  }

  async createRefund(amount: number, currency: string, paymentId: string, reason?: string): Promise<ITransaction> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.createRefund(amount, currency, paymentId, reason);
      } catch (error) {
        console.warn(`[PaymentService] createRefund failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async capturePayment(paymentId: string, amount: number): Promise<IPayment> {
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.capturePayment(paymentId, amount);
      } catch (error) {
        console.warn(`[PaymentService] capturePayment failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error(`Payment not found: ${paymentId}`);
  }

  async listPayments(): Promise<IPayment[]> {
    return this.paymentEngine.listPayments();
  }

  async getTransactions(paymentId: string): Promise<ITransaction[]> {
    const transaction = await this.paymentEngine.getTransactionManager().getTransactionByPaymentId(paymentId);
    if (!transaction) {
      throw new Error(`Payment not found: ${paymentId}`);
    }
    return [transaction];
  }

  getProviderForPayment(paymentId: string): IPaymentProvider | undefined {
    const providers = this.providerRegistry.getAllProviders();
    if (providers.length === 0) {
      throw new Error('No payment providers registered');
    }
    return providers[0];
  }

  async getWebhookData(payload: Record<string, unknown>, signature?: string, providerName?: string): Promise<Record<string, unknown>> {
    if (providerName) {
      const provider = this.providerRegistry.getProvider(providerName);
      if (provider) {
        return await provider.getWebhookData(payload, signature);
      }
    }
    for (const provider of this.providerRegistry.getAllProviders()) {
      try {
        return await provider.getWebhookData(payload, signature);
      } catch (error) {
        console.warn(`[PaymentService] getWebhookData failed for ${provider.name}:`, (error as Error).message);
      }
    }
    throw new Error('No payment providers registered');
  }
}
