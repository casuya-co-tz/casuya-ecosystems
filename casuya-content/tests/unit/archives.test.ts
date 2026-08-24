import { ArchiveService, MemoryArchiveProvider } from '../../src/archives';

describe('ArchiveService', () => {
  let service: ArchiveService;

  beforeEach(async () => {
    const provider = new MemoryArchiveProvider();
    service = new ArchiveService(provider);
    await service.initialize();
  });

  it('should archive and restore content', async () => {
    const content = { id: 'c1', title: 'Test', slug: 'test' } as any;
    const entry = await service.archive(content, 'admin', 'Cleanup');
    expect(entry.contentId).toBe('c1');
    expect(entry.archivedBy).toBe('admin');

    const restored = await service.restore(entry.id);
    expect(restored.id).toBe('c1');
  });

  it('should find archive by content id', async () => {
    const content = { id: 'c2', title: 'Test', slug: 'test' } as any;
    await service.archive(content, 'admin');
    const found = await service.findByContentId('c2');
    expect(found).not.toBeNull();
  });

  it('should list archives', async () => {
    await service.archive({ id: 'c1' } as any, 'admin');
    await service.archive({ id: 'c2' } as any, 'admin');
    const list = await service.list();
    expect(list.total).toBe(2);
  });

  it('should compress and extract archives', async () => {
    const content = { id: 'c1', title: 'Test', slug: 'test' } as any;
    const entry = await service.archive(content, 'admin');
    const compressed = await service.compressArchive(entry.id);
    expect(compressed.metadata.compressed).toBe(true);
    const extracted = await service.extractArchive(entry.id);
    expect(extracted.metadata.compressed).toBe(false);
  });
});
