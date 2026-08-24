import { ImportResult, ImportValidationResult, ImportPreview } from '../../interfaces';

export interface IImporterProvider {
  readonly name: string;
  readonly supportedFormats: string[];
  initialize(): Promise<void>;
  validate(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportValidationResult>;
  import(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportResult>;
  preview(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportPreview>;
  mapFields(mapping: Record<string, string>): void;
  dispose(): Promise<void>;
}
