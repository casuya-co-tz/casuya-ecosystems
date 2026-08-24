import { RetentionRule, RetentionResult } from './types';

export interface RetentionPolicy {
  readonly name: string;
  addRule(rule: RetentionRule): Promise<void>;
  removeRule(ruleId: string): Promise<void>;
  getRules(): Promise<RetentionRule[]>;
  evaluate(): Promise<RetentionResult[]>;
  dryRun(): Promise<RetentionResult[]>;
  shutdown(): Promise<void>;
}
