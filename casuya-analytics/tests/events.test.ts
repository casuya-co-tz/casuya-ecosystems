import { EventBus, globalEventBus } from '../src/events/event-bus';
import { EventCategory } from '../src/interfaces';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  it('should emit and receive events', async () => {
    const handler = jest.fn();
    bus.on('test.event', handler);

    await bus.emit('test.event', makeEvent());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support once handlers', async () => {
    const handler = jest.fn();
    bus.once('test.event', handler);

    await bus.emit('test.event', makeEvent());
    await bus.emit('test.event', makeEvent());
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should support wildcard handlers', async () => {
    const handler = jest.fn();
    bus.onAny(handler);

    await bus.emit('event1', makeEvent());
    await bus.emit('event2', makeEvent());
    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('should filter events', async () => {
    const handler = jest.fn();
    bus.on('test.event', handler, (e) => e.source === 'app');

    await bus.emit('test.event', { ...makeEvent(), source: 'app' });
    await bus.emit('test.event', { ...makeEvent(), source: 'web' });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return unsubscribe function', async () => {
    const handler = jest.fn();
    const unsubscribe = bus.on('test.event', handler);

    unsubscribe();
    await bus.emit('test.event', makeEvent());
    expect(handler).not.toHaveBeenCalled();
  });

  it('should remove all handlers', async () => {
    bus.on('a', jest.fn());
    bus.on('a', jest.fn());
    bus.on('b', jest.fn());

    bus.removeAll('a');
    expect(bus.listenerCount('a')).toBe(0);
    expect(bus.listenerCount('b')).toBe(1);
  });

  it('should handle handler errors gracefully', async () => {
    const errorHandler = jest.fn().mockRejectedValue(new Error('fail'));
    const goodHandler = jest.fn();

    bus.on('test.event', errorHandler);
    bus.on('test.event', goodHandler);

    await bus.emit('test.event', makeEvent());
    expect(goodHandler).toHaveBeenCalled();
  });

  it('globalEventBus should be defined', () => {
    expect(globalEventBus).toBeInstanceOf(EventBus);
  });
});

function makeEvent() {
  return {
    id: `evt_${Date.now()}`,
    name: 'test',
    category: EventCategory.USER_ACTION,
    source: 'test',
    timestamp: new Date(),
    payload: {},
  };
}
