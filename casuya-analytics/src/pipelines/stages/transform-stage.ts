import { AnalyticsEvent } from '../../interfaces';
import { PipelineContext, PipelineStage } from '../../interfaces';

export class TransformStage implements PipelineStage {
  readonly name: string;

  constructor(
    name: string,
    private transformFn: (event: AnalyticsEvent) => AnalyticsEvent,
  ) {
    this.name = name;
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    return {
      ...context,
      event: this.transformFn(context.event),
    };
  }

  canHandle(_event: AnalyticsEvent): boolean {
    return true;
  }
}
