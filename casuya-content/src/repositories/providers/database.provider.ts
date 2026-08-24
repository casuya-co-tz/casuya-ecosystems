import { IContentRepositoryProvider } from './content-repository-provider.interface';
import {
  ContentItem,
  ContentSummary,
  ContentRepositoryConfig,
  PaginationOptions,
  PaginatedResult,
} from '../../interfaces';
import { NotFoundError } from '../../errors';

export class DatabaseContentRepositoryProvider implements IContentRepositoryProvider {
  public readonly name = 'database';
  private initialized = false;
  private store = new Map<string, ContentItem>();
  private slugIndex = new Map<string, string>();

  async initialize(_config: ContentRepositoryConfig): Promise<void> {
    this.initialized = true;
  }

  async create(item: ContentItem): Promise<ContentItem> {
    this.checkInit();
    const copy = { ...item };
    this.store.set(copy.id, copy);
    this.slugIndex.set(copy.slug, copy.id);
    return copy;
  }

  async findById(id: string): Promise<ContentItem | null> {
    this.checkInit();
    const item = this.store.get(id);
    return item ? { ...item } : null;
  }

  async findBySlug(slug: string): Promise<ContentItem | null> {
    this.checkInit();
    const id = this.slugIndex.get(slug);
    if (!id) return null;
    const item = this.store.get(id);
    return item ? { ...item } : null;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const items = Array.from(this.store.values());
    return this.paginate(items.map(this.toSummary), options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const items = Array.from(this.store.values()).filter((i) => i.status === status);
    return this.paginate(items.map(this.toSummary), options);
  }

  async findByContentType(contentType: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const items = Array.from(this.store.values()).filter((i) => i.contentType === contentType);
    return this.paginate(items.map(this.toSummary), options);
  }

  async findByTags(tags: string[], options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const items = Array.from(this.store.values()).filter((i) =>
      tags.length > 0 && tags.every((t) => i.tags.includes(t))
    );
    return this.paginate(items.map(this.toSummary), options);
  }

  async findByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const items = Array.from(this.store.values()).filter((i) => i.categoryIds.includes(categoryId));
    return this.paginate(items.map(this.toSummary), options);
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.checkInit();
    const q = query.toLowerCase();
    const items = Array.from(this.store.values()).filter((i) => {
      const haystack = `${i.title} ${i.description ?? ''} ${i.body ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
    return this.paginate(items.map(this.toSummary), options);
  }

  async update(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    this.checkInit();
    const existing = this.store.get(id);
    if (!existing) throw new NotFoundError('Content', id);
    if (data.slug && data.slug !== existing.slug) {
      this.slugIndex.delete(existing.slug);
      this.slugIndex.set(data.slug, id);
    }
    const updated = {
      ...existing,
      ...data,
      id,
      version: existing.version + 1,
      updatedAt: new Date(),
    };
    this.store.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    this.checkInit();
    const existing = this.store.get(id);
    if (!existing) return false;
    this.slugIndex.delete(existing.slug);
    this.store.delete(id);
    return true;
  }

  async count(): Promise<number> {
    this.checkInit();
    return this.store.size;
  }

  async exists(id: string): Promise<boolean> {
    this.checkInit();
    return this.store.has(id);
  }

  async dispose(): Promise<void> {
    this.store.clear();
    this.slugIndex.clear();
    this.initialized = false;
  }

  private checkInit(): void {
    if (!this.initialized) throw new Error('Database provider not initialized');
  }

  private toSummary(item: ContentItem): ContentSummary {
    return {
      id: item.id,
      slug: item.slug,
      title: item.title,
      contentType: item.contentType,
      status: item.status,
      version: item.version,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private paginate(items: ContentSummary[], options?: PaginationOptions): PaginatedResult<ContentSummary> {
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    let sorted = items;
    if (options?.sort) {
      const key = options.sort as keyof ContentSummary;
      const order = options.order === 'desc' ? -1 : 1;
      sorted = [...items].sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (av < bv) return -1 * order;
        if (av > bv) return 1 * order;
        return 0;
      });
    }
    const total = sorted.length;
    const sliced = sorted.slice(offset, offset + limit);
    return { items: sliced, total, offset, limit };
  }
}
