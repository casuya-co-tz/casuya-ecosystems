import { ImportResult, ContentItem } from './types';

export interface IImporter {
  readonly name: string;
  readonly supportedFormats: string[];
  initialize(): Promise<void>;
  validate(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportValidationResult>;
  import(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportResult>;
  preview(data: Buffer | string, options?: Record<string, unknown>): Promise<ImportPreview>;
  mapFields(mapping: Record<string, string>): void;
  dispose(): Promise<void>;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: ImportValidationError[];
  totalItems: number;
}

export interface ImportValidationError {
  line: number;
  field: string;
  message: string;
}

export interface ImportPreview {
  totalItems: number;
  sampleItems: Partial<ContentItem>[];
  detectedFields: string[];
  warnings: string[];
}
