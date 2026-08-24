import { AnalyticsEvent, MetricValue } from '../interfaces';

export function generateEventId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `evt_${timestamp}${random}`;
}

export function generateMetricId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `met_${timestamp}${random}`;
}

export function sanitizeTags(tags: Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    sanitized[key.replace(/[^a-zA-Z0-9_\-./]/g, '_')] = value.replace(/[^a-zA-Z0-9_\-./\s]/g, '');
  }
  return sanitized;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function validateEvent(event: AnalyticsEvent): string | null {
  if (!event.id) return 'Event id is required';
  if (!event.name) return 'Event name is required';
  if (!event.timestamp) return 'Event timestamp is required';
  if (!event.category) return 'Event category is required';
  return null;
}

export function validateMetric(metric: MetricValue): string | null {
  if (!metric.name) return 'Metric name is required';
  if (metric.value == null || isNaN(metric.value)) return 'Metric value must be a number';
  if (!metric.timestamp) return 'Metric timestamp is required';
  if (!metric.type) return 'Metric type is required';
  return null;
}

export function timeBucket(timestamp: Date, granularity: string): string {
  const d = new Date(timestamp);
  switch (granularity) {
    case 'minute':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    case 'hour':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:00`;
    case 'day':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    case 'week':
      return getWeekKey(d);
    case 'month':
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    case 'quarter':
      return `${d.getUTCFullYear()}-Q${Math.ceil((d.getUTCMonth() + 1) / 3)}`;
    case 'year':
      return `${d.getUTCFullYear()}`;
    default:
      return d.toISOString();
  }
}

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function getWeekKey(d: Date): string {
  const start = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const diff = d.getTime() - start.getTime();
  const week = Math.ceil((diff / 86400000 + start.getUTCDay() + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}
