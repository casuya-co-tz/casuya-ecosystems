import { EventBusImpl } from '../src/events/event-bus';
import { Event } from '../src/interfaces';

function makeEvent(type: string): Event {
  return { id: `evt_${Date.now()}`, type, payload: {}, timestamp: new Date(), source: 'test' };
}

describe('EventBusImpl', () => {
  let bus: EventBusImpl;

  beforeEach(() => {
    bus = new EventBusImpl();
  });

  it('should subscribe and receive events', () => {
    const handler = jest.fn();
    bus.subscribe('TEST_EVENT', handler);
    const event = makeEvent('TEST_EVENT');
    bus.publish(event);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not call handler for different event types', () => {
    const handler = jest.fn();
    bus.subscribe('OTHER_EVENT', handler);
    bus.publish(makeEvent('TEST_EVENT'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('should support multiple subscribers for the same event type', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    bus.subscribe('TEST_EVENT', handler1);
    bus.subscribe('TEST_EVENT', handler2);
    const event = makeEvent('TEST_EVENT');
    bus.publish(event);
    expect(handler1).toHaveBeenCalledWith(event);
    expect(handler2).toHaveBeenCalledWith(event);
  });

  it('should unsubscribe handlers', () => {
    const handler = jest.fn();
    bus.subscribe('TEST_EVENT', handler);
    bus.unsubscribe('TEST_EVENT', handler);
    bus.publish(makeEvent('TEST_EVENT'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle unsubscribe for non-existent event type gracefully', () => {
    const handler = jest.fn();
    expect(() => bus.unsubscribe('NONEXISTENT', handler)).not.toThrow();
  });

  it('should handle unsubscribe of handler that was never subscribed', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    bus.subscribe('TEST_EVENT', handler1);
    expect(() => bus.unsubscribe('TEST_EVENT', handler2)).not.toThrow();
    bus.publish(makeEvent('TEST_EVENT'));
    expect(handler1).toHaveBeenCalled();
  });

  it('should store events and return them via getEvents', () => {
    const e1 = makeEvent('A');
    const e2 = makeEvent('B');
    bus.publish(e1);
    bus.publish(e2);
    expect(bus.getEvents()).toHaveLength(2);
  });

  it('should filter events by type in getEvents', () => {
    bus.publish(makeEvent('A'));
    bus.publish(makeEvent('B'));
    bus.publish(makeEvent('A'));
    expect(bus.getEvents('A')).toHaveLength(2);
    expect(bus.getEvents('B')).toHaveLength(1);
  });

  it('should return empty array for getEvents with unknown type', () => {
    bus.publish(makeEvent('A'));
    expect(bus.getEvents('UNKNOWN')).toHaveLength(0);
  });

  it('should handle errors in handlers without crashing', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const badHandler = () => { throw new Error('boom'); };
    const goodHandler = jest.fn();
    bus.subscribe('TEST_EVENT', badHandler);
    bus.subscribe('TEST_EVENT', goodHandler);
    bus.publish(makeEvent('TEST_EVENT'));
    expect(goodHandler).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should return a copy of events array, not a reference', () => {
    bus.publish(makeEvent('A'));
    const events = bus.getEvents();
    events.push(makeEvent('B'));
    expect(bus.getEvents()).toHaveLength(1);
  });
});
