import { IExporterProvider } from './exporter-provider.interface';
import { ExportOptions, ExportResult, ContentItem } from '../../interfaces';

export class JsonExporterProvider implements IExporterProvider {
  public readonly name = 'json';
  public readonly supportedFormats = ['json'];

  async initialize(): Promise<void> {}

  async export(items: ContentItem[], options: ExportOptions): Promise<ExportResult> {
    const data = options.fields
      ? items.map(item => this.filterFields(item, options.fields!))
      : items;
    return {
      success: true,
      data: JSON.stringify(data, null, 2),
      format: 'json',
      totalItems: items.length,
      metadata: { exportedAt: new Date().toISOString() },
    };
  }

  async exportSingle(item: ContentItem, _format: string): Promise<ExportResult> {
    return {
      success: true,
      data: JSON.stringify(item, null, 2),
      format: 'json',
      totalItems: 1,
      metadata: { exportedAt: new Date().toISOString() },
    };
  }

  async getFormatOptions(format: string): Promise<Record<string, unknown>> {
    const compact = format === 'json-compact';
    return { pretty: !compact, dateFormat: 'ISO', compact };
  }

  async validateOptions(options: ExportOptions): Promise<boolean> {
    if (!options.format) return false;
    if (!['json', 'json-compact'].includes(options.format)) return false;
    if (options.fields && !Array.isArray(options.fields)) return false;
    return true;
  }

  async dispose(): Promise<void> {}

  private filterFields(item: ContentItem, fields: string[]): Record<string, unknown> {
    if (fields.length === 0) fields = Object.keys(item as unknown as Record<string, unknown>);
    const result: Record<string, unknown> = {};
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(item, field)) {
        result[field] = (item as unknown as Record<string, unknown>)[field];
      }
    }
    return result;
  }
}
