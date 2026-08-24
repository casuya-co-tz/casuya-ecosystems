import { MetadataEngine, MemoryMetadataProvider } from '../../src/metadata';

describe('MetadataEngine', () => {
  let engine: MetadataEngine;

  beforeEach(async () => {
    const provider = new MemoryMetadataProvider();
    engine = new MetadataEngine(provider);
    await engine.initialize();
  });

  it('should register and retrieve a schema', async () => {
    await engine.registerSchema({
      id: 'article-schema',
      name: 'Article Schema',
      fields: [
        { name: 'author', type: 'string', required: true },
        { name: 'wordCount', type: 'number', required: false },
        { name: 'published', type: 'boolean', required: true },
      ],
      version: 1,
    });

    const schema = await engine.getSchema('article-schema');
    expect(schema).not.toBeNull();
    expect(schema!.fields).toHaveLength(3);
  });

  it('should list all schemas', async () => {
    await engine.registerSchema({
      id: 'schema-1', name: 'Schema 1', fields: [], version: 1,
    });
    await engine.registerSchema({
      id: 'schema-2', name: 'Schema 2', fields: [], version: 1,
    });
    const schemas = await engine.listSchemas();
    expect(schemas).toHaveLength(2);
  });

  it('should update a schema', async () => {
    await engine.registerSchema({
      id: 'test-schema', name: 'Original', fields: [], version: 1,
    });
    const updated = await engine.updateSchema('test-schema', { name: 'Updated' });
    expect(updated.name).toBe('Updated');
    expect(updated.version).toBe(2);
  });

  it('should delete a schema', async () => {
    await engine.registerSchema({
      id: 'delete-me', name: 'Delete Me', fields: [], version: 1,
    });
    const deleted = await engine.deleteSchema('delete-me');
    expect(deleted).toBe(true);
    expect(await engine.getSchema('delete-me')).toBeNull();
  });

  it('should validate content against schema', async () => {
    await engine.registerSchema({
      id: 'validation-schema',
      name: 'Validation',
      fields: [
        { name: 'requiredField', type: 'string', required: true },
        { name: 'optionalField', type: 'number', required: false },
      ],
      version: 1,
    });

    const validResult = await engine.validate(
      { metadata: { requiredField: 'hello' } } as any,
      'validation-schema',
    );
    expect(validResult.valid).toBe(true);

    const invalidResult = await engine.validate(
      { metadata: {} } as any,
      'validation-schema',
    );
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.errors.length).toBeGreaterThan(0);
  });

  it('should augment content with additional metadata', async () => {
    const content = { metadata: { existing: 'value' } } as any;
    const augmented = await engine.augment(content, { newField: 'new value' });
    expect(augmented.metadata.existing).toBe('value');
    expect(augmented.metadata.newField).toBe('new value');
  });
});
