import { AnalyticsEvent } from '../../interfaces';
import { PipelineContext, PipelineStage } from '../../interfaces';

export class FilterStage implements PipelineStage {
  readonly name: string;

  constructor(
    name: string,
    private filterFn: (event: AnalyticsEvent) => boolean,
  ) {
    this.name = name;
  }

  async process(context: PipelineContext): Promise<PipelineContext> {
    return context;
  }

  canHandle(event: AnalyticsEvent): boolean {
    return this.filterFn(event);
  }
}
