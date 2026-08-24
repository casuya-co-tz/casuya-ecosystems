import { randomUUID } from 'crypto';
import { IReconciliationService, ReconciliationResult, TransactionLog, ReconciliationLog, ReconciliationReport, EventBus } from '../../interfaces';

interface TransactionRecord {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  timestamp: Date;
  type: string;
}

export class ReconciliationService implements IReconciliationService {
  private readonly logs: Map<string, TransactionLog> = new Map();
  private readonly reconciliations: Map<string, ReconciliationLog> = new Map();
  private readonly transactionRecords: TransactionRecord[] = [];

  constructor(private eventBus: EventBus) {}

  addTransactionRecord(record: TransactionRecord): void {
    this.transactionRecords.push(record);
  }

  async reconcilePayments(startDate: Date, endDate: Date): Promise<ReconciliationResult> {
    const records = this.transactionRecords.filter(r =>
      r.type === 'payment' &&
      r.timestamp >= startDate &&
      r.timestamp <= endDate
    );

    const successful = records.filter(r => r.status === 'completed' || r.status === 'success');
    const failed = records.filter(r => r.status === 'failed');
    const totalAmount = successful.reduce((sum, r) => sum + r.amount, 0);
    const fees = totalAmount * 0.029 + (successful.length * 0.30);
    const netAmount = totalAmount - fees;

    const result: ReconciliationResult = {
      total_payments: records.length,
      successful_payments: successful.length,
      failed_payments: failed.length,
      total_amount: Math.round(totalAmount * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      net_amount: Math.round(netAmount * 100) / 100,
    };

    const logId = randomUUID();
    const log: ReconciliationLog = {
      id: logId,
      date: new Date(),
      period: `${startDate.toISOString()} - ${endDate.toISOString()}`,
      total_volume: records.length,
      reconciled_at: new Date(),
      status: 'completed',
    };
    this.reconciliations.set(logId, log);

    this.eventBus.publish({
      id: `reconciliation_payments_${logId}`,
      type: 'RECONCILIATION_COMPLETED',
      payload: { result, logId, period: log.period },
      timestamp: new Date(),
      source: 'ReconciliationService',
    });

    return result;
  }

  async reconcileTransactions(startDate: Date, endDate: Date): Promise<ReconciliationResult> {
    const records = this.transactionRecords.filter(r =>
      r.timestamp >= startDate &&
      r.timestamp <= endDate
    );

    const completed = records.filter(r => r.status === 'completed' || r.status === 'success');
    const failed = records.filter(r => r.status === 'failed');
    const totalAmount = completed.reduce((sum, r) => sum + r.amount, 0);
    const fees = totalAmount * 0.029 + (completed.length * 0.30);
    const netAmount = totalAmount - fees;

    return {
      total_payments: records.length,
      successful_payments: completed.length,
      failed_payments: failed.length,
      total_amount: Math.round(totalAmount * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      net_amount: Math.round(netAmount * 100) / 100,
    };
  }

  async getTransactionLog(transactionId: string): Promise<TransactionLog> {
    const log = this.logs.get(transactionId);
    if (!log) throw new Error(`Transaction log not found: ${transactionId}`);
    return log;
  }

  async getReconciliationLog(reconciliationId: string): Promise<ReconciliationLog> {
    const log = this.reconciliations.get(reconciliationId);
    if (!log) throw new Error(`Reconciliation log not found: ${reconciliationId}`);
    return log;
  }

  async createReconciliationReport(data: ReconciliationReport): Promise<ReconciliationReport> {
    const report = { ...data };
    this.eventBus.publish({
      id: `reconciliation_report_${randomUUID()}`,
      type: 'RECONCILIATION_REPORT_CREATED',
      payload: { report },
      timestamp: new Date(),
      source: 'ReconciliationService',
    });
    return report;
  }

  async recordTransactionLog(log: TransactionLog): Promise<void> {
    this.logs.set(log.id, log);
  }

  async getDiscrepancies(startDate: Date, endDate: Date): Promise<{ transactionId: string; issue: string; expected: number; actual: number }[]> {
    const records = this.transactionRecords.filter(r => r.timestamp >= startDate && r.timestamp <= endDate);
    const discrepancies: { transactionId: string; issue: string; expected: number; actual: number }[] = [];

    for (const record of records) {
      if (record.status === 'failed' && record.amount > 0) {
        discrepancies.push({
          transactionId: record.id,
          issue: 'Failed transaction has non-zero amount',
          expected: 0,
          actual: record.amount,
        });
      }
    }

    return discrepancies;
  }
}
