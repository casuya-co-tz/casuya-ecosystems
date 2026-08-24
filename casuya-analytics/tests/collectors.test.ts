import { ApiCollector } from '../src/collectors/api-collector';
import { BatchCollector } from '../src/collectors/batch-collector';
import { CollectorRegistry } from '../src/collectors/registry';
import { EventCategory } from '../src/interfaces';

describe('ApiCollector', () => {
  let collector: ApiCollector;

  beforeEach(async () => {
    collector = new ApiCollector();
    await collector.initialize({
      name: 'api',
      enabled: true,
      options: { allowedSources: ['app', 'web'] },
    });
  });

  afterEach(async () => {
    await collector.shutdown();
  });

  it('should build event from request body', async () => {
    const event = await collector.collectFromRequest({
      name: 'page_view',
      category: 'user_action',
      source: 'app',
      payload: { page: '/home' },
      user_id: 'user_123',
    });

    expect(event.name).toBe('page_view');
    expect(event.category).toBe(EventCategory.USER_ACTION);
    expect(event.source).toBe('app');
    expect(event.user_id).toBe('user_123');
    expect(event.payload.page).toBe('/home');
  });

  it('should generate id if not provided', async () => {
    const event = await collector.collectFromRequest({
      name: 'test',
      category: 'custom',
      source: 'web',
      payload: {},
    });

    expect(event.id).toBeDefined();
    expect(event.id).toMatch(/^evt_/);
  });

  it('should reject empty name', async () => {
    await expect(collector.collectFromRequest({
      name: '',
      category: 'user_action',
      source: 'app',
      payload: {},
    })).rejects.toThrow('Event validation failed');
  });

  it('should reject disallowed sources', async () => {
    await expect(collector.collectFromRequest({
      name: 'test',
      category: 'user_action',
      source: 'hacker',
      payload: {},
    })).rejects.toThrow('Event validation failed');
  });

  it('should process batch of events', async () => {
    const batch = [
      { name: 'event1', category: 'user_action', source: 'app', payload: {} },
      { name: 'event2', category: 'system_event', source: 'web', payload: {} },
    ];

    const events = await collector.collectFromBatch(batch);
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('event1');
    expect(events[1].name).toBe('event2');
  });
});

describe('BatchCollector', () => {
  let collector: BatchCollector;

  beforeEach(async () => {
    collector = new BatchCollector();
    await collector.initialize({
      name: 'batch',
      enabled: true,
      options: { maxBatchSize: 5, flushIntervalMs: 0 },
    });
  });

  afterEach(async () => {
    await collector.shutdown();
  });

  it('should buffer events and flush on threshold', async () => {
    const flushSpy = jest.fn().mockResolvedValue(undefined);
    collector.onFlush(flushSpy);

    for (let i = 0; i < 5; i++) {
      collector.add({
        id: `evt_${i}`,
        name: 'test',
        category: EventCategory.USER_ACTION,
        source: 'test',
        timestamp: new Date(),
        payload: {},
      });
    }

    expect(collector.bufferSize()).toBe(0);
    expect(flushSpy).toHaveBeenCalledTimes(1);
  });

  it('should collect buffered events', async () => {
    collector.add({
      id: 'evt_1', name: 'test', category: EventCategory.USER_ACTION,
      source: 'test', timestamp: new Date(), payload: {},
    });
    collector.add({
      id: 'evt_2', name: 'test2', category: EventCategory.SYSTEM_EVENT,
      source: 'test', timestamp: new Date(), payload: {},
    });

    const events = await collector.collect();
    expect(events).toHaveLength(2);
    expect(collector.bufferSize()).toBe(0);
  });

  it('should flush remaining on shutdown', async () => {
    const flushSpy = jest.fn().mockResolvedValue(undefined);
    collector.onFlush(flushSpy);

    collector.add({
      id: 'evt_1', name: 'test', category: EventCategory.USER_ACTION,
      source: 'test', timestamp: new Date(), payload: {},
    });

    await collector.shutdown();
    expect(flushSpy).toHaveBeenCalled();
  });

  it('should handle batch adds', () => {
    const events = [
      { id: '1', name: 'a', category: EventCategory.USER_ACTION, source: 't', timestamp: new Date(), payload: {} },
      { id: '2', name: 'b', category: EventCategory.USER_ACTION, source: 't', timestamp: new Date(), payload: {} },
    ];

    collector.addBatch(events);
    expect(collector.bufferSize()).toBe(2);
  });
});

describe('CollectorRegistry', () => {
  it('should register and retrieve providers', () => {
    const registry = new CollectorRegistry();
    const collector = new ApiCollector();

    registry.register(collector);
    expect(registry.get('api-collector')).toBe(collector);
  });

  it('should prevent duplicate registration', () => {
    const registry = new CollectorRegistry();
    registry.register(new ApiCollector());

    expect(() => registry.register(new ApiCollector())).toThrow('already registered');
  });

  it('should unregister providers', () => {
    const registry = new CollectorRegistry();
    registry.register(new ApiCollector());
    expect(registry.unregister('api-collector')).toBe(true);
    expect(registry.get('api-collector')).toBeUndefined();
  });
});
