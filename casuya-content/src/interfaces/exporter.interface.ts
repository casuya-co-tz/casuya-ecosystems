import { ExportOptions, ExportResult, ContentItem } from './types';

export interface IExporter {
  readonly name: string;
  readonly supportedFormats: string[];
  initialize(): Promise<void>;
  export(items: ContentItem[], options: ExportOptions): Promise<ExportResult>;
  exportSingle(item: ContentItem, format: string): Promise<ExportResult>;
  getFormatOptions(format: string): Promise<Record<string, unknown>>;
  validateOptions(options: ExportOptions): Promise<boolean>;
  dispose(): Promise<void>;
}
