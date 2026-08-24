import {
  ContentRepository,
  MemoryContentRepositoryProvider,
  CategoryService,
  MemoryCategoryProvider,
  TagService,
  MemoryTagProvider,
  PublishingService,
  MemoryPublishingProvider,
  SearchAdapter,
  MemorySearchProvider,
  ProviderConfig,
} from '@casuya/content';

const repoProvider = new MemoryContentRepositoryProvider();
const repo = new ContentRepository(repoProvider);
const categoryService = new CategoryService(new MemoryCategoryProvider());
const tagService = new TagService(new MemoryTagProvider());
const publishingService = new PublishingService(new MemoryPublishingProvider());
const searchAdapter = new SearchAdapter(new MemorySearchProvider());

export async function initContent() {
  await repo.initialize({ provider: { name: 'memory', enabled: true, options: {} } } as Parameters<typeof repo.initialize>[0]);
  await categoryService.initialize();
  await tagService.initialize();
  await publishingService.initialize();
  await searchAdapter.initialize();
}

const memProvider = (name: string): ProviderConfig => ({ name, enabled: true, options: {} });

export const content = {
  async create(body: Record<string, unknown>) {
    return repo.create(body as Parameters<typeof repo.create>[0]);
  },
  async get(id: string) {
    return repo.findById(id);
  },
  async getBySlug(slug: string) {
    return repo.findBySlug(slug);
  },
  async list(query: Record<string, unknown> = {}) {
    if (query.status) return repo.findByStatus(query.status as string, query as unknown as Parameters<typeof repo.findByStatus>[1]);
    if (query.contentType) return repo.findByContentType(query.contentType as string, query as unknown as Parameters<typeof repo.findByContentType>[1]);
    if (query.tags) return repo.findByTags(query.tags as string[], query as unknown as Parameters<typeof repo.findByTags>[1]);
    if (query.categoryId) return repo.findByCategory(query.categoryId as string, query as unknown as Parameters<typeof repo.findByCategory>[1]);
    return repo.findAll(query as unknown as Parameters<typeof repo.findAll>[0]);
  },
  async update(id: string, data: Record<string, unknown>) {
    return repo.update(id, data as unknown as Parameters<typeof repo.update>[1]);
  },
  async remove(id: string) {
    return repo.delete(id);
  },
  async categories(action: string, body: Record<string, unknown>, id?: string) {
    switch (action) {
      case 'create': return categoryService.create(body as Parameters<typeof categoryService.create>[0]);
      case 'get': return categoryService.findById(id!);
      case 'bySlug': return categoryService.findBySlug(body.slug as string);
      case 'list': return categoryService.getRootCategories();
      case 'children': return categoryService.getChildren(id!);
      case 'descendants': return categoryService.getDescendants(id!);
      case 'update': return categoryService.update(id!, body as Parameters<typeof categoryService.update>[1]);
      case 'delete': return categoryService.delete(id!);
      case 'search': return categoryService.search(body.query as string, body as unknown as Parameters<typeof categoryService.search>[1]);
      default: throw new Error(`Unknown category action: ${action}`);
    }
  },
  async tags(action: string, body: Record<string, unknown>, id?: string) {
    switch (action) {
      case 'create': return tagService.create(body as Parameters<typeof tagService.create>[0]);
      case 'get': return tagService.findById(id!);
      case 'byName': return tagService.findByName(body.name as string);
      case 'list': return tagService.findAll(body as unknown as Parameters<typeof tagService.findAll>[0]);
      case 'popular': return tagService.getPopularTags(body.limit as number | undefined);
      case 'update': return tagService.update(id!, body as Parameters<typeof tagService.update>[1]);
      case 'delete': return tagService.delete(id!);
      default: throw new Error(`Unknown tag action: ${action}`);
    }
  },
  async publish(action: string, body: Record<string, unknown>, id?: string) {
    switch (action) {
      case 'publish': return publishingService.publish(id!, body.publishedBy as string, body.notes as string | undefined);
      case 'unpublish': return publishingService.unpublish(id!, body.notes as string | undefined);
      case 'schedule': return publishingService.schedule(id!, new Date(body.scheduledAt as string | number), body.scheduledBy as string);
      case 'cancel': return publishingService.cancelScheduling(id!);
      case 'state': return publishingService.getPublishingState(id!);
      case 'archive': return publishingService.archive(id!, body.archivedBy as string, body.reason as string | undefined);
      default: throw new Error(`Unknown publish action: ${action}`);
    }
  },
  async search(body: Record<string, unknown>) {
    return searchAdapter.search(body as unknown as Parameters<typeof searchAdapter.search>[0]);
  },
  async indexSearch(item: Record<string, unknown>) {
    searchAdapter.index(item as unknown as Parameters<typeof searchAdapter.index>[0]);
    return { ok: true };
  },
  async searchStats() {
    return searchAdapter.getIndexStats();
  },
};
