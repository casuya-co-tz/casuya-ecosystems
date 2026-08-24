import { AnalyticsEvent } from '../interfaces';

export type EventHandler = (event: AnalyticsEvent) => void | Promise<void>;
export type EventFilter = (event: AnalyticsEvent) => boolean;

interface Subscription {
  handler: EventHandler;
  filter?: EventFilter;
  once: boolean;
}

export class EventBus {
  private subscriptions: Map<string, Subscription[]> = new Map();
  private wildcardSubscriptions: Subscription[] = [];

  on(eventName: string, handler: EventHandler, filter?: EventFilter): () => void {
    return this.subscribe(eventName, handler, false, filter);
  }

  once(eventName: string, handler: EventHandler, filter?: EventFilter): () => void {
    return this.subscribe(eventName, handler, true, filter);
  }

  onAny(handler: EventHandler, filter?: EventFilter): () => void {
    this.wildcardSubscriptions.push({ handler, filter, once: false });
    return () => {
      this.wildcardSubscriptions = this.wildcardSubscriptions.filter(s => s.handler !== handler);
    };
  }

  async emit(eventName: string, event: AnalyticsEvent): Promise<void> {
    const handlers = this.subscriptions.get(eventName) ?? [];
    const allHandlers = [...handlers, ...this.wildcardSubscriptions];
    const toRemove: Subscription[] = [];

    for (const sub of allHandlers) {
      if (sub.filter && !sub.filter(event)) continue;
      try {
        await sub.handler(event);
      } catch (err) {
        console.error(`[EventBus] Error in handler for '${eventName}':`, err);
      }
      if (sub.once) toRemove.push(sub);
    }

    if (toRemove.length > 0) {
      const remaining = handlers.filter(s => !toRemove.includes(s));
      if (remaining.length > 0) {
        this.subscriptions.set(eventName, remaining);
      } else {
        this.subscriptions.delete(eventName);
      }
    }
  }

  removeAll(eventName?: string): void {
    if (eventName) {
      this.subscriptions.delete(eventName);
    } else {
      this.subscriptions.clear();
      this.wildcardSubscriptions = [];
    }
  }

  listenerCount(eventName: string): number {
    return (this.subscriptions.get(eventName) ?? []).length;
  }

  private subscribe(
    eventName: string,
    handler: EventHandler,
    once: boolean,
    filter?: EventFilter,
  ): () => void {
    if (!this.subscriptions.has(eventName)) {
      this.subscriptions.set(eventName, []);
    }
    this.subscriptions.get(eventName)!.push({ handler, filter, once });
    return () => {
      const subs = this.subscriptions.get(eventName);
      if (!subs) return;
      const remaining = subs.filter(s => s.handler !== handler);
      if (remaining.length > 0) {
        this.subscriptions.set(eventName, remaining);
      } else {
        this.subscriptions.delete(eventName);
      }
    };
  }
}

export const globalEventBus = new EventBus();
