import { PipelineEngine } from '../src/pipelines/engine';
import { FilterStage } from '../src/pipelines/stages/filter-stage';
import { TransformStage } from '../src/pipelines/stages/transform-stage';
import { EnrichStage, createTimestampEnrichment } from '../src/pipelines/stages/internal/enrich-stage';
import { SinkStage } from '../src/pipelines/stages/internal/sink-stage';
import { AggregateStage } from '../src/pipelines/stages/internal/aggregate-stage';
import { AnalyticsEvent, EventCategory, AggregationType } from '../src/interfaces';

function makeEvent(name: string, category: EventCategory = EventCategory.USER_ACTION, extra: any = {}): AnalyticsEvent {
  return {
    id: `evt_${Date.now()}_${Math.random()}`,
    name,
    category,
    source: 'test',
    timestamp: new Date(),
    payload: {},
    ...extra,
  };
}

describe('PipelineEngine', () => {
  let engine: PipelineEngine;

  beforeEach(() => {
    engine = new PipelineEngine();
  });

  it('should register and execute a pipeline', async () => {
    engine.registerStage(new FilterStage('keep_all', () => true));
    engine.registerPipeline({
      id: 'test-pipeline',
      name: 'Test Pipeline',
      stages: [{ name: 'keep_all', type: 'filter', config: {} }],
    });

    const result = await engine.execute('test-pipeline', makeEvent('test'));
    expect(result.errors).toHaveLength(0);
  });

  it('should apply transform stage', async () => {
    engine.registerStage(new TransformStage('uppercase', (event) => ({
      ...event,
      name: event.name.toUpperCase(),
    })));

    engine.registerPipeline({
      id: 'transform-pipe',
      name: 'Transform',
      stages: [{ name: 'uppercase', type: 'transform', config: {} }],
    });

    const event = makeEvent('hello');
    const result = await engine.execute('transform-pipe', event);
    expect(result.event.name).toBe('HELLO');
  });

  it('should filter events with filter stage', async () => {
    engine.registerStage(new FilterStage('only_user', (e) => e.category === EventCategory.USER_ACTION));

    engine.registerPipeline({
      id: 'filter-pipe',
      name: 'Filter',
      stages: [{ name: 'only_user', type: 'filter', config: {} }],
    });

    const result1 = await engine.execute('filter-pipe', makeEvent('test', EventCategory.USER_ACTION));
    expect(result1.errors).toHaveLength(0);

    const result2 = await engine.execute('filter-pipe', makeEvent('test', EventCategory.SYSTEM_EVENT));
    expect(result2.errors).toHaveLength(0);
    expect(result2.state).toBeDefined();
  });

  it('should enrich events', async () => {
    engine.registerStage(new EnrichStage('add_timestamp', [createTimestampEnrichment()]));

    engine.registerPipeline({
      id: 'enrich-pipe',
      name: 'Enrich',
      stages: [{ name: 'add_timestamp', type: 'enrich', config: {} }],
    });

    const result = await engine.execute('enrich-pipe', makeEvent('test'));
    expect(result.event.payload.enriched_at).toBeDefined();
    expect(result.event.payload.processing_timestamp).toBeDefined();
  });

  it('should handle errors with fail handler', async () => {
    engine.registerStage(new TransformStage('error_stage', () => {
      throw new Error('Stage failed');
    }));

    engine.registerPipeline({
      id: 'error-pipe',
      name: 'Error',
      stages: [{ name: 'error_stage', type: 'transform', config: {} }],
      error_handler: 'fail',
    });

    await expect(engine.execute('error-pipe', makeEvent('test'))).rejects.toThrow('Stage failed');
  });

  it('should sink events', async () => {
    const sinkFn = jest.fn().mockResolvedValue(undefined);
    engine.registerStage(new SinkStage('test_sink', sinkFn));

    engine.registerPipeline({
      id: 'sink-pipe',
      name: 'Sink',
      stages: [{ name: 'test_sink', type: 'sink', config: {} }],
    });

    const event = makeEvent('sink_test');
    await engine.execute('sink-pipe', event);
    expect(sinkFn).toHaveBeenCalledWith(event);
  });

  it('should aggregate events in batches', async () => {
    const aggregateFn = jest.fn();
    const stage = new AggregateStage('sum_stage', {
      metricName: 'test', field: 'value', type: AggregationType.SUM,
    }, aggregateFn, 5);

    engine.registerStage(stage);
    engine.registerPipeline({
      id: 'aggregate-pipe',
      name: 'Aggregate',
      stages: [{ name: 'sum_stage', type: 'aggregate', config: {} }],
    });

    for (let i = 0; i < 5; i++) {
      await engine.execute('aggregate-pipe', {
        ...makeEvent('agg_test'),
        payload: { value: i * 10 },
      });
    }

    expect(aggregateFn).toHaveBeenCalledWith(100);
  });

  it('should execute all pipelines for an event', async () => {
    engine.registerStage(new FilterStage('pass', () => true));

    engine.registerPipeline({
      id: 'pipe1', name: 'P1',
      stages: [{ name: 'pass', type: 'filter', config: {} }],
    });
    engine.registerPipeline({
      id: 'pipe2', name: 'P2',
      stages: [{ name: 'pass', type: 'filter', config: {} }],
    });

    const results = await engine.executeAll(makeEvent('multi'));
    expect(results.size).toBe(2);
    expect(results.get('pipe1')).toBeDefined();
    expect(results.get('pipe2')).toBeDefined();
  });

  it('should throw for unknown pipeline', async () => {
    await expect(engine.execute('nonexistent', makeEvent('test')))
      .rejects.toThrow('not found');
  });
});
