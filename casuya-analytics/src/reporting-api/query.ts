import { ReportFilter, TimeRange } from '../interfaces';

export interface Query {
  metrics: string[];
  filters: ReportFilter[];
  group_by: string[];
  time_range: TimeRange;
  limit?: number;
  offset?: number;
}

export class QueryBuilder {
  private query: Partial<Query> = {};

  addMetric(metric: string): this {
    if (!this.query.metrics) this.query.metrics = [];
    this.query.metrics.push(metric);
    return this;
  }

  addFilter(filter: ReportFilter): this {
    if (!this.query.filters) this.query.filters = [];
    this.query.filters.push(filter);
    return this;
  }

  addGroupBy(field: string): this {
    if (!this.query.group_by) this.query.group_by = [];
    this.query.group_by.push(field);
    return this;
  }

  setTimeRange(range: TimeRange): this {
    this.query.time_range = range;
    return this;
  }

  setLimit(limit: number): this {
    this.query.limit = limit;
    return this;
  }

  setOffset(offset: number): this {
    this.query.offset = offset;
    return this;
  }

  build(): Query {
    if (!this.query.metrics || !this.query.time_range) {
      throw new Error('Metrics and time_range are required');
    }

    return {
      metrics: this.query.metrics,
      filters: this.query.filters ?? [],
      group_by: this.query.group_by ?? [],
      time_range: this.query.time_range,
      limit: this.query.limit,
      offset: this.query.offset,
    } as Query;
  }
}
