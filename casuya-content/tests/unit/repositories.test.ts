import { ContentRepository, MemoryContentRepositoryProvider } from '../../src/repositories';

describe('ContentRepository', () => {
  let repository: ContentRepository;

  beforeEach(async () => {
    const provider = new MemoryContentRepositoryProvider();
    repository = new ContentRepository(provider);
    await repository.initialize({
      provider: { name: 'memory', enabled: true, options: {} },
    });
  });

  it('should create a content item', async () => {
    const item = await repository.create({
      slug: 'test-article',
      title: 'Test Article',
      contentType: 'article',
      status: 'draft',
      tags: ['test'],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      description: 'A test article',
      body: 'Content body',
      createdBy: 'user1',
      updatedBy: 'user1',
    });

    expect(item.id).toBeDefined();
    expect(item.slug).toBe('test-article');
    expect(item.title).toBe('Test Article');
    expect(item.version).toBe(1);
  });

  it('should find by id', async () => {
    const created = await repository.create({
      slug: 'find-me',
      title: 'Find Me',
      contentType: 'article',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'user1',
      updatedBy: 'user1',
    });

    const found = await repository.findById(created.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
  });

  it('should find by slug', async () => {
    await repository.create({
      slug: 'unique-slug',
      title: 'Unique',
      contentType: 'doc',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });

    const found = await repository.findBySlug('unique-slug');
    expect(found).not.toBeNull();
    expect(found!.slug).toBe('unique-slug');
  });

  it('should update a content item', async () => {
    const created = await repository.create({
      slug: 'update-me',
      title: 'Original Title',
      contentType: 'article',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });

    const updated = await repository.update(created.id, { title: 'Updated Title' });
    expect(updated.title).toBe('Updated Title');
    expect(updated.version).toBe(created.version + 1);
  });

  it('should delete a content item', async () => {
    const created = await repository.create({
      slug: 'delete-me',
      title: 'Delete Me',
      contentType: 'article',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });

    const deleted = await repository.delete(created.id);
    expect(deleted).toBe(true);
    const found = await repository.findById(created.id);
    expect(found).toBeNull();
  });

  it('should search content items', async () => {
    await repository.create({
      slug: 'apple',
      title: 'Apple Article',
      contentType: 'article',
      status: 'published',
      tags: ['fruit'],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });
    await repository.create({
      slug: 'banana',
      title: 'Banana Article',
      contentType: 'article',
      status: 'draft',
      tags: ['fruit'],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });

    const result = await repository.search('apple');
    expect(result.total).toBe(1);
    expect(result.items[0].title).toBe('Apple Article');
  });

  it('should find by status', async () => {
    await repository.create({
      slug: 'pub-1',
      title: 'Published 1',
      contentType: 'article',
      status: 'published',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });
    await repository.create({
      slug: 'draft-1',
      title: 'Draft 1',
      contentType: 'article',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'u1',
      updatedBy: 'u1',
    });

    const result = await repository.findByStatus('published');
    expect(result.total).toBe(1);
    expect(result.items[0].status).toBe('published');
  });

  it('should count items', async () => {
    await repository.create({
      slug: 'a', title: 'A', contentType: 'doc', status: 'draft',
      tags: [], categoryIds: [], taxonomyIds: [], metadata: {},
      createdBy: 'u1', updatedBy: 'u1',
    });
    await repository.create({
      slug: 'b', title: 'B', contentType: 'doc', status: 'draft',
      tags: [], categoryIds: [], taxonomyIds: [], metadata: {},
      createdBy: 'u1', updatedBy: 'u1',
    });
    expect(await repository.count()).toBe(2);
  });
});
