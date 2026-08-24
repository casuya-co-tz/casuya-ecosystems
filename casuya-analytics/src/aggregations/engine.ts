import {
  AggregationConfig,
  AggregationEngine,
  AggregationResult,
  AggregationType,
  MetricValue,
  TimeRange,
} from '../interfaces';

interface DataPoint {
  value: number;
  timestamp: Date;
  tags: Record<string, string>;
}

export class AggregationEngineImpl implements AggregationEngine {
  readonly name = 'default-aggregation-engine';
  private store: Map<string, DataPoint[]> = new Map();
  private initialized = false;

  async initialize(): Promise<void> {
    this.initialized = true;
  }

  ingest(metric: string, value: MetricValue): void {
    if (!this.store.has(metric)) {
      this.store.set(metric, []);
    }
    this.store.get(metric)!.push({
      value: value.value,
      timestamp: value.timestamp,
      tags: value.tags,
    });
  }

  async aggregate(metric: string, config: AggregationConfig, range: TimeRange): Promise<AggregationResult[]> {
    this.ensureInitialized();
    const points = this.getPointsInRange(metric, range);
    if (points.length === 0) return [];

    const bucketed = this.bucketByTime(points, config.time_bucket);
    const results: AggregationResult[] = [];

    for (const [bucket, bucketPoints] of bucketed) {
      const groups = this.groupBy(bucketPoints, config.group_by);

      for (const [groupKey, groupPoints] of groups) {
        const values = groupPoints.map(p => p.value);
        const result = this.computeAggregation(config.type, config.field, values);

        results.push({
          id: `agg_${metric}_${bucket}_${Date.now()}`,
          type: config.type,
          field: config.field,
          value: result,
          group_by: this.parseGroupKey(groupKey, config.group_by),
          time_bucket: bucket,
          start_time: range.start,
          end_time: range.end,
        });
      }
    }

    return results;
  }

  async rollup(source: string, destination: string, config: AggregationConfig): Promise<void> {
    this.ensureInitialized();
    const sourceData = this.store.get(source);
    if (!sourceData || sourceData.length === 0) return;

    const allData = this.store.get(destination) ?? [];
    const aggregated = this.rollupData(sourceData, config);

    allData.push(...aggregated);
    this.store.set(destination, allData);
  }

  async shutdown(): Promise<void> {
    this.store.clear();
    this.initialized = false;
  }

  private ensureInitialized(): void {
    if (!this.initialized) throw new Error('AggregationEngine not initialized');
  }

  private getPointsInRange(metric: string, range: TimeRange): DataPoint[] {
    const points = this.store.get(metric) ?? [];
    return points.filter(
      p => p.timestamp >= range.start && p.timestamp <= range.end,
    );
  }

  private bucketByTime(points: DataPoint[], granularity: string): Map<string, DataPoint[]> {
    const buckets = new Map<string, DataPoint[]>();
    for (const point of points) {
      const key = this.timeBucketKey(point.timestamp, granularity);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(point);
    }
    return buckets;
  }

  private timeBucketKey(timestamp: Date, granularity: string): string {
    const d = new Date(timestamp);
    const Y = d.getUTCFullYear();
    const M = pad(d.getUTCMonth() + 1);
    const D = pad(d.getUTCDate());
    const h = pad(d.getUTCHours());
    const m = pad(d.getUTCMinutes());

    switch (granularity) {
      case 'minute': return `${Y}-${M}-${D}T${h}:${m}`;
      case 'hour':   return `${Y}-${M}-${D}T${h}:00`;
      case 'day':    return `${Y}-${M}-${D}`;
      case 'week':   return `${Y}-W${weekNumber(d)}`;
      case 'month':  return `${Y}-${M}`;
      case 'quarter':return `${Y}-Q${Math.ceil((d.getUTCMonth() + 1) / 3)}`;
      case 'year':   return `${Y}`;
      default:       return d.toISOString();
    }
  }

  private groupBy(points: DataPoint[], groupFields: string[]): Map<string, DataPoint[]> {
    if (groupFields.length === 0) {
      const map = new Map<string, DataPoint[]>();
      map.set('__all__', points);
      return map;
    }

    const groups = new Map<string, DataPoint[]>();
    for (const point of points) {
      const key = groupFields.map(f => `${f}=${point.tags[f] ?? ''}`).join('|');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(point);
    }
    return groups;
  }

  private parseGroupKey(key: string, fields: string[]): Record<string, string> {
    if (key === '__all__') return {};
    const result: Record<string, string> = {};
    const parts = key.split('|');
    for (let i = 0; i < fields.length && i < parts.length; i++) {
      const eqIdx = parts[i].indexOf('=');
      if (eqIdx > 0) {
        result[fields[i]] = parts[i].substring(eqIdx + 1);
      }
    }
    return result;
  }

  private computeAggregation(type: AggregationType, field: string, values: number[]): number {
    if (values.length === 0) return 0;

    switch (type) {
      case AggregationType.SUM:
        return values.reduce((a, b) => a + b, 0);

      case AggregationType.AVG:
        return values.reduce((a, b) => a + b, 0) / values.length;

      case AggregationType.MIN:
        return Math.min(...values);

      case AggregationType.MAX:
        return Math.max(...values);

      case AggregationType.COUNT:
        return values.length;

      case AggregationType.UNIQUE:
        return new Set(values).size;

      case AggregationType.PERCENTILE_50:
        return percentile(values, 50);

      case AggregationType.PERCENTILE_90:
        return percentile(values, 90);

      case AggregationType.PERCENTILE_95:
        return percentile(values, 95);

      case AggregationType.PERCENTILE_99:
        return percentile(values, 99);

      default:
        return values.reduce((a, b) => a + b, 0);
    }
  }

  private rollupData(data: DataPoint[], config: AggregationConfig): DataPoint[] {
    const groups = this.groupBy(data, config.group_by);
    const results: DataPoint[] = [];

    for (const [, groupPoints] of groups) {
      const values = groupPoints.map(p => p.value);
      const aggregated = this.computeAggregation(config.type, config.field, values);

      const tags: Record<string, string> = {};
      for (const point of groupPoints) {
        Object.assign(tags, point.tags);
      }

      results.push({
        value: aggregated,
        timestamp: new Date(),
        tags,
      });
    }

    return results;
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function weekNumber(d: Date): string {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  const week = Math.ceil((diff / 86400000 + start.getUTCDay() + 1) / 7);
  return pad(week);
}

function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const sorted = [...sortedValues].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
}
