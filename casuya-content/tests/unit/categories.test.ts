import { CategoryService, MemoryCategoryProvider } from '../../src/categories';

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    const provider = new MemoryCategoryProvider();
    service = new CategoryService(provider);
    await service.initialize();
  });

  it('should create categories', async () => {
    const cat = await service.create({
      slug: 'tutorials', name: 'Tutorials', order: 1, metadata: {},
    });
    expect(cat.id).toBeDefined();
    expect(cat.name).toBe('Tutorials');
  });

  it('should build category tree', async () => {
    const root = await service.create({
      slug: 'root', name: 'Root', order: 1, metadata: {},
    });
    await service.create({
      slug: 'leaf', name: 'Leaf', order: 1, parentId: root.id, metadata: {},
    });

    const tree = await service.getTree();
    expect(tree[0].children).toHaveLength(1);
  });

  it('should move categories', async () => {
    const cat1 = await service.create({
      slug: 'cat1', name: 'Category 1', order: 1, metadata: {},
    });
    const cat2 = await service.create({
      slug: 'cat2', name: 'Category 2', order: 1, metadata: {},
    });

    await service.move(cat1.id, cat2.id);
    const moved = await service.findById(cat1.id);
    expect(moved!.parentId).toBe(cat2.id);
  });
});
