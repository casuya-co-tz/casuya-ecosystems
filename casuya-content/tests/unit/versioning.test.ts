import { VersioningService, MemoryVersioningProvider } from '../../src/versioning';

describe('VersioningService', () => {
  let service: VersioningService;

  beforeEach(async () => {
    const provider = new MemoryVersioningProvider();
    service = new VersioningService(provider);
    await service.initialize();
  });

  it('should create and retrieve versions', async () => {
    const version = await service.createVersion(
      { id: 'content-1', title: 'v1', version: 1 } as any,
      'author-1',
      'Initial version',
    );
    expect(version.id).toBeDefined();
    expect(version.version).toBe(1);
    expect(version.message).toBe('Initial version');
  });

  it('should get version history for content', async () => {
    await service.createVersion({ id: 'c1', title: 'v1', version: 1 } as any, 'u1');
    await service.createVersion({ id: 'c1', title: 'v2', version: 2 } as any, 'u1');
    await service.createVersion({ id: 'c1', title: 'v3', version: 3 } as any, 'u1');

    const versions = await service.getContentVersions('c1');
    expect(versions.total).toBe(3);
  });

  it('should get latest version', async () => {
    await service.createVersion({ id: 'c1', title: 'v1', version: 1 } as any, 'u1');
    await service.createVersion({ id: 'c1', title: 'v2', version: 2 } as any, 'u1');

    const latest = await service.getLatestVersion('c1');
    expect(latest!.version).toBe(2);
  });

  it('should compare versions', async () => {
    const v1 = await service.createVersion({ id: 'c1', title: 'Original', body: 'Hello', version: 1 } as any, 'u1');
    const v2 = await service.createVersion({ id: 'c1', title: 'Updated', body: 'World', version: 2 } as any, 'u1');

    const diff = await service.compareVersions(v1.id, v2.id);
    expect(diff.changes.length).toBeGreaterThanOrEqual(2);
    expect(diff.summary).toBeDefined();
  });

  it('should prune old versions', async () => {
    for (let i = 1; i <= 5; i++) {
      await service.createVersion({ id: 'c1', title: `v${i}`, version: i } as any, 'u1');
    }
    const pruned = await service.pruneVersions('c1', 3);
    expect(pruned).toBe(2);

    const remaining = await service.getContentVersions('c1');
    expect(remaining.total).toBe(3);
  });
});
