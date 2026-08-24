import { ExportConfig, ExportFormat } from '../../interfaces';
import { BaseExportProvider } from './base-export';

export class CsvExportProvider extends BaseExportProvider {
  readonly name = 'csv-export';
  readonly supportedFormats: ExportFormat[] = [ExportFormat.CSV];
  private includeHeaders = true;
  private delimiter = ',';

  async configure(config: ExportConfig): Promise<void> {
    await super.configure(config);
    this.includeHeaders = config.include_headers ?? true;
    if (config.options?.delimiter) {
      this.delimiter = config.options.delimiter as string;
    }
  }

  async export(data: Record<string, unknown>[]): Promise<string> {
    if (data.length === 0) return '';

    const columns = this.extractColumns(data);
    const rows: string[] = [];

    if (this.includeHeaders) {
      rows.push(columns.map(c => this.escapeField(c)).join(this.delimiter));
    }

    for (const row of data) {
      const values = columns.map(col => this.escapeField(this.formatValue(row[col])));
      rows.push(values.join(this.delimiter));
    }

    const content = rows.join('\n');
    return content;
  }

  async exportToFile(data: Record<string, unknown>[], filePath: string): Promise<void> {
    const content = await this.export(data);
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async exportStream(
    data: AsyncIterable<Record<string, unknown>[]>
  ): Promise<string> {
    const chunks: string[] = [];
    let headerWritten = false;

    for await (const batch of data) {
      if (batch.length === 0) continue;

      const columns = this.extractColumns(batch);

      if (!headerWritten && this.includeHeaders) {
        chunks.push(columns.map(c => this.escapeField(c)).join(this.delimiter));
        headerWritten = true;
      }

      for (const row of batch) {
        const values = columns.map(col => this.escapeField(this.formatValue(row[col])));
        chunks.push(values.join(this.delimiter));
      }
    }

    return chunks.join('\n');
  }

  validate(data: Record<string, unknown>[]): boolean {
    return data.length > 0;
  }

  private extractColumns(data: Record<string, unknown>[]): string[] {
    const columnSet = new Set<string>();
    for (const row of data) {
      Object.keys(row).forEach(k => columnSet.add(k));
    }
    return Array.from(columnSet);
  }

  private escapeField(value: string): string {
    if (value.includes(this.delimiter) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }
}
