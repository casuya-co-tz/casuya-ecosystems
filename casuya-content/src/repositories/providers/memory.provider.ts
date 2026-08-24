import { IContentRepositoryProvider } from './content-repository-provider.interface';
import {
  ContentItem,
  ContentSummary,
  ContentRepositoryConfig,
  PaginationOptions,
  PaginatedResult,
} from '../../interfaces';

export class MemoryContentRepositoryProvider implements IContentRepositoryProvider {
  public readonly name = 'memory';
  private items = new Map<string, ContentItem>();

  async initialize(_config: ContentRepositoryConfig): Promise<void> {
  }

  async create(item: ContentItem): Promise<ContentItem> {
    this.items.set(item.id, { ...item });
    return { ...item };
  }

  async findById(id: string): Promise<ContentItem | null> {
    const item = this.items.get(id);
    return item ? { ...item } : null;
  }

  async findBySlug(slug: string): Promise<ContentItem | null> {
    for (const item of this.items.values()) {
      if (item.slug === slug) return { ...item };
    }
    return null;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    return this.toPaginatedSummary([...this.items.values()], options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    const filtered = [...this.items.values()].filter(i => i.status === status);
    return this.toPaginatedSummary(filtered, options);
  }

  async findByContentType(contentType: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    const filtered = [...this.items.values()].filter(i => i.contentType === contentType);
    return this.toPaginatedSummary(filtered, options);
  }

  async findByTags(tags: string[], options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    if (!tags || tags.length === 0) return { items: [], total: 0, offset: options?.offset ?? 0, limit: options?.limit ?? 50 };
    const tagSet = new Set(tags);
    const filtered = [...this.items.values()].filter(i => i.tags.some(t => tagSet.has(t)));
    return this.toPaginatedSummary(filtered, options);
  }

  async findByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    const filtered = [...this.items.values()].filter(i => i.categoryIds.includes(categoryId));
    return this.toPaginatedSummary(filtered, options);
  }

  async update(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    const existing = this.items.get(id);
    if (!existing) throw new Error(`Content ${id} not found`);
    const updated: ContentItem = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1,
    };
    this.items.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    return this.items.delete(id);
  }

  async count(): Promise<number> {
    return this.items.size;
  }

  async exists(id: string): Promise<boolean> {
    return this.items.has(id);
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    const lower = query.toLowerCase();
    const filtered = [...this.items.values()].filter(i =>
      i.title.toLowerCase().includes(lower) ||
      (i.description && i.description.toLowerCase().includes(lower)) ||
      i.tags.some(t => t.toLowerCase().includes(lower))
    );
    return this.toPaginatedSummary(filtered, options);
  }

  async dispose(): Promise<void> {
    this.items.clear();
  }

  private toPaginatedSummary(items: ContentItem[], options?: PaginationOptions): PaginatedResult<ContentSummary> {
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    const sorted = this.sortItems(items, options?.sort, options?.order);
    const page = sorted.slice(offset, offset + limit);
    return {
      items: page.map(this.toSummary),
      total: items.length,
      offset,
      limit,
    };
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

  private sortItems(items: ContentItem[], sort?: string, order?: 'asc' | 'desc'): ContentItem[] {
    const sorted = [...items];
    const effectiveSort = sort || 'createdAt';
    const effectiveOrder = order || 'desc';
    const dir = effectiveOrder === 'desc' ? -1 : 1;
    sorted.sort((a, b) => {
      switch (effectiveSort) {
        case 'title': return a.title.localeCompare(b.title) * dir;
        case 'createdAt': return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
        case 'updatedAt': return (a.updatedAt.getTime() - b.updatedAt.getTime()) * dir;
        default: return (a.createdAt.getTime() - b.createdAt.getTime()) * dir;
      }
    });
    return sorted;
  }
}
