import { AnalyticsEvent } from './types';

export interface PipelineContext {
  event: AnalyticsEvent;
  state: Record<string, unknown>;
  errors: Error[];
}

export interface PipelineStage {
  readonly name: string;
  process(context: PipelineContext): Promise<PipelineContext>;
  canHandle(event: AnalyticsEvent): boolean;
}
