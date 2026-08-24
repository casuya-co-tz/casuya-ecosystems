import { IMetadataProvider } from './metadata-provider.interface';
import { MetadataSchema, MetadataField } from '../../interfaces';

export class MemoryMetadataProvider implements IMetadataProvider {
  public readonly name = 'memory';
  private schemas = new Map<string, MetadataSchema>();

  async initialize(): Promise<void> {}

  async registerSchema(schema: MetadataSchema): Promise<void> {
    this.schemas.set(schema.id, { ...schema });
  }

  async getSchema(id: string): Promise<MetadataSchema | null> {
    const s = this.schemas.get(id);
    return s ? { ...s } : null;
  }

  async listSchemas(): Promise<MetadataSchema[]> {
    return [...this.schemas.values()].map(s => ({ ...s }));
  }

  async updateSchema(id: string, data: Partial<MetadataSchema>): Promise<MetadataSchema> {
    const existing = this.schemas.get(id);
    if (!existing) throw new Error(`Schema ${id} not found`);
    const updated = { ...existing, ...data, id: existing.id, version: existing.version + 1 };
    this.schemas.set(id, updated);
    return { ...updated };
  }

  async deleteSchema(id: string): Promise<boolean> {
    return this.schemas.delete(id);
  }

  async getFieldDefinition(schemaId: string, fieldName: string): Promise<MetadataField | null> {
    const schema = this.schemas.get(schemaId);
    if (!schema) return null;
    return schema.fields.find(f => f.name === fieldName) || null;
  }

  async dispose(): Promise<void> {
    this.schemas.clear();
  }
}
