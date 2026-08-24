import { ExportConfig, ExportFormat, ExportProvider } from '../../interfaces';

export abstract class BaseExportProvider implements ExportProvider {
  public abstract readonly name: string;
  public abstract readonly supportedFormats: ExportFormat[];
  protected config!: ExportConfig;

  async configure(config: ExportConfig): Promise<void> {
    this.config = config;
  }

  abstract export(data: Record<string, unknown>[]): Promise<string>;

  validate(data: Record<string, unknown>[]): boolean {
    return data.length > 0;
  }

  async shutdown(): Promise<void> {
    return;
  }
}
