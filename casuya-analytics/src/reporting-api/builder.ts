import { ExportFormat, ReportDefinition, ReportFilter, ScheduleConfig, TimeRange } from '../interfaces';

export class ReportBuilder {
  private definition: Partial<ReportDefinition> = {};

  setName(name: string): this {
    this.definition.name = name;
    return this;
  }

  setDescription(description: string): this {
    this.definition.description = description;
    return this;
  }

  addMetric(metric: string): this {
    if (!this.definition.metrics) this.definition.metrics = [];
    this.definition.metrics.push(metric);
    return this;
  }

  addFilter(filter: ReportFilter): this {
    if (!this.definition.filters) this.definition.filters = [];
    this.definition.filters.push(filter);
    return this;
  }

  addGroupBy(field: string): this {
    if (!this.definition.group_by) this.definition.group_by = [];
    this.definition.group_by.push(field);
    return this;
  }

  setTimeRange(range: TimeRange): this {
    this.definition.time_range = range;
    return this;
  }

  setFormat(format: ExportFormat): this {
    this.definition.format = format;
    return this;
  }

  setSchedule(schedule: ScheduleConfig): this {
    this.definition.schedule = schedule;
    return this;
  }

  build(): ReportDefinition {
    if (!this.definition.name || !this.definition.metrics || !this.definition.time_range) {
      throw new Error('Report name, metrics, and time range are required');
    }

    return {
      id: `report_${Date.now()}`,
      name: this.definition.name,
      description: this.definition.description,
      metrics: this.definition.metrics,
      filters: this.definition.filters ?? [],
      group_by: this.definition.group_by ?? [],
      time_range: this.definition.time_range,
      format: this.definition.format ?? ExportFormat.JSON,
      schedule: this.definition.schedule,
    };
  }
}
