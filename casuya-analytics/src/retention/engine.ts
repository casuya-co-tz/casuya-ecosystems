import {
  EventCategory,
  RetentionMatch,
  RetentionPolicy,
  RetentionResult,
  RetentionRule,
  RetentionStrategy,
} from '../interfaces';

interface RetentionTarget {
  type: 'event' | 'metric' | 'report';
  name: string;
  timestamp: Date;
  category?: EventCategory;
  source?: string;
  tags?: Record<string, string>;
  size: number;
}

export class RetentionEngine implements RetentionPolicy {
  readonly name = 'default-retention-engine';
  private rules: Map<string, RetentionRule> = new Map();
  private targets: RetentionTarget[] = [];

  registerTarget(target: RetentionTarget): void {
    this.targets.push(target);
  }

  registerTargets(targets: RetentionTarget[]): void {
    this.targets.push(...targets);
  }

  async addRule(rule: RetentionRule): Promise<void> {
    if (this.rules.has(rule.id)) {
      throw new Error(`Retention rule '${rule.id}' already exists`);
    }
    this.rules.set(rule.id, rule);
  }

  async removeRule(ruleId: string): Promise<void> {
    this.rules.delete(ruleId);
  }

  async getRules(): Promise<RetentionRule[]> {
    return Array.from(this.rules.values()).sort((a, b) => b.priority - a.priority);
  }

  async evaluate(): Promise<RetentionResult[]> {
    const results: RetentionResult[] = [];
    const sortedRules = await this.getRules();
    const now = Date.now();

    for (const rule of sortedRules) {
      try {
        const affected = this.applyRule(rule, now);
        results.push({
          rule_id: rule.id,
          affected_records: affected,
          strategy: rule.strategy,
          executed_at: new Date(),
          success: true,
        });
      } catch (error) {
        results.push({
          rule_id: rule.id,
          affected_records: 0,
          strategy: rule.strategy,
          executed_at: new Date(),
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  async dryRun(): Promise<RetentionResult[]> {
    const results: RetentionResult[] = [];
    const sortedRules = await this.getRules();
    const now = Date.now();

    for (const rule of sortedRules) {
      try {
        const affected = this.countMatching(rule, now);
        results.push({
          rule_id: rule.id,
          affected_records: affected,
          strategy: rule.strategy,
          executed_at: new Date(),
          success: true,
        });
      } catch (error) {
        results.push({
          rule_id: rule.id,
          affected_records: 0,
          strategy: rule.strategy,
          executed_at: new Date(),
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return results;
  }

  async shutdown(): Promise<void> {
    this.rules.clear();
    this.targets = [];
  }

  private parseTTL(ttl: string): number {
    const match = ttl.match(/^(\d+)\s*(s|m|h|d|w|M|y)$/);
    if (!match) throw new Error(`Invalid TTL format: ${ttl}`);

    const amount = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return amount * 1000;
      case 'm': return amount * 60 * 1000;
      case 'h': return amount * 3600 * 1000;
      case 'd': return amount * 86400 * 1000;
      case 'w': return amount * 7 * 86400 * 1000;
      case 'M': return amount * 30 * 86400 * 1000;
      case 'y': return amount * 365 * 86400 * 1000;
      default: return amount * 86400 * 1000;
    }
  }

  private targetMatchesRule(target: RetentionTarget, match: RetentionMatch): boolean {
    if (match.category && target.category !== match.category) return false;
    if (match.metric_name && target.name !== match.metric_name) return false;
    if (match.source && target.source !== match.source) return false;

    if (match.tags && target.tags) {
      for (const [key, value] of Object.entries(match.tags)) {
        if (target.tags[key] !== value) return false;
      }
    }

    return true;
  }

  private countMatching(rule: RetentionRule, now: number): number {
    const ttlMs = this.parseTTL(rule.ttl);
    const cutoff = now - ttlMs;

    return this.targets.filter(target => {
      if (!this.targetMatchesRule(target, rule.match)) return false;
      return target.timestamp.getTime() < cutoff;
    }).length;
  }

  private applyRule(rule: RetentionRule, now: number): number {
    const ttlMs = this.parseTTL(rule.ttl);
    const cutoff = now - ttlMs;
    let count = 0;

    this.targets = this.targets.filter(target => {
      if (!this.targetMatchesRule(target, rule.match)) return true;
      if (target.timestamp.getTime() < cutoff) {
        count++;
        return rule.strategy !== RetentionStrategy.DELETE;
      }
      return true;
    });

    return count;
  }
}
