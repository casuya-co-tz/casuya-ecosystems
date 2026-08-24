import { ReportBuilder } from '../src/reporting-api/builder';
import { QueryBuilder } from '../src/reporting-api/query';
import { ExportFormat, ReportFilter } from '../src/interfaces';

describe('ReportBuilder', () => {
  it('should build a complete report definition', () => {
    const report = new ReportBuilder()
      .setName('Monthly Active Users')
      .setDescription('Active users per month')
      .addMetric('active_users')
      .addFilter({ field: 'region', operator: 'eq', value: 'US' })
      .addGroupBy('plan_type')
      .setTimeRange({
        start: new Date('2026-01-01'),
        end: new Date('2026-07-01'),
        granularity: 'month',
      })
      .setFormat(ExportFormat.CSV)
      .build();

    expect(report.name).toBe('Monthly Active Users');
    expect(report.description).toBe('Active users per month');
    expect(report.metrics).toEqual(['active_users']);
    expect(report.filters).toHaveLength(1);
    expect(report.group_by).toEqual(['plan_type']);
    expect(report.format).toBe(ExportFormat.CSV);
    expect(report.id).toBeDefined();
  });

  it('should build minimal report', () => {
    const report = new ReportBuilder()
      .setName('Quick Report')
      .addMetric('page_views')
      .setTimeRange({
        start: new Date(),
        end: new Date(),
        granularity: 'day',
      })
      .build();

    expect(report.name).toBe('Quick Report');
    expect(report.filters).toEqual([]);
    expect(report.group_by).toEqual([]);
    expect(report.format).toBe(ExportFormat.JSON);
  });

  it('should throw if required fields missing', () => {
    expect(() => new ReportBuilder().build()).toThrow();
    expect(() => new ReportBuilder().setName('x').build()).toThrow();
  });

  it('should support scheduled reports', () => {
    const report = new ReportBuilder()
      .setName('Weekly Summary')
      .addMetric('revenue')
      .setTimeRange({ start: new Date(), end: new Date(), granularity: 'week' })
      .setSchedule({
        frequency: 'weekly',
        timezone: 'UTC',
        recipients: ['admin@school.com'],
      })
      .build();

    expect(report.schedule).toBeDefined();
    expect(report.schedule!.frequency).toBe('weekly');
  });
});

describe('QueryBuilder', () => {
  it('should build a query', () => {
    const query = new QueryBuilder()
      .addMetric('page_views')
      .addFilter({ field: 'country', operator: 'eq', value: 'US' })
      .addGroupBy('browser')
      .setTimeRange({ start: new Date(), end: new Date(), granularity: 'day' })
      .setLimit(100)
      .setOffset(0)
      .build();

    expect(query.metrics).toEqual(['page_views']);
    expect(query.limit).toBe(100);
    expect(query.offset).toBe(0);
    expect(query.group_by).toEqual(['browser']);
  });

  it('should require metrics and time range', () => {
    expect(() => new QueryBuilder().build()).toThrow();
    expect(() => new QueryBuilder().addMetric('x').build()).toThrow();
  });
});
