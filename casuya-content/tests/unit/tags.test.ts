import { TagService, MemoryTagProvider } from '../../src/tags';

describe('TagService', () => {
  let service: TagService;

  beforeEach(async () => {
    const provider = new MemoryTagProvider();
    service = new TagService(provider);
    await service.initialize();
  });

  it('should create tags', async () => {
    const tag = await service.create({
      name: 'JavaScript',
      slug: 'javascript',
      description: 'JS language',
      metadata: {},
    });
    expect(tag.id).toBeDefined();
    expect(tag.name).toBe('JavaScript');
    expect(tag.usageCount).toBe(0);
  });

  it('should find by name', async () => {
    await service.create({ name: 'TypeScript', slug: 'typescript', metadata: {} });
    const found = await service.findByName('TypeScript');
    expect(found).not.toBeNull();
  });

  it('should track usage counts', async () => {
    const tag = await service.create({ name: 'Popular', slug: 'popular', metadata: {} });
    await service.incrementUsage(tag.id);
    await service.incrementUsage(tag.id);
    await service.incrementUsage(tag.id);
    const updated = await service.findById(tag.id);
    expect(updated!.usageCount).toBe(3);
  });

  it('should return popular tags sorted by usage', async () => {
    await service.create({ name: 'A', slug: 'a', metadata: {} });
    const tagB = await service.create({ name: 'B', slug: 'b', metadata: {} });
    await service.incrementUsage(tagB.id);
    await service.incrementUsage(tagB.id);

    const popular = await service.getPopularTags(5);
    expect(popular[0].name).toBe('B');
    expect(popular[1].name).toBe('A');
  });

  it('should suggest tags by prefix', async () => {
    await service.create({ name: 'React', slug: 'react', metadata: {} });
    await service.create({ name: 'Redux', slug: 'redux', metadata: {} });
    await service.create({ name: 'Rust', slug: 'rust', metadata: {} });

    const suggestions = await service.suggest('re');
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
  });
});
