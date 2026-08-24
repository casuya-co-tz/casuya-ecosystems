# @casuya/analytics

**Intelligence Office — Educational Data Observatory.**

Part of the Casuya Phase 3 Platform Services. Collects and analyzes educational activity across the ecosystem.

## Architecture

```
src/
├── errors/        — Typed error hierarchy (AnalyticsError, ValidationError, etc.)
├── events/        — Pub/sub event bus with wildcards, filters, and once handlers
├── interfaces/    — TypeScript types, enums, and provider contracts
├── collectors/    — Pluggable event collectors
│   ├── api-collector    — HTTP request body → AnalyticsEvent with validation
│   ├── batch-collector  — Buffer-flush collector with callbacks
│   └── registry         — Provider registry for collector discovery
├── metrics/       — Metric recording and querying
│   ├── in-memory-metric — In-memory time-series store (100K+ entries)
│   └── registry         — Multi-provider fan-out
├── aggregations/  — Time-bucketed aggregation engine
│   └── engine           — Sum, avg, min, max, count, p50/p90/p95/p99, unique, rollup
├── pipelines/     — Composable event processing pipelines
│   ├── engine           — Pipeline execution with error handling
│   ├── filter-stage     — Event filter by predicate
│   ├── transform-stage  — Event transformation
│   ├── enrich-stage     — Geo, user-agent, timestamp enrichment
│   ├── aggregate-stage  — Buffered aggregation with flush
│   └── sink-stage       — Async sinks with batching
├── predictions/   — Forecasting and anomaly detection
│   ├── trend-analysis   — Linear regression with R² evaluation
│   ├── moving-average   — Windowed MA forecast
│   └── anomaly-detector — Z-score based anomaly detection
├── exports/       — Data serialization providers
│   ├── csv-export       — RFC-compliant CSV with escaping
│   └── json-export      — JSON with pretty-print and date options
├── reporting-api/ — Report definitions and query building
│   ├── builder          — Fluent ReportDefinition builder
│   └── query            — Fluent Query builder
├── retention/     — Data lifecycle management
│   └── engine           — Rule-based TTL evaluation with dry-run
├── caching/       — Pluggable caching
│   ├── in-memory        — LRU/FIFO eviction, TTL, hit-rate stats
│   └── registry         — Multi-provider cache registry
└── utilities/     — Event/metric validation, time bucketing, tag sanitization
```

## Provider Pattern

Every module follows a provider-based architecture for extensibility:

```typescript
import {
  CollectorRegistry, ApiCollector, BatchCollector,
  MetricRegistry, InMemoryMetricProvider,
  PredictionEngine, TrendAnalysisProvider,
  ExportEngine, CsvExportProvider,
  CacheRegistry, InMemoryCacheProvider,
  RetentionEngine, PipelineEngine,
  EventBus,
} from '@casuya/analytics';
```

## Quick Start

```typescript
const cache = new InMemoryCacheProvider();
await cache.configure({ strategy: CacheStrategy.LRU, max_size: 10000 });
await cache.set('key', { data: 'value' });
const val = await cache.get('key');

const pipeline = new PipelineEngine();
pipeline.registerStage(new FilterStage('only_prod', e => e.source === 'prod'));
pipeline.registerPipeline({
  id: 'prod-pipe', name: 'Production Events',
  stages: [{ name: 'only_prod', type: 'filter', config: {} }],
});
```

## Phase 3 Compliance

- [x] Shared service — not feature-specific
- [x] Provider-based — all modules are pluggable
- [x] Replaceable — providers swap without rewrites
- [x] API-first — only interfaces exposed
- [x] Scalable — designed for millions of events
- [x] Extensible — add collectors, metrics, predictions, exports, caches

## Test

```bash
npm test          # Run all tests
npm run coverage  # With coverage report
```
