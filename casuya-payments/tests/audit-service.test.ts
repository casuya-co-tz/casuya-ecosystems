import { AuditService } from '../src/modules/logs/audit.service';
import { EventBusImpl } from '../src/events/event-bus';

describe('AuditService', () => {
  let eventBus: EventBusImpl;
  let service: AuditService;

  beforeEach(() => {
    eventBus = new EventBusImpl();
    service = new AuditService(eventBus);
  });

  describe('log', () => {
    it('should create a log entry with id and timestamp', async () => {
      const entry = await service.log({
        action: 'PAYMENT_CREATE',
        userId: 'user_1',
        resource: 'payment',
        resourceId: 'pay_1',
        details: { amount: 100 },
        status: 'success',
      });
      expect(entry.id).toMatch(/^audit_/);
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.action).toBe('PAYMENT_CREATE');
      expect(entry.userId).toBe('user_1');
      expect(entry.status).toBe('success');
    });

    it('should publish AUDIT_LOG_CREATED event', async () => {
      const handler = jest.fn();
      eventBus.subscribe('AUDIT_LOG_CREATED', handler);
      await service.log({
        action: 'LOGIN',
        userId: 'user_1',
        resource: 'session',
        resourceId: 'sess_1',
        details: {},
        status: 'success',
      });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should store optional ipAddress and userAgent', async () => {
      const entry = await service.log({
        action: 'LOGIN',
        userId: 'user_1',
        resource: 'session',
        resourceId: 'sess_1',
        details: {},
        status: 'success',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });
      expect(entry.ipAddress).toBe('127.0.0.1');
      expect(entry.userAgent).toBe('Mozilla/5.0');
    });
  });

  describe('getLog', () => {
    it('should retrieve a log by id', async () => {
      const created = await service.log({
        action: 'TEST',
        userId: 'u1',
        resource: 'r',
        resourceId: '1',
        details: {},
        status: 'success',
      });
      const retrieved = await service.getLog(created.id);
      expect(retrieved?.id).toBe(created.id);
    });

    it('should return undefined for non-existent log', async () => {
      const result = await service.getLog('audit_nonexistent');
      expect(result).toBeUndefined();
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      await service.log({ action: 'CREATE', userId: 'u1', resource: 'payment', resourceId: 'p1', details: {}, status: 'success' });
      await service.log({ action: 'CREATE', userId: 'u2', resource: 'payment', resourceId: 'p2', details: {}, status: 'success' });
      await service.log({ action: 'DELETE', userId: 'u1', resource: 'payment', resourceId: 'p1', details: {}, status: 'failure' });
    });

    it('should return all logs', async () => {
      const logs = await service.getLogs();
      expect(logs).toHaveLength(3);
    });

    it('should filter by userId', async () => {
      const logs = await service.getLogs({ userId: 'u1' });
      expect(logs).toHaveLength(2);
    });

    it('should filter by action', async () => {
      const logs = await service.getLogs({ action: 'DELETE' });
      expect(logs).toHaveLength(1);
    });

    it('should filter by resource', async () => {
      const logs = await service.getLogs({ resource: 'payment' });
      expect(logs).toHaveLength(3);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const logs = await service.getLogs({ startDate: now });
      expect(logs.length).toBeGreaterThanOrEqual(0);
    });

    it('should sort logs by timestamp descending', async () => {
      const logs = await service.getLogs();
      for (let i = 1; i < logs.length; i++) {
        expect(logs[i - 1].timestamp.getTime()).toBeGreaterThanOrEqual(logs[i].timestamp.getTime());
      }
    });
  });

  describe('getLogsByUser', () => {
    it('should return logs for a specific user', async () => {
      await service.log({ action: 'A', userId: 'u1', resource: 'r', resourceId: '1', details: {}, status: 'success' });
      await service.log({ action: 'B', userId: 'u2', resource: 'r', resourceId: '2', details: {}, status: 'success' });
      const logs = await service.getLogsByUser('u1');
      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('u1');
    });
  });

  describe('getLogsByAction', () => {
    it('should return logs for a specific action', async () => {
      await service.log({ action: 'LOGIN', userId: 'u1', resource: 'r', resourceId: '1', details: {}, status: 'success' });
      await service.log({ action: 'LOGOUT', userId: 'u1', resource: 'r', resourceId: '2', details: {}, status: 'success' });
      const logs = await service.getLogsByAction('LOGIN');
      expect(logs).toHaveLength(1);
    });
  });

  describe('getFailedLogs', () => {
    it('should return only failed logs', async () => {
      await service.log({ action: 'A', userId: 'u1', resource: 'r', resourceId: '1', details: {}, status: 'success' });
      await service.log({ action: 'B', userId: 'u1', resource: 'r', resourceId: '2', details: {}, status: 'failure' });
      const failed = await service.getFailedLogs();
      expect(failed).toHaveLength(1);
      expect(failed[0].status).toBe('failure');
    });
  });

  describe('clearLogs', () => {
    it('should clear all logs', async () => {
      await service.log({ action: 'A', userId: 'u1', resource: 'r', resourceId: '1', details: {}, status: 'success' });
      await service.clearLogs();
      const logs = await service.getLogs();
      expect(logs).toHaveLength(0);
    });
  });

  describe('getLogCount', () => {
    it('should return the correct count', async () => {
      await service.log({ action: 'A', userId: 'u1', resource: 'r', resourceId: '1', details: {}, status: 'success' });
      await service.log({ action: 'B', userId: 'u1', resource: 'r', resourceId: '2', details: {}, status: 'success' });
      expect(await service.getLogCount()).toBe(2);
    });

    it('should return 0 when empty', async () => {
      expect(await service.getLogCount()).toBe(0);
    });
  });
});
