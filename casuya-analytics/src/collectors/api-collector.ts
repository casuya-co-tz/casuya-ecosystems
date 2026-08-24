import { AnalyticsEvent, EventCategory } from '../interfaces';
import { BaseCollector } from './base-collector';
import { ValidationError } from '../errors';
import { generateEventId } from '../utilities';
import { CollectorConfig } from '../interfaces';

export interface ApiCollectorOptions {
  acceptKeys?: string[];
  maxPayloadSize?: number;
  allowedSources?: string[];
  requiredFields?: string[];
}

export class ApiCollector extends BaseCollector {
  readonly name = 'api-collector';
  private options: ApiCollectorOptions = {};

  async initialize(config: CollectorConfig): Promise<void> {
    await super.initialize(config);
    this.options = {
      acceptKeys: config.options?.acceptKeys as string[] ?? [],
      maxPayloadSize: config.options?.maxPayloadSize as number ?? 1024 * 100,
      allowedSources: config.options?.allowedSources as string[] ?? [],
      requiredFields: config.options?.requiredFields as string[] ?? ['name', 'category'],
    };
  }

  async collectFromRequest(body: Record<string, unknown>): Promise<AnalyticsEvent> {
    const event = this.buildEvent(body);
    this.validateEvent(event);
    return event;
  }

  async collectFromBatch(batch: Record<string, unknown>[]): Promise<AnalyticsEvent[]> {
    return batch.map(body => {
      const event = this.buildEvent(body);
      this.validateEvent(event);
      return event;
    });
  }

  async collect(): Promise<AnalyticsEvent[]> {
    return [];
  }

  private buildEvent(body: Record<string, unknown>): AnalyticsEvent {
    return {
      id: (body.id as string) ?? generateEventId(),
      category: this.parseCategory(body.category),
      name: body.name as string,
      source: (body.source as string) ?? 'api',
      timestamp: body.timestamp
        ? new Date(body.timestamp as string)
        : new Date(),
      payload: (body.payload as Record<string, unknown>) ?? {},
      user_id: body.user_id as string | undefined,
      school_id: body.school_id as string | undefined,
      session_id: body.session_id as string | undefined,
      correlation_id: body.correlation_id as string | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
    };
  }

  private validateEvent(event: AnalyticsEvent): void {
    const errors: string[] = [];

    if (!event.name) errors.push('Event name is required');
    if (!event.category) errors.push('Event category is required');

    if (this.options.allowedSources && !this.options.allowedSources.includes(event.source)) {
      errors.push(`Source '${event.source}' is not allowed`);
    }

    const payloadSize = JSON.stringify(event.payload).length;
    if (payloadSize > (this.options.maxPayloadSize ?? 102400)) {
      errors.push(`Payload exceeds maximum size of ${this.options.maxPayloadSize} bytes`);
    }

    if (errors.length > 0) {
      throw new ValidationError('Event validation failed', { errors, event });
    }
  }

  private parseCategory(value: unknown): EventCategory {
    if (typeof value === 'string' && Object.values(EventCategory).includes(value as EventCategory)) {
      return value as EventCategory;
    }
    return EventCategory.CUSTOM;
  }
}
