import {
  IMetadataEngine,
  MetadataSchema,
  MetadataField,
  ContentItem,
  MetadataValidationResult,
} from '../interfaces';
import { IMetadataProvider } from './providers/metadata-provider.interface';

export class MetadataEngine implements IMetadataEngine {
  public readonly name: string;
  private provider: IMetadataProvider;
  private initialized = false;

  constructor(provider: IMetadataProvider) {
    this.name = `metadata-engine-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private checkInit(): void {
    if (!this.initialized) throw new Error('MetadataEngine not initialized');
  }

  async registerSchema(schema: MetadataSchema): Promise<void> {
    this.checkInit();
    await this.provider.registerSchema(schema);
  }

  async getSchema(id: string): Promise<MetadataSchema | null> {
    this.checkInit();
    return this.provider.getSchema(id);
  }

  async listSchemas(): Promise<MetadataSchema[]> {
    this.checkInit();
    return this.provider.listSchemas();
  }

  async updateSchema(id: string, data: Partial<MetadataSchema>): Promise<MetadataSchema> {
    this.checkInit();
    return this.provider.updateSchema(id, data);
  }

  async deleteSchema(id: string): Promise<boolean> {
    this.checkInit();
    return this.provider.deleteSchema(id);
  }

  async validate(content: ContentItem, schemaId: string): Promise<MetadataValidationResult> {
    this.checkInit();
    const schema = await this.provider.getSchema(schemaId);
    if (!schema) {
      return {
        valid: false,
        errors: [{ field: '_schema', message: `Schema ${schemaId} not found`, code: 'SCHEMA_NOT_FOUND' }],
        warnings: [],
      };
    }

    const errors: MetadataValidationResult['errors'] = [];
    const warnings: MetadataValidationResult['warnings'] = [];

    for (const field of schema.fields) {
      const value = content.metadata?.[field.name];
      if (field.required && (value === undefined || value === null)) {
        errors.push({ field: field.name, message: `Required field '${field.name}' is missing`, code: 'REQUIRED' });
        continue;
      }
      if (value === undefined || value === null) continue;

      const typeError = this.validateType(field.name, value, field.type);
      if (typeError) errors.push(typeError);

      if (field.type === 'enum' && field.enumValues && typeof value === 'string') {
        if (!field.enumValues.includes(value)) {
          errors.push({ field: field.name, message: `Value must be one of: ${field.enumValues.join(', ')}`, code: 'ENUM' });
        }
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  async extract(content: ContentItem): Promise<Record<string, unknown>> {
    this.checkInit();
    return content.metadata || {};
  }

  async augment(content: ContentItem, additionalMetadata: Record<string, unknown>): Promise<ContentItem> {
    this.checkInit();
    return {
      ...content,
      metadata: { ...content.metadata, ...additionalMetadata },
    };
  }

  async getFieldDefinition(schemaId: string, fieldName: string): Promise<MetadataField | null> {
    this.checkInit();
    return this.provider.getFieldDefinition(schemaId, fieldName);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }

  private validateType(field: string, value: unknown, type: string): MetadataValidationResult['errors'][0] | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') return { field, message: `Expected string, got ${typeof value}`, code: 'TYPE' };
        break;
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) return { field, message: `Expected number, got ${typeof value}`, code: 'TYPE' };
        break;
      case 'boolean':
        if (typeof value !== 'boolean') return { field, message: `Expected boolean, got ${typeof value}`, code: 'TYPE' };
        break;
      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return { field, message: `Expected valid date string`, code: 'TYPE' };
        }
        break;
      case 'array':
        if (!Array.isArray(value)) return { field, message: `Expected array, got ${typeof value}`, code: 'TYPE' };
        break;
      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return { field, message: `Expected plain object`, code: 'TYPE' };
        }
        break;
      case 'enum':
        if (typeof value !== 'string') return { field, message: `Expected string for enum, got ${typeof value}`, code: 'TYPE' };
        break;
    }
    return null;
  }
}
