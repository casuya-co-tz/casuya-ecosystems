import { IImporter, ImportResult, ImportValidationResult, ImportPreview } from '../interfaces';
import { IImporterProvider } from './providers/importer-provider.interface';

export class BaseImporter implements IImporter {
  public readonly name: string;
  public readonly supportedFormats: string[];
  private provider: IImporterProvider;
  private initialized = false;

  constructor(provider: IImporterProvider) {
    this.name = `importer-${provider.name}`;
    this.supportedFormats = provider.supportedFormats;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('Importer not initialized');
  }

  async validate(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportValidationResult> {
    this.check();
    return this.provider.validate(data, options);
  }

  async import(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportResult> {
    this.check();
    return this.provider.import(data, options);
  }

  async preview(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportPreview> {
    this.check();
    return this.provider.preview(data, options);
  }

  mapFields(mapping: Record<string, string>): void {
    this.provider.mapFields(mapping);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
