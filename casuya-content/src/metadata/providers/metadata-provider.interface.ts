import { MetadataSchema, MetadataField } from '../../interfaces';

export interface IMetadataProvider {
  readonly name: string;
  initialize(): Promise<void>;
  registerSchema(schema: MetadataSchema): Promise<void>;
  getSchema(id: string): Promise<MetadataSchema | null>;
  listSchemas(): Promise<MetadataSchema[]>;
  updateSchema(id: string, data: Partial<MetadataSchema>): Promise<MetadataSchema>;
  deleteSchema(id: string): Promise<boolean>;
  getFieldDefinition(schemaId: string, fieldName: string): Promise<MetadataField | null>;
  dispose(): Promise<void>;
}
