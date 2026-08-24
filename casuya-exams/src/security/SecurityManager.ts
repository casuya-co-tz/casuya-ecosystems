import { SecurityRule, ProctoringEvent } from '../types';
import { generateId } from '../utilities/id-generator';

export class SecurityManager {
  private rules: Map<string, SecurityRule>;
  private proctoringEvents: Map<string, ProctoringEvent[]>;
  private attemptCounts: Map<string, number>;
  private maxAttempts: number;

  constructor(maxAttempts = 3) {
    this.rules = new Map();
    this.proctoringEvents = new Map();
    this.attemptCounts = new Map();
    this.maxAttempts = maxAttempts;
    this.registerDefaultRules();
  }

  registerRule(rule: Omit<SecurityRule, 'id'>): SecurityRule {
    const newRule: SecurityRule = {
      id: generateId('rule'),
      ...rule,
    };
    this.rules.set(newRule.id, newRule);
    return newRule;
  }

  registerRules(rules: Omit<SecurityRule, 'id'>[]): SecurityRule[] {
    return rules.map((r) => this.registerRule(r));
  }

  updateRule(id: string, data: Partial<Omit<SecurityRule, 'id'>>): SecurityRule | undefined {
    const rule = this.rules.get(id);
    if (!rule) return undefined;

    const updated: SecurityRule = { ...rule, ...data };
    this.rules.set(id, updated);
    return updated;
  }

  deleteRule(id: string): boolean {
    return this.rules.delete(id);
  }

  getRule(id: string): SecurityRule | undefined {
    return this.rules.get(id);
  }

  getAllRules(): SecurityRule[] {
    return Array.from(this.rules.values());
  }

  getEnabledRules(): SecurityRule[] {
    return this.getAllRules().filter((r) => r.enabled);
  }

  checkAttemptLimit(participantId: string, examId: string): boolean {
    const key = `${participantId}:${examId}`;
    const attempts = this.attemptCounts.get(key) || 0;
    return attempts < this.maxAttempts;
  }

  recordAttempt(participantId: string, examId: string): void {
    const key = `${participantId}:${examId}`;
    const current = this.attemptCounts.get(key) || 0;
    this.attemptCounts.set(key, current + 1);
  }

  getAttemptCount(participantId: string, examId: string): number {
    const key = `${participantId}:${examId}`;
    return this.attemptCounts.get(key) || 0;
  }

  logProctoringEvent(event: Omit<ProctoringEvent, 'id'>): ProctoringEvent {
    const proctoringEvent: ProctoringEvent = {
      id: generateId('proctor'),
      ...event,
    };

    const existing = this.proctoringEvents.get(event.sessionId) || [];
    existing.push(proctoringEvent);
    this.proctoringEvents.set(event.sessionId, existing);

    return proctoringEvent;
  }

  getProctoringEvents(sessionId: string): ProctoringEvent[] {
    return this.proctoringEvents.get(sessionId) || [];
  }

  getSessionViolations(
    sessionId: string,
    minSeverity: ProctoringEvent['severity'] = 'medium',
  ): ProctoringEvent[] {
    const severities: ProctoringEvent['severity'][] = ['low', 'medium', 'high', 'critical'];
    const minIndex = severities.indexOf(minSeverity);

    return (this.proctoringEvents.get(sessionId) || []).filter(
      (e) => severities.indexOf(e.severity) >= minIndex,
    );
  }

  isSessionCompromised(sessionId: string): boolean {
    const events = this.proctoringEvents.get(sessionId) || [];
    return events.some((e) => e.severity === 'high' || e.severity === 'critical');
  }

  setMaxAttempts(limit: number): void {
    this.maxAttempts = limit;
  }

  clearAttempts(participantId?: string, examId?: string): void {
    if (participantId && examId) {
      this.attemptCounts.delete(`${participantId}:${examId}`);
    } else {
      this.attemptCounts.clear();
    }
  }

  private registerDefaultRules(): void {
    this.registerRule({
      name: 'Copy Protection',
      type: 'copy-protection',
      enabled: true,
      config: {
        disableRightClick: true,
        disableCopyPaste: true,
        disablePrintScreen: false,
      },
    });
    this.registerRule({
      name: 'Attempt Limit',
      type: 'attempt-limit',
      enabled: true,
      config: {
        maxAttempts: this.maxAttempts,
      },
    });
    this.registerRule({
      name: 'Basic Proctoring',
      type: 'proctoring',
      enabled: false,
      config: {
        detectTabSwitch: true,
        warnOnTabSwitch: true,
        autoSubmitOnTabSwitch: false,
        maxTabSwitches: 3,
      },
    });
  }

  clear(): void {
    this.rules.clear();
    this.proctoringEvents.clear();
    this.attemptCounts.clear();
    this.registerDefaultRules();
  }
}
