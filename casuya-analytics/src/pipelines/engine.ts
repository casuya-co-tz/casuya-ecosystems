import { AnalyticsEvent, PipelineConfig, PipelineContext, PipelineStage } from '../interfaces';

export class PipelineEngine {
  private stages: Map<string, PipelineStage> = new Map();
  private pipelines: Map<string, PipelineConfig> = new Map();

  registerStage(stage: PipelineStage): void {
    if (this.stages.has(stage.name)) {
      throw new Error(`Pipeline stage '${stage.name}' is already registered`);
    }
    this.stages.set(stage.name, stage);
  }

  unregisterStage(name: string): boolean {
    return this.stages.delete(name);
  }

  getStage(name: string): PipelineStage | undefined {
    return this.stages.get(name);
  }

  registerPipeline(config: PipelineConfig): void {
    if (this.pipelines.has(config.id)) {
      throw new Error(`Pipeline '${config.id}' is already registered`);
    }
    this.pipelines.set(config.id, config);
  }

  unregisterPipeline(id: string): boolean {
    return this.pipelines.delete(id);
  }

  getPipeline(id: string): PipelineConfig | undefined {
    return this.pipelines.get(id);
  }

  async execute(pipelineId: string, event: AnalyticsEvent): Promise<PipelineContext> {
    const config = this.pipelines.get(pipelineId);
    if (!config) {
      throw new Error(`Pipeline '${pipelineId}' not found`);
    }

    let context: PipelineContext = {
      event,
      state: {},
      errors: [],
    };

    for (const stageConfig of config.stages) {
      const stage = this.stages.get(stageConfig.name);
      if (!stage) {
        throw new Error(`Stage '${stageConfig.name}' not found in pipeline '${pipelineId}'`);
      }

      if (!stage.canHandle(event)) {
        continue;
      }

      try {
        context = await stage.process(context);
      } catch (error) {
        context.errors.push(error as Error);
        if (config.error_handler === 'fail') {
          throw error;
        }
      }
    }

    return context;
  }

  async executeAll(event: AnalyticsEvent): Promise<Map<string, PipelineContext>> {
    const results = new Map<string, PipelineContext>();
    for (const [id] of this.pipelines) {
      try {
        results.set(id, await this.execute(id, event));
      } catch (error) {
        results.set(id, { event, state: {}, errors: [error as Error] });
      }
    }
    return results;
  }
}
