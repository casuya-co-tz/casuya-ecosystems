import { randomUUID } from 'crypto';
import { IFraudDetector, IPayment, ITransaction, ISubscription, FraudResult, FraudFlag, FraudSeverity, EventBus } from '../../interfaces';

interface FraudHistoryEntry {
  transactionId: string;
  timestamp: Date;
  riskScore: number;
  flags: FraudFlag[];
}

export class FraudService implements IFraudDetector {
  private blockedCards: Set<string> = new Set();
  private readonly transactionHistory: Map<string, FraudHistoryEntry[]> = new Map();
  private readonly suspiciousCustomers: Map<string, { count: number; lastFlagged: Date }> = new Map();
  private readonly VELOCITY_WINDOW_MS = 60 * 1000;
  private readonly VELOCITY_THRESHOLD = 5;
  private readonly HIGH_VALUE_THRESHOLD = 10000;
  private readonly CRITICAL_VALUE_THRESHOLD = 50000;

  constructor(private eventBus: EventBus) {}

  async checkPayment(payment: Partial<IPayment>): Promise<FraudResult> {
    const flags: FraudFlag[] = [];

    const cardNumber = payment.metadata?.card_number as string | undefined;
    if (cardNumber && this.blockedCards.has(cardNumber)) {
      flags.push({ type: 'blocked_card', severity: FraudSeverity.CRITICAL, description: 'Payment uses a blocked card' });
    }

    if (payment.amount && payment.amount > this.CRITICAL_VALUE_THRESHOLD) {
      flags.push({ type: 'critical_value', severity: FraudSeverity.CRITICAL, description: `Payment exceeds critical threshold (${payment.amount})` });
    } else if (payment.amount && payment.amount > this.HIGH_VALUE_THRESHOLD) {
      flags.push({ type: 'high_value', severity: FraudSeverity.HIGH, description: `Payment exceeds high-value threshold (${payment.amount})` });
    }

    if (payment.metadata?.velocity_check) {
      flags.push({ type: 'velocity', severity: FraudSeverity.MEDIUM, description: 'Multiple payments in short period' });
    }

    if (payment.customer_id) {
      const velocityFlags = await this.checkVelocity(payment.customer_id);
      flags.push(...velocityFlags);
    }

    if (payment.currency && payment.amount) {
      const amountFlags = this.checkAmountPatterns(payment.amount, payment.currency);
      flags.push(...amountFlags);
    }

    if (payment.metadata?.ip_address) {
      const ipFlags = this.checkSuspiciousIp(payment.metadata.ip_address as string);
      flags.push(...ipFlags);
    }

    const isFraud = flags.some(f => f.severity === FraudSeverity.HIGH || f.severity === FraudSeverity.CRITICAL);
    const riskScore = Math.min(100, flags.reduce((score, f) => {
      const weights = { [FraudSeverity.LOW]: 10, [FraudSeverity.MEDIUM]: 25, [FraudSeverity.HIGH]: 50, [FraudSeverity.CRITICAL]: 80 };
      return score + (weights[f.severity] || 0);
    }, 0));

    if (payment.customer_id) {
      this.recordTransaction(payment.customer_id, payment.id ?? `pay_${Date.now()}`, riskScore, flags);
    }

    this.eventBus.publish({
      id: `fraud_check_payment_${randomUUID()}`,
      type: 'FRAUD_CHECK_COMPLETED',
      payload: { paymentId: payment.id, isFraud, riskScore, flags },
      timestamp: new Date(),
      source: 'FraudService',
    });

    return { is_fraud: isFraud, risk_score: riskScore, reasons: flags.map(f => f.description), flags };
  }

  async checkTransaction(transaction: Partial<ITransaction>): Promise<FraudResult> {
    const flags: FraudFlag[] = [];

    if (transaction.amount && transaction.amount > 50000) {
      flags.push({ type: 'high_value_txn', severity: FraudSeverity.HIGH, description: `Transaction exceeds threshold (${transaction.amount})` });
    }

    if (transaction.type === 'refund' && transaction.amount && transaction.amount > 10000) {
      flags.push({ type: 'large_refund', severity: FraudSeverity.HIGH, description: `Large refund amount (${transaction.amount})` });
    }

    if (transaction.metadata?.refund_count && (transaction.metadata.refund_count as number) > 3) {
      flags.push({ type: 'frequent_refunds', severity: FraudSeverity.MEDIUM, description: 'Customer has excessive refund requests' });
    }

    return {
      is_fraud: flags.some(f => f.severity === FraudSeverity.HIGH || f.severity === FraudSeverity.CRITICAL),
      risk_score: Math.min(100, flags.length * 40),
      reasons: flags.map(f => f.description),
      flags,
    };
  }

