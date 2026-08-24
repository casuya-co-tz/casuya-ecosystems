import { IExporter, ExportOptions, ExportResult, ContentItem } from '../interfaces';
import { IExporterProvider } from './providers/exporter-provider.interface';

export class BaseExporter implements IExporter {
  public readonly name: string;
  public readonly supportedFormats: string[];
  private provider: IExporterProvider;
  private initialized = false;

  constructor(provider: IExporterProvider) {
    this.name = `exporter-${provider.name}`;
    this.supportedFormats = provider.supportedFormats;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('Exporter not initialized');
  }

  async export(items: ContentItem[], options: ExportOptions): Promise<ExportResult> {
    this.check();
    return this.provider.export(items, options);
  }

  async exportSingle(item: ContentItem, format: string): Promise<ExportResult> {
    this.check();
    return this.provider.exportSingle(item, format);
  }

  async getFormatOptions(format: string): Promise<Record<string, unknown>> {
    this.check();
    return this.provider.getFormatOptions(format);
  }

  async validateOptions(options: ExportOptions): Promise<boolean> {
    this.check();
    return this.provider.validateOptions(options);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
