import { MetadataSchema, MetadataField, ContentItem } from './types';

export interface IMetadataEngine {
  readonly name: string;
  initialize(): Promise<void>;
  registerSchema(schema: MetadataSchema): Promise<void>;
  getSchema(id: string): Promise<MetadataSchema | null>;
  listSchemas(): Promise<MetadataSchema[]>;
  updateSchema(id: string, schema: Partial<MetadataSchema>): Promise<MetadataSchema>;
  deleteSchema(id: string): Promise<boolean>;
  validate(content: ContentItem, schemaId: string): Promise<MetadataValidationResult>;
  extract(content: ContentItem): Promise<Record<string, unknown>>;
  augment(content: ContentItem, additionalMetadata: Record<string, unknown>): Promise<ContentItem>;
  getFieldDefinition(schemaId: string, fieldName: string): Promise<MetadataField | null>;
  dispose(): Promise<void>;
}

export interface MetadataValidationResult {
  valid: boolean;
  errors: MetadataValidationError[];
  warnings: MetadataValidationWarning[];
}

export interface MetadataValidationError {
  field: string;
  message: string;
  code: string;
}

export interface MetadataValidationWarning {
  field: string;
  message: string;
  code: string;
}
