import { ReconciliationService } from '../src/modules/reconciliation/reconciliation.service';
import { EventBusImpl } from '../src/events/event-bus';
import { TransactionLog, ReconciliationLog, ReconciliationReport, ReconciliationSummary, TransactionSummary } from '../src/interfaces';

describe('ReconciliationService', () => {
  let eventBus: EventBusImpl;
  let service: ReconciliationService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new ReconciliationService(eventBus);
  });

  describe('reconcilePayments', () => {
    it('should return zeroed result', async () => {
      const result = await service.reconcilePayments(new Date('2026-01-01'), new Date('2026-01-31'));
      expect(result.total_payments).toBe(0);
      expect(result.successful_payments).toBe(0);
      expect(result.failed_payments).toBe(0);
      expect(result.total_amount).toBe(0);
      expect(result.fees).toBe(0);
      expect(result.net_amount).toBe(0);
    });
  });

  describe('reconcileTransactions', () => {
    it('should return zeroed result', async () => {
      const result = await service.reconcileTransactions(new Date('2026-01-01'), new Date('2026-01-31'));
      expect(result.total_payments).toBe(0);
    });
  });

  describe('getTransactionLog', () => {
    it('should throw for non-existent log', async () => {
      await expect(service.getTransactionLog('txn_nonexistent')).rejects.toThrow('Transaction log not found');
    });
  });

  describe('getReconciliationLog', () => {
    it('should throw for non-existent log', async () => {
      await expect(service.getReconciliationLog('rec_nonexistent')).rejects.toThrow('Reconciliation log not found');
    });
  });

  describe('createReconciliationReport', () => {
    it('should return the report data', async () => {
      const summary: ReconciliationSummary = {
        total_transactions: 100,
        successful_transactions: 95,
        failed_transactions: 5,
        total_amount: 50000,
        fees: 1500,
        net_amount: 48500,
        currency: 'USD',
      };
      const transactions: TransactionSummary[] = [
        { id: 'txn_1', status: 'completed', amount: 500, currency: 'USD', timestamp: new Date(), payment_method: 'card' },
      ];
      const report: ReconciliationReport = {
        id: 'rec_1',
        date: new Date(),
        period: '2026-01',
        provider: 'stripe',
        summary,
        transactions,
      };
      const result = await service.createReconciliationReport(report);
      expect(result.id).toBe('rec_1');
      expect(result.summary.total_transactions).toBe(100);
      expect(result.summary.net_amount).toBe(48500);
      expect(result.transactions).toHaveLength(1);
    });

    it('should publish RECONCILIATION_REPORT_CREATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('RECONCILIATION_REPORT_CREATED', handler);
      const report: ReconciliationReport = {
        id: 'rec_1',
        date: new Date(),
        period: '2026-01',
        provider: 'stripe',
        summary: {
          total_transactions: 0,
          successful_transactions: 0,
          failed_transactions: 0,
          total_amount: 0,
          fees: 0,
          net_amount: 0,
          currency: 'USD',
        },
        transactions: [],
      };
      await service.createReconciliationReport(report);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].payload.report.id).toBe('rec_1');
    });
  });
});
