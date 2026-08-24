import { RetentionEngine } from '../src/retention/engine';
import { RetentionStrategy, EventCategory } from '../src/interfaces';

describe('RetentionEngine', () => {
  let engine: RetentionEngine;

  beforeEach(async () => {
    engine = new RetentionEngine();
  });

  afterEach(async () => {
    await engine.shutdown();
  });

  it('should add and list rules', async () => {
    await engine.addRule({
      id: 'rule1',
      match: { category: EventCategory.USER_ACTION },
      strategy: RetentionStrategy.DELETE,
      ttl: '30d',
      priority: 1,
    });

    const rules = await engine.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('rule1');
  });

  it('should prevent duplicate rule ids', async () => {
    await engine.addRule({
      id: 'dup',
      match: {},
      strategy: RetentionStrategy.DELETE,
      ttl: '7d',
      priority: 1,
    });

    await expect(engine.addRule({
      id: 'dup',
      match: {},
      strategy: RetentionStrategy.DELETE,
      ttl: '30d',
      priority: 2,
    })).rejects.toThrow('already exists');
  });

  it('should remove rules', async () => {
    await engine.addRule({ id: 'r1', match: {}, strategy: RetentionStrategy.DELETE, ttl: '7d', priority: 1 });
    await engine.addRule({ id: 'r2', match: {}, strategy: RetentionStrategy.ARCHIVE, ttl: '30d', priority: 2 });

    await engine.removeRule('r1');
    const rules = await engine.getRules();
    expect(rules).toHaveLength(1);
    expect(rules[0].id).toBe('r2');
  });

  it('should sort rules by priority descending', async () => {
    await engine.addRule({ id: 'low', match: {}, strategy: RetentionStrategy.DELETE, ttl: '7d', priority: 1 });
    await engine.addRule({ id: 'high', match: {}, strategy: RetentionStrategy.ARCHIVE, ttl: '30d', priority: 10 });

    const rules = await engine.getRules();
    expect(rules[0].id).toBe('high');
    expect(rules[1].id).toBe('low');
  });

  it('should count matching targets in dry run', async () => {
    await engine.addRule({
      id: 'cleanup',
      match: { category: EventCategory.USER_ACTION },
      strategy: RetentionStrategy.DELETE,
      ttl: '1s',
      priority: 1,
    });

    engine.registerTarget({
      type: 'event',
      name: 'test_event',
      timestamp: new Date(Date.now() - 10000),
      category: EventCategory.USER_ACTION,
      size: 100,
    });

    engine.registerTarget({
      type: 'event',
      name: 'recent_event',
      timestamp: new Date(),
      category: EventCategory.USER_ACTION,
      size: 50,
    });

    const results = await engine.dryRun();
    expect(results).toHaveLength(1);
    expect(results[0].affected_records).toBe(1);
  });

  it('should delete expired targets on evaluate', async () => {
    await engine.addRule({
      id: 'delete_old',
      match: {},
      strategy: RetentionStrategy.DELETE,
      ttl: '1s',
      priority: 1,
    });

    engine.registerTarget({
      type: 'event', name: 'old', timestamp: new Date(Date.now() - 10000), size: 100,
    });
    engine.registerTarget({
      type: 'event', name: 'new', timestamp: new Date(), size: 100,
    });

    const results = await engine.evaluate();
    expect(results).toHaveLength(1);
    expect(results[0].affected_records).toBe(1);

    const dryResults = await engine.dryRun();
    expect(dryResults[0].affected_records).toBe(0);
  });

  it('should handle invalid TTL gracefully', async () => {
    await engine.addRule({
      id: 'bad_ttl',
      match: {},
      strategy: RetentionStrategy.DELETE,
      ttl: 'invalid',
      priority: 1,
    });

    engine.registerTarget({ type: 'event', name: 'e1', timestamp: new Date(0), size: 10 });
    const results = await engine.evaluate();
    expect(results[0].success).toBe(false);
  });
});
