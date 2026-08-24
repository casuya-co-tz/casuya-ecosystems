import { TaxonomyService, MemoryTaxonomyProvider } from '../../src/taxonomies';

describe('TaxonomyService', () => {
  let service: TaxonomyService;

  beforeEach(async () => {
    const provider = new MemoryTaxonomyProvider();
    service = new TaxonomyService(provider);
    await service.initialize();
  });

  it('should create taxonomy nodes', async () => {
    const node = await service.create({
      slug: 'science',
      name: 'Science',
      order: 1,
      metadata: {},
    });
    expect(node.id).toBeDefined();
    expect(node.slug).toBe('science');
  });

  it('should build a hierarchy', async () => {
    const root = await service.create({
      slug: 'root', name: 'Root', order: 1, metadata: {},
    });
    const child = await service.create({
      slug: 'child', name: 'Child', order: 1, parentId: root.id, metadata: {},
    });

    const children = await service.getChildren(root.id);
    expect(children).toHaveLength(1);
    expect(children[0].id).toBe(child.id);
  });

  it('should get ancestors', async () => {
    const root = await service.create({
      slug: 'r', name: 'Root', order: 1, metadata: {},
    });
    const child = await service.create({
      slug: 'c', name: 'Child', order: 1, parentId: root.id, metadata: {},
    });
    const grandchild = await service.create({
      slug: 'gc', name: 'Grandchild', order: 1, parentId: child.id, metadata: {},
    });

    const ancestors = await service.getAncestors(grandchild.id);
    expect(ancestors).toHaveLength(2);
    expect(ancestors[0].id).toBe(root.id);
    expect(ancestors[1].id).toBe(child.id);
  });

  it('should get tree', async () => {
    const root = await service.create({
      slug: 'root', name: 'Root', order: 1, metadata: {},
    });
    await service.create({
      slug: 'child', name: 'Child', order: 1, parentId: root.id, metadata: {},
    });

    const tree = await service.getTree();
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
  });

  it('should search nodes', async () => {
    await service.create({
      slug: 'mathematics', name: 'Mathematics', order: 1, metadata: {},
    });
    await service.create({
      slug: 'physics', name: 'Physics', order: 2, metadata: {},
    });

    const result = await service.search('math');
    expect(result.total).toBe(1);
    expect(result.items[0].name).toBe('Mathematics');
  });
});
