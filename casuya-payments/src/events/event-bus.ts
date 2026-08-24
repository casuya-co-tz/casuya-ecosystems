import { Event, EventBus } from '../interfaces';

export class EventBusImpl implements EventBus {
  private subscribers: Map<string, Array<(event: Event) => void>> = new Map();
  private events: Event[] = [];
  private static readonly MAX_EVENTS = 10000;

  subscribe(eventType: string, handler: (event: Event) => void): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType)?.push(handler);
  }

  unsubscribe(eventType: string, handler: (event: Event) => void): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  publish(event: Event): void {
    this.events.push(event);
    if (this.events.length > EventBusImpl.MAX_EVENTS) {
      this.events = this.events.slice(this.events.length - EventBusImpl.MAX_EVENTS);
    }

    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${event.type}:`, error);
        }
      });
    }
  }

  getEvents(eventType?: string): Event[] {
    if (eventType) {
      return this.events.filter(event => event.type === eventType);
    }
    return [...this.events];
  }
}
