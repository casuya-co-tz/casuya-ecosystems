import { AggregationType } from '../../../interfaces';
import { AnalyticsEvent } from '../../../interfaces';
import { PipelineContext, PipelineStage } from '../../../interfaces';

export interface AggregateStageConfig {
  metricName: string;
  field: string;
  type: AggregationType;
}

export class AggregateStage implements PipelineStage {
  readonly name: string;
  private buffer: AnalyticsEvent[] = [];
  private aggregateValues: number[] = [];

  constructor(
    name: string,
    private config: AggregateStageConfig,
    private onAggregate?: (result: number) => void,
    private batchSize: number = 100,
  ) {
    this.name = name;
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    this.buffer.push(context.event);

    const value = this.extractNumericValue(context.event, this.config.field);
    if (value !== null) {
      this.aggregateValues.push(value);
    }

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }

    return {
      ...context,
      state: {
        ...context.state,
        [`${this.name}_buffered`]: this.buffer.length,
      },
    };
  }

  canHandle(_event: AnalyticsEvent): boolean {
    return true;
  }

  getBufferSize(): number {
    return this.buffer.length;
  }

  async flush(): Promise<void> {
    if (this.aggregateValues.length === 0) return;

    let result = 0;
    const values = this.aggregateValues;

    switch (this.config.type) {
      case AggregationType.SUM:
        result = values.reduce((a, b) => a + b, 0);
        break;
      case AggregationType.AVG:
        result = values.reduce((a, b) => a + b, 0) / values.length;
        break;
      case AggregationType.MIN:
        result = Math.min(...values);
        break;
      case AggregationType.MAX:
        result = Math.max(...values);
        break;
      case AggregationType.COUNT:
        result = values.length;
        break;
    }

    this.onAggregate?.(result);
    this.buffer = [];
    this.aggregateValues = [];
  }

  private extractNumericValue(event: AnalyticsEvent, fieldPath: string): number | null {
    const parts = fieldPath.split('.');
    let value: unknown = event.payload;

    for (const part of parts) {
      if (value == null || typeof value !== 'object') return null;
      value = (value as Record<string, unknown>)[part];
    }

    return typeof value === 'number' ? value : null;
  }
}
