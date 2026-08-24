import { ReportDefinition } from './types';

export interface ReportResult {
  id: string;
  name: string;
  generated_at: Date;
  row_count: number;
  columns: string[];
  data: Record<string, unknown>[];
  summary?: Record<string, unknown>;
}

export interface ReportProvider {
  readonly name: string;
  createReport(definition: ReportDefinition): Promise<string>;
  generate(reportId: string): Promise<ReportResult>;
  schedule(reportId: string, cron: string, recipients: string[]): Promise<void>;
  cancelSchedule(reportId: string): Promise<void>;
  getReport(reportId: string): Promise<ReportResult | null>;
  listReports(): Promise<ReportDefinition[]>;
  deleteReport(reportId: string): Promise<void>;
}
