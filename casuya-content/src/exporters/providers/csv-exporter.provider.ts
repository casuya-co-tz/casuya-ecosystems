import { IExporterProvider } from './exporter-provider.interface';
import { ExportOptions, ExportResult, ContentItem } from '../../interfaces';

export class CsvExporterProvider implements IExporterProvider {
  public readonly name = 'csv';
  public readonly supportedFormats = ['csv', 'tsv'];
  private delimiter = ',';

  async initialize(): Promise<void> {}

  async export(items: ContentItem[], options: ExportOptions): Promise<ExportResult> {
    this.delimiter = (options as unknown as Record<string, unknown>).delimiter as string || ',';
    const fields = options.fields || ['id', 'slug', 'title', 'contentType', 'status', 'version', 'createdAt', 'updatedAt'];
    const header = fields.join(this.delimiter);
    const rows = items.map(item => {
      return fields.map(f => {
        const val = (item as unknown as Record<string, unknown>)[f];
        const str = val === null || val === undefined ? '' : String(val);
        return this.escapeCsvField(str);
      }).join(this.delimiter);
    });
    return {
      success: true,
      data: [header, ...rows].join('\n'),
      format: 'csv',
      totalItems: items.length,
      metadata: { fields, delimiter: this.delimiter },
    };
  }

  private escapeCsvField(value: string): string {
    if (value.includes(this.delimiter) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  async exportSingle(item: ContentItem, format: string): Promise<ExportResult> {
    return this.export([item], { format, fields: ['id', 'slug', 'title', 'contentType', 'status', 'version'], includeMetadata: false, includeVersions: false, compression: false });
  }

  async getFormatOptions(format: string): Promise<Record<string, unknown>> {
    const delimiter = format === 'tsv' ? '\t' : ',';
    return { delimiter, includeHeader: true, quoteStrings: true, format };
  }

  async validateOptions(options: ExportOptions): Promise<boolean> {
    if (!options.format) return false;
    if (!['csv', 'tsv'].includes(options.format)) return false;
    if (options.delimiter && typeof options.delimiter !== 'string') return false;
    return true;
  }

  async dispose(): Promise<void> {}
}
