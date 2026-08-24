import { SecurityManager } from '../../src/security/SecurityManager';

describe('SecurityManager', () => {
  let securityManager: SecurityManager;

  beforeEach(() => {
    securityManager = new SecurityManager();
  });

  it('should have default rules', () => {
    const rules = securityManager.getAllRules();
    expect(rules.length).toBeGreaterThan(0);
  });

  it('should register new rules', () => {
    securityManager.registerRule({
      name: 'IP Restriction',
      type: 'ip-restriction',
      enabled: true,
      config: { allowedIPs: ['192.168.1.1'] },
    });
    const rules = securityManager.getAllRules();
    expect(rules.length).toBe(4);
  });

  it('should update rules', () => {
    const rules = securityManager.getAllRules();
    const rule = rules[0];
    const updated = securityManager.updateRule(rule.id, { enabled: false });
    expect(updated?.enabled).toBe(false);
  });

  it('should delete rules', () => {
    const rule = securityManager.registerRule({
      name: 'Temp Rule',
      type: 'time-restriction',
      enabled: true,
      config: {},
    });
    expect(securityManager.deleteRule(rule.id)).toBe(true);
  });

  it('should track attempt limits', () => {
    expect(securityManager.checkAttemptLimit('student-1', 'exam-1')).toBe(true);
    securityManager.recordAttempt('student-1', 'exam-1');
    securityManager.recordAttempt('student-1', 'exam-1');
    expect(securityManager.getAttemptCount('student-1', 'exam-1')).toBe(2);
    expect(securityManager.checkAttemptLimit('student-1', 'exam-1')).toBe(true);
  });

  it('should enforce max attempts', () => {
    securityManager.setMaxAttempts(2);
    securityManager.recordAttempt('student-1', 'exam-1');
    securityManager.recordAttempt('student-1', 'exam-1');
    expect(securityManager.checkAttemptLimit('student-1', 'exam-1')).toBe(false);
  });

  it('should log proctoring events', () => {
    const event = securityManager.logProctoringEvent({
      sessionId: 'session-1',
      type: 'tab-switch',
      timestamp: new Date(),
      details: { tabCount: 3 },
      severity: 'medium',
    });
    expect(event.id).toBeTruthy();

    const events = securityManager.getProctoringEvents('session-1');
    expect(events.length).toBe(1);
  });

  it('should detect compromised sessions', () => {
    securityManager.logProctoringEvent({
      sessionId: 'session-1',
      type: 'suspicious-activity',
      timestamp: new Date(),
      details: {},
      severity: 'high',
    });
    expect(securityManager.isSessionCompromised('session-1')).toBe(true);
  });

  it('should filter events by severity', () => {
    securityManager.logProctoringEvent({
      sessionId: 'session-1',
      type: 'tab-switch',
      timestamp: new Date(),
      details: {},
      severity: 'low',
    });
    securityManager.logProctoringEvent({
      sessionId: 'session-1',
      type: 'copy-paste',
      timestamp: new Date(),
      details: {},
      severity: 'high',
    });

    const violations = securityManager.getSessionViolations('session-1', 'medium');
    expect(violations.length).toBe(1);
    expect(violations[0].type).toBe('copy-paste');
  });

  it('should clear attempt counts', () => {
    securityManager.recordAttempt('student-1', 'exam-1');
    securityManager.clearAttempts('student-1', 'exam-1');
    expect(securityManager.getAttemptCount('student-1', 'exam-1')).toBe(0);
  });
});
