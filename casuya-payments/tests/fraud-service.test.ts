import { FraudService } from '../src/modules/fraud/fraud.service';
import { EventBusImpl } from '../src/events/event-bus';
import { PaymentStatus, FraudSeverity } from '../src/interfaces';

describe('FraudService', () => {
  let eventBus: EventBusImpl;
  let service: FraudService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new FraudService(eventBus);
  });

  describe('checkPayment', () => {
    it('should flag high-value payments', async () => {
      const result = await service.checkPayment({ id: 'pay_1', amount: 15000 });
      expect(result.is_fraud).toBe(true);
      expect(result.risk_score).toBeGreaterThanOrEqual(60);
      expect(result.flags.length).toBeGreaterThan(0);
      expect(result.flags[0].type).toBe('high_value');
      expect(result.flags[0].severity).toBe(FraudSeverity.HIGH);
    });

    it('should not flag low-value payments', async () => {
      const result = await service.checkPayment({ id: 'pay_1', amount: 100 });
      expect(result.is_fraud).toBe(false);
      expect(result.risk_score).toBe(0);
      expect(result.flags).toHaveLength(0);
    });

    it('should flag velocity check', async () => {
      const result = await service.checkPayment({
        id: 'pay_1',
        amount: 50,
        metadata: { velocity_check: true },
      });
      expect(result.flags.some(f => f.type === 'velocity')).toBe(true);
      expect(result.flags.find(f => f.type === 'velocity')!.severity).toBe(FraudSeverity.MEDIUM);
    });

    it('should combine flags for high value + velocity', async () => {
      const result = await service.checkPayment({
        id: 'pay_1',
        amount: 20000,
        metadata: { velocity_check: true },
      });
      expect(result.flags).toHaveLength(2);
      expect(result.is_fraud).toBe(true);
      expect(result.risk_score).toBe(90);
    });

    it('should publish FRAUD_CHECK_COMPLETED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('FRAUD_CHECK_COMPLETED', handler);
      await service.checkPayment({ id: 'pay_1', amount: 100 });
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.paymentId).toBe('pay_1');
    });
  });

  describe('checkTransaction', () => {
    it('should flag high-value transactions', async () => {
      const result = await service.checkTransaction({ id: 'txn_1', amount: 60000 });
      expect(result.is_fraud).toBe(true);
      expect(result.flags[0].type).toBe('high_value_txn');
    });

    it('should not flag normal transactions', async () => {
      const result = await service.checkTransaction({ id: 'txn_1', amount: 1000 });
      expect(result.is_fraud).toBe(false);
      expect(result.flags).toHaveLength(0);
    });
  });

  describe('checkSubscription', () => {
    it('should return no fraud for subscriptions', async () => {
      const result = await service.checkSubscription({ id: 'sub_1', plan_id: 'plan_a' });
      expect(result.is_fraud).toBe(false);
      expect(result.risk_score).toBe(0);
    });
  });

  describe('getFraudScore', () => {
    it('should return 0', async () => {
      const score = await service.getFraudScore('txn_1');
      expect(score).toBe(0);
    });
  });

  describe('blockCard / unblockCard', () => {
    it('should block a card', async () => {
      const result = await service.blockCard('4111111111111111');
      expect(result).toBe(true);
    });

    it('should unblock a blocked card', async () => {
      await service.blockCard('4111111111111111');
      const result = await service.unblockCard('4111111111111111');
      expect(result).toBe(true);
    });

    it('should return false when unblocking a card that was never blocked', async () => {
      const result = await service.unblockCard('4111111111111111');
      expect(result).toBe(false);
    });
  });
});
