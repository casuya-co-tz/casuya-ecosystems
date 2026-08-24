import { SearchAdapter, MemorySearchProvider } from '../../src/search-adapters';

describe('SearchAdapter', () => {
  let adapter: SearchAdapter;

  beforeEach(async () => {
    const provider = new MemorySearchProvider();
    adapter = new SearchAdapter(provider);
    await adapter.initialize();
  });

  it('should index and search content', async () => {
    await adapter.index({
      id: '1', title: 'Hello World', slug: 'hello-world',
      contentType: 'article', status: 'published',
      description: 'A hello world article',
      tags: ['hello', 'world'],
      categoryIds: [], taxonomyIds: [], metadata: {},
      body: 'This is the body content',
      version: 1,
      createdAt: new Date(), updatedAt: new Date(),
      createdBy: 'u1', updatedBy: 'u1',
    });

    const result = await adapter.search({
      query: 'hello',
      offset: 0,
      limit: 10,
    });
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe('Hello World');
  });

  it('should index batch of items', async () => {
    const items = [
      { id: '1', title: 'First', slug: 'first', contentType: 'article', status: 'published', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' },
      { id: '2', title: 'Second', slug: 'second', contentType: 'article', status: 'draft', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' },
    ] as any;
    await adapter.indexBatch(items);
    const result = await adapter.search({ query: 'second', offset: 0, limit: 10 });
    expect(result.total).toBe(1);
  });

  it('should remove from index', async () => {
    await adapter.index({ id: '1', title: 'Remove Me', slug: 'remove', contentType: 'doc', status: 'draft', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any);
    await adapter.remove('1');
    const result = await adapter.search({ query: 'remove', offset: 0, limit: 10 });
    expect(result.total).toBe(0);
  });

  it('should provide suggestions', async () => {
    await adapter.indexBatch([
      { id: '1', title: 'React Guide', slug: 'react', contentType: 'article', status: 'published', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any,
      { id: '2', title: 'React Tutorial', slug: 'react-tutorial', contentType: 'article', status: 'published', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any,
    ]);
    const suggestions = await adapter.suggest('react');
    expect(suggestions.length).toBeGreaterThanOrEqual(1);
  });

  it('should get index stats', async () => {
    const stats = await adapter.getIndexStats();
    expect(stats.totalDocuments).toBeDefined();
    expect(stats.fieldCount).toBeDefined();
  });

  it('should clear the index', async () => {
    await adapter.index({ id: '1', title: 'Temp', slug: 'temp', contentType: 'doc', status: 'draft', tags: [], categoryIds: [], taxonomyIds: [], metadata: {}, version: 1, createdAt: new Date(), updatedAt: new Date(), createdBy: 'u1', updatedBy: 'u1' } as any);
    await adapter.clearIndex();
    const stats = await adapter.getIndexStats();
    expect(stats.totalDocuments).toBe(0);
  });
});
