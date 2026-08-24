import {
  ContentRepository,
  MemoryContentRepositoryProvider,
} from '../../src/repositories';
import {
  PublishingService,
  MemoryPublishingProvider,
} from '../../src/publishing';
import {
  VersioningService,
  MemoryVersioningProvider,
} from '../../src/versioning';
import {
  ArchiveService,
  MemoryArchiveProvider,
} from '../../src/archives';

describe('Content Lifecycle Integration', () => {
  let repository: ContentRepository;
  let publishing: PublishingService;
  let versioning: VersioningService;
  let archives: ArchiveService;

  beforeEach(async () => {
    repository = new ContentRepository(new MemoryContentRepositoryProvider());
    publishing = new PublishingService(new MemoryPublishingProvider());
    versioning = new VersioningService(new MemoryVersioningProvider());
    archives = new ArchiveService(new MemoryArchiveProvider());

    await repository.initialize({
      provider: { name: 'memory', enabled: true, options: {} },
    });
    await publishing.initialize();
    await versioning.initialize();
    await archives.initialize();
  });

  it('should handle full content lifecycle: create -> publish -> version -> archive', async () => {
    // 1. Create content
    const content = await repository.create({
      slug: 'lifecycle-test',
      title: 'Lifecycle Test Article',
      contentType: 'article',
      status: 'draft',
      tags: ['integration', 'test'],
      categoryIds: [],
      taxonomyIds: [],
      metadata: { author: 'tester' },
      description: 'Testing the full lifecycle',
      body: 'Content body',
      createdBy: 'tester',
      updatedBy: 'tester',
    });
    expect(content.id).toBeDefined();
    expect(content.status).toBe('draft');

    // 2. Create initial version
    const v1 = await versioning.createVersion(content, 'tester', 'Initial version');
    expect(v1.version).toBe(1);

    // 3. Update content
    const updated = await repository.update(content.id, {
      title: 'Lifecycle Test Updated',
      body: 'Updated body content',
    });
    expect(updated.title).toBe('Lifecycle Test Updated');
    expect(updated.version).toBe(2);

    // 4. Create second version
    const v2 = await versioning.createVersion(updated, 'tester', 'Updated content');
    expect(v2.version).toBe(2);

    // 5. Publish content
    const publishedState = await publishing.publish(updated.id, 'tester');
    expect(publishedState.status).toBe('published');

    // 6. Verify versions exist
    const versions = await versioning.getContentVersions(content.id);
    expect(versions.total).toBe(2);

    // 7. Compare versions
    const diff = await versioning.compareVersions(v1.id, v2.id);
    expect(diff.changes.length).toBeGreaterThan(0);

    // 8. Archive content
    const archiveEntry = await archives.archive(updated, 'admin', 'Lifecycle complete');
    expect(archiveEntry.contentId).toBe(content.id);

    // 9. Restore from archive
    const restored = await archives.restore(archiveEntry.id);
    expect(restored.id).toBe(content.id);
    expect(restored.title).toBe('Lifecycle Test Updated');

    // 10. Verify final state via repository
    const finalItem = await repository.findById(content.id);
    expect(finalItem).not.toBeNull();
    expect(finalItem!.title).toBe('Lifecycle Test Updated');
    expect(await repository.exists(content.id)).toBe(true);
  });

  it('should handle content with metadata and search', async () => {
    const content = await repository.create({
      slug: 'searchable-content',
      title: 'Searchable Content',
      contentType: 'document',
      status: 'published',
      tags: ['search', 'find-me'],
      categoryIds: [],
      taxonomyIds: [],
      metadata: { priority: 'high' },
      createdBy: 'tester',
      updatedBy: 'tester',
    });

    const searchResult = await repository.search('searchable');
    expect(searchResult.total).toBe(1);

    const publishState = await publishing.publish(content.id, 'tester');
    expect(publishState.status).toBe('published');

    const versions = await versioning.getContentVersions(content.id);
    expect(versions.total).toBe(0);
  });

  it('should handle workflow integration', async () => {
    const content = await repository.create({
      slug: 'workflow-content',
      title: 'Workflow Content',
      contentType: 'article',
      status: 'draft',
      tags: [],
      categoryIds: [],
      taxonomyIds: [],
      metadata: {},
      createdBy: 'author',
      updatedBy: 'author',
    });

    const pubState = await publishing.publish(content.id, 'author');
    expect(pubState.status).toBe('published');

    const archivedState = await publishing.archive(content.id, 'admin', 'No longer needed');
    expect(archivedState.status).toBe('archived');

    const foundPublishing = await publishing.getPublishingState(content.id);
    expect(foundPublishing).not.toBeNull();
    expect(foundPublishing!.status).toBe('archived');
  });
});
