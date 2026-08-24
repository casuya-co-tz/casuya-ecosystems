import { ProviderRegistry } from '../src/core/providers/provider.registry';
import { EventBusImpl } from '../src/events/event-bus';
import { IPaymentProvider, IPayment, ITransaction, PaymentStatus, TransactionType, TransactionStatus } from '../src/interfaces';

function createMockProvider(name: string): IPaymentProvider {
  return {
    name,
    config: {},
    createPayment: jest.fn().mockResolvedValue({ id: 'pay_mock', status: PaymentStatus.PENDING } as IPayment),
    retrievePayment: jest.fn().mockResolvedValue({ id: 'pay_mock' } as IPayment),
    processPayment: jest.fn().mockResolvedValue({ id: 'pay_mock', status: PaymentStatus.PROCESSING } as IPayment),
    refundPayment: jest.fn().mockResolvedValue({ id: 'pay_mock', status: PaymentStatus.REFUNDED } as IPayment),
    cancelPayment: jest.fn().mockResolvedValue({ id: 'pay_mock', status: PaymentStatus.CANCELLED } as IPayment),
    getTransaction: jest.fn().mockResolvedValue({ id: 'txn_mock' } as ITransaction),
    createRefund: jest.fn().mockResolvedValue({ id: 'ref_mock', type: TransactionType.REFUND, status: TransactionStatus.COMPLETED } as ITransaction),
    capturePayment: jest.fn().mockResolvedValue({ id: 'pay_mock', status: PaymentStatus.SUCCESS } as IPayment),
    getWebhookData: jest.fn().mockResolvedValue({}),
  };
}

describe('ProviderRegistry', () => {
  let eventBus: EventBusImpl;
  let registry: ProviderRegistry;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    registry = new ProviderRegistry(eventBus);
  });

  it('should register a provider', () => {
    const provider = createMockProvider('stripe');
    registry.registerProvider('stripe', provider);
    expect(registry.getProvider('stripe')).toBe(provider);
  });

  it('should get registered provider by name', () => {
    const provider = createMockProvider('paypal');
    registry.registerProvider('paypal', provider);
    expect(registry.getProvider('paypal')).toBe(provider);
  });

  it('should return undefined for non-existent provider', () => {
    expect(registry.getProvider('nonexistent')).toBeUndefined();
  });

  it('should list all provider names', () => {
    registry.registerProvider('stripe', createMockProvider('stripe'));
    registry.registerProvider('paypal', createMockProvider('paypal'));
    const names = registry.listProviders();
    expect(names).toContain('stripe');
    expect(names).toContain('paypal');
    expect(names).toHaveLength(2);
  });

  it('should get all providers as array', () => {
    registry.registerProvider('stripe', createMockProvider('stripe'));
    registry.registerProvider('paypal', createMockProvider('paypal'));
    const providers = registry.getAllProviders();
    expect(providers).toHaveLength(2);
  });

  it('should remove a provider', () => {
    registry.registerProvider('stripe', createMockProvider('stripe'));
    const removed = registry.removeProvider('stripe');
    expect(removed).toBe(true);
    expect(registry.getProvider('stripe')).toBeUndefined();
  });

  it('should return false when removing non-existent provider', () => {
    const removed = registry.removeProvider('nonexistent');
    expect(removed).toBe(false);
  });

  it('should publish PROVIDER_REGISTERED event on registration', () => {
    const handler = jest.fn();
    eventBus.subscribe('PROVIDER_REGISTERED', handler);
    registry.registerProvider('stripe', createMockProvider('stripe'));
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].payload.name).toBe('stripe');
  });

  it('should publish PROVIDER_REMOVED event on removal', () => {
    registry.registerProvider('stripe', createMockProvider('stripe'));
    const handler = jest.fn();
    eventBus.subscribe('PROVIDER_REMOVED', handler);
    registry.removeProvider('stripe');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].payload.name).toBe('stripe');
  });

  it('should not publish PROVIDER_REMOVED if provider did not exist', () => {
    const handler = jest.fn();
    eventBus.subscribe('PROVIDER_REMOVED', handler);
    registry.removeProvider('nonexistent');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should overwrite existing provider with same name', () => {
    const p1 = createMockProvider('stripe');
    const p2 = createMockProvider('stripe');
    registry.registerProvider('stripe', p1);
    registry.registerProvider('stripe', p2);
    expect(registry.getProvider('stripe')).toBe(p2);
  });
});