  async checkSubscription(subscription: Partial<ISubscription>): Promise<FraudResult> {
    const flags: FraudFlag[] = [];

    if (subscription.metadata?.card_swap_count && (subscription.metadata.card_swap_count as number) > 3) {
      flags.push({ type: 'frequent_card_changes', severity: FraudSeverity.MEDIUM, description: 'Subscription has had multiple payment method changes' });
    }

    if (subscription.metadata?.failed_payment_count && (subscription.metadata.failed_payment_count as number) > 2) {
      flags.push({ type: 'repeated_payment_failures', severity: FraudSeverity.MEDIUM, description: 'Subscription has repeated payment failures' });
    }

    if (subscription.customer_id) {
      const suspicious = this.suspiciousCustomers.get(subscription.customer_id);
      if (suspicious && suspicious.count > 2) {
        flags.push({ type: 'suspicious_customer', severity: FraudSeverity.HIGH, description: 'Customer has prior fraud flags' });
      }
    }

    return {
      is_fraud: flags.some(f => f.severity === FraudSeverity.HIGH || f.severity === FraudSeverity.CRITICAL),
      risk_score: Math.min(100, flags.reduce((score, f) => score + (f.severity === FraudSeverity.HIGH ? 50 : 20), 0)),
      reasons: flags.map(f => f.description),
      flags,
    };
  }

  async getFraudScore(transactionId: string): Promise<number> {
    for (const history of this.transactionHistory.values()) {
      const entry = history.find(h => h.transactionId === transactionId);
      if (entry) return entry.riskScore;
    }
    return 0;
  }

  async blockCard(cardNumber: string): Promise<boolean> {
    this.blockedCards.add(cardNumber);
    return true;
  }

  async unblockCard(cardNumber: string): Promise<boolean> {
    return this.blockedCards.delete(cardNumber);
  }

  async getCustomerRiskProfile(customerId: string): Promise<{ averageRiskScore: number; totalTransactions: number; flaggedTransactions: number }> {
    const history = this.transactionHistory.get(customerId) ?? [];
    if (history.length === 0) {
      return { averageRiskScore: 0, totalTransactions: 0, flaggedTransactions: 0 };
    }
    const totalRisk = history.reduce((sum, h) => sum + h.riskScore, 0);
    const flagged = history.filter(h => h.riskScore > 50).length;
    return {
      averageRiskScore: Math.round(totalRisk / history.length),
      totalTransactions: history.length,
      flaggedTransactions: flagged,
    };
  }

  private async checkVelocity(customerId: string): Promise<FraudFlag[]> {
    const flags: FraudFlag[] = [];
    const history = this.transactionHistory.get(customerId) ?? [];
    const now = new Date();
    const recentTransactions = history.filter(h => now.getTime() - h.timestamp.getTime() < this.VELOCITY_WINDOW_MS);

    if (recentTransactions.length >= this.VELOCITY_THRESHOLD) {
      flags.push({
        type: 'velocity',
        severity: FraudSeverity.HIGH,
        description: `${recentTransactions.length} transactions in the last minute (threshold: ${this.VELOCITY_THRESHOLD})`,
      });
    } else if (recentTransactions.length >= Math.floor(this.VELOCITY_THRESHOLD * 0.6)) {
      flags.push({
        type: 'velocity_warning',
        severity: FraudSeverity.LOW,
        description: `${recentTransactions.length} transactions approaching velocity threshold`,
      });
    }

    return flags;
  }

  private checkAmountPatterns(amount: number, currency: string): FraudFlag[] {
    const flags: FraudFlag[] = [];
    const roundedAmounts = [100, 500, 1000, 5000, 10000];
    if (roundedAmounts.includes(amount)) {
      flags.push({
        type: 'round_amount',
        severity: FraudSeverity.LOW,
        description: `Payment is a round amount (${currency} ${amount})`,
      });
    }
    const digits = amount.toFixed(2).replace('.', '').split('').map(Number);
    if (digits.length >= 3) {
      const lastThree = digits.slice(-3).join('');
      if (lastThree === '000' || lastThree === '999') {
        flags.push({
          type: 'suspicious_amount_pattern',
          severity: FraudSeverity.LOW,
          description: 'Amount ends with suspicious digit pattern',
        });
      }
    }
    return flags;
  }

  private checkSuspiciousIp(ip: string): FraudFlag[] {
    const flags: FraudFlag[] = [];
    const knownVpnRanges = ['10.', '192.168.', '172.16.', '172.17.', '172.18.'];
    if (knownVpnRanges.some(range => ip.startsWith(range))) {
      flags.push({
        type: 'private_ip',
        severity: FraudSeverity.LOW,
        description: 'Payment originated from a private IP range',
      });
    }
    return flags;
  }

  private recordTransaction(customerId: string, transactionId: string, riskScore: number, flags: FraudFlag[]): void {
    if (!this.transactionHistory.has(customerId)) {
      this.transactionHistory.set(customerId, []);
    }
    this.transactionHistory.get(customerId)!.push({
      transactionId,
      timestamp: new Date(),
      riskScore,
      flags,
    });

    if (riskScore > 50) {
      const existing = this.suspiciousCustomers.get(customerId) ?? { count: 0, lastFlagged: new Date() };
      this.suspiciousCustomers.set(customerId, {
        count: existing.count + 1,
        lastFlagged: new Date(),
      });
    }
  }
}
