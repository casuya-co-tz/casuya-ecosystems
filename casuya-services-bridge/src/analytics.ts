import {
  AggregationEngineImpl,
  EventBus,
  InMemoryMetricProvider,
  MetricRegistry,
  PredictionEngine,
  ExportEngine,
  CsvExportProvider,
  JsonExportProvider,
  InMemoryCacheProvider,
  RetentionEngine,
  CacheStrategy,
  ReportBuilder,
  QueryBuilder,
} from '@casuya/analytics';

let aggregation: AggregationEngineImpl;
let eventBus: EventBus;
let metrics: MetricRegistry;
let predictions: PredictionEngine;
let exporter: ExportEngine;
let cache: InMemoryCacheProvider;
let retention: RetentionEngine;

export async function initAnalytics() {
  aggregation = new AggregationEngineImpl();
  await aggregation.initialize();
  eventBus = new EventBus();
  metrics = new MetricRegistry();
  metrics.register(new InMemoryMetricProvider());
  predictions = new PredictionEngine();
  exporter = new ExportEngine();
  exporter.register(new CsvExportProvider());
  exporter.register(new JsonExportProvider());
  cache = new InMemoryCacheProvider();
  await cache.configure({ max_size: 1000, ttl_seconds: 300, strategy: CacheStrategy.LRU });
  retention = new RetentionEngine();
}

export const analyticsOps = {
  ingest(body: Record<string, unknown>) {
    aggregation.ingest(body.metric as string, body.value as unknown as Parameters<typeof aggregation.ingest>[1]);
    return { ok: true };
  },
  async aggregate(body: Record<string, unknown>) {
    return aggregation.aggregate(body.metric as string, body.config as Parameters<typeof aggregation.aggregate>[1], body.range as Parameters<typeof aggregation.aggregate>[2]);
  },
  async emit(body: Record<string, unknown>) {
    await eventBus.emit(body.event as string, body.data as Parameters<typeof eventBus.emit>[1]);
    return { ok: true };
  },
  async recordMetric(body: Record<string, unknown>) {
    await metrics.recordToAll(body.value as Parameters<typeof metrics.recordToAll>[0]);
    return { ok: true };
  },
  async queryMetric(body: Record<string, unknown>) {
    const provider = metrics.get(body.name as string);
    if (!provider) throw new Error(`No metric provider named ${body.name}`);
    return provider.query(body.name as string, (body.tags as Record<string, string>) || {}, new Date(body.start as string | number), new Date(body.end as string | number));
  },
  async predict(body: Record<string, unknown>) {
    return predictions.predictFromAll(body.metric as string, (body.horizon as string) || '7d', body.range as Parameters<typeof predictions.predictFromAll>[2]);
  },
  async exportData(body: Record<string, unknown>) {
    return exporter.export(body.data as unknown as Parameters<typeof exporter.export>[0], ((body.format as string) || 'json') as Parameters<typeof exporter.export>[1]);
  },
  async cacheGet(key: string) {
    return cache.get(key);
  },
  async cacheSet(body: Record<string, unknown>) {
    await cache.set(body.key as string, body.value as Parameters<typeof cache.set>[1], body.ttl as number | undefined);
    return { ok: true };
  },
  async retentionAddRule(body: Record<string, unknown>) {
    await retention.addRule(body as unknown as Parameters<typeof retention.addRule>[0]);
    return { ok: true };
  },
  async retentionEvaluate() {
    return retention.evaluate();
  },
  buildReport(body: Record<string, unknown>) {
    const b = new ReportBuilder();
    if (body.name) b.setName(body.name as string);
    if (body.description) b.setDescription(body.description as string);
    if (body.metrics) for (const m of body.metrics as string[]) b.addMetric(m);
    if (body.filters) for (const f of body.filters as unknown as string[]) b.addFilter(f as unknown as Parameters<typeof b.addFilter>[0]);
    if (body.groupBy) for (const g of body.groupBy as string[]) b.addGroupBy(g);
    if (body.timeRange || body.time_range) b.setTimeRange((body.timeRange || body.time_range) as Parameters<typeof b.setTimeRange>[0]);
    if (body.format) b.setFormat(body.format as Parameters<typeof b.setFormat>[0]);
    if (body.schedule) b.setSchedule(body.schedule as Parameters<typeof b.setSchedule>[0]);
    return b.build();
  },
  buildQuery(body: Record<string, unknown>) {
    const q = new QueryBuilder();
    if (body.metrics) for (const m of body.metrics as string[]) q.addMetric(m);
    if (body.filters) for (const f of body.filters as unknown as string[]) q.addFilter(f as unknown as Parameters<typeof q.addFilter>[0]);
    if (body.groupBy) for (const g of body.groupBy as string[]) q.addGroupBy(g);
    if (body.timeRange || body.time_range) q.setTimeRange((body.timeRange || body.time_range) as Parameters<typeof q.setTimeRange>[0]);
    if (body.limit != null) q.setLimit(body.limit as number);
    if (body.offset != null) q.setOffset(body.offset as number);
    return q.build();
  },
  async stats() {
    const cacheStats = await cache.getStats();
    return {
      cache: cacheStats,
      providers: {
        metrics: metrics.getAll().map((p) => p.name),
        predictions: predictions.getAll().map((p) => p.name),
        exports: exporter.getAll().map((p) => p.name),
      },
    };
  },
};
