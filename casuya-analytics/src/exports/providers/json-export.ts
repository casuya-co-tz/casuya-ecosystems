import { ExportConfig, ExportFormat } from '../../interfaces';
import { BaseExportProvider } from './base-export';

export class JsonExportProvider extends BaseExportProvider {
  readonly name = 'json-export';
  readonly supportedFormats: ExportFormat[] = [ExportFormat.JSON];
  private pretty = false;
  private dateFormat: 'iso' | 'timestamp' = 'iso';

  async configure(config: ExportConfig): Promise<void> {
    await super.configure(config);
    if (config.options?.pretty === true) this.pretty = true;
    if (config.options?.dateFormat === 'timestamp') this.dateFormat = 'timestamp';
  }

  async export(data: Record<string, unknown>[]): Promise<string> {
    const processed = this.processDates(data);
    const space = this.pretty ? 2 : undefined;
    return JSON.stringify(processed, null, space);
  }

  async exportToFile(data: Record<string, unknown>[], filePath: string): Promise<void> {
    const content = await this.export(data);
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, content, 'utf-8');
  }

  async exportStream(
    data: AsyncIterable<Record<string, unknown>[]>
  ): Promise<string> {
    const allData: Record<string, unknown>[] = [];

    for await (const batch of data) {
      allData.push(...this.processDates(batch));
    }

    const space = this.pretty ? 2 : undefined;
    return JSON.stringify(allData, null, space);
  }

  validate(data: Record<string, unknown>[]): boolean {
    return data.length > 0;
  }

  private processDates(data: Record<string, unknown>[]): Record<string, unknown>[] {
    if (this.dateFormat === 'iso') return data;

    return data.map(row => {
      const processed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (value instanceof Date) {
          processed[key] = value.getTime();
        } else {
          processed[key] = value;
        }
      }
      return processed;
    });
  }
}
