import { AnalyticsEvent } from '../../../interfaces';
import { PipelineContext, PipelineStage } from '../../../interfaces';

export type SinkFunction = (event: AnalyticsEvent) => Promise<void>;

export class SinkStage implements PipelineStage {
  readonly name: string;

  constructor(
    name: string,
    private sinkFn: SinkFunction,
    private batchSize: number = 1,
    private onError?: (event: AnalyticsEvent, error: Error) => void,
  ) {
    this.name = name;
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    try {
      await this.sinkFn(context.event);
    } catch (error) {
      this.onError?.(context.event, error as Error);
      throw error;
    }

    return context;
  }

  canHandle(_event: AnalyticsEvent): boolean {
    return true;
  }
}

export function createConsoleSink(): SinkFunction {
  return async (event: AnalyticsEvent) => {
    console.log(`[Analytics] Event: ${event.name} [${event.category}]`);
  };
}

export function createMetricSink(recordFn: (event: AnalyticsEvent) => Promise<void>): SinkFunction {
  return async (event: AnalyticsEvent) => {
    await recordFn(event);
  };
}

export function createBatchSink(
  processBatch: (events: AnalyticsEvent[]) => Promise<void>,
  bufferSize: number = 100,
): { sink: SinkFunction; flush: () => Promise<void> } {
  const buffer: AnalyticsEvent[] = [];

  const sink: SinkFunction = async (event: AnalyticsEvent) => {
    buffer.push(event);
    if (buffer.length >= bufferSize) {
      const batch = buffer.splice(0, bufferSize);
      await processBatch(batch);
    }
  };

  const flush = async () => {
    if (buffer.length > 0) {
      const batch = buffer.splice(0);
      await processBatch(batch);
    }
  };

  return { sink, flush };
}
