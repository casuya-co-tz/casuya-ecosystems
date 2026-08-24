import { ITagProvider } from './tag-provider.interface';
import { Tag, PaginationOptions, PaginatedResult } from '../../interfaces';
import { NotFoundError } from '../../errors';

export class MemoryTagProvider implements ITagProvider {
  public readonly name = 'memory';
  private tags = new Map<string, Tag>();

  async initialize(): Promise<void> {}

  async create(tag: Tag): Promise<Tag> {
    this.tags.set(tag.id, { ...tag });
    return { ...tag };
  }

  async findById(id: string): Promise<Tag | null> {
    const t = this.tags.get(id);
    return t ? { ...t } : null;
  }

  async findBySlug(slug: string): Promise<Tag | null> {
    for (const t of this.tags.values()) {
      if (t.slug === slug) return { ...t };
    }
    return null;
  }

  async findByName(name: string): Promise<Tag | null> {
    for (const t of this.tags.values()) {
      if (t.name === name) return { ...t };
    }
    return null;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Tag>> {
    const all = [...this.tags.values()];
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return {
      items: all.slice(offset, offset + limit).map(t => ({ ...t })),
      total: all.length,
      offset,
      limit,
    };
  }

  async update(id: string, data: Partial<Tag>): Promise<Tag> {
    const existing = this.tags.get(id);
    if (!existing) throw new NotFoundError('Tag', id);
    const { usageCount: _uc, id: _id, ...safeData } = data;
    const updated = { ...existing, ...safeData, id: existing.id };
    this.tags.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> { return this.tags.delete(id); }

  async getPopularTags(limit = 10): Promise<Tag[]> {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    return [...this.tags.values()]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, safeLimit)
      .map(t => ({ ...t }));
  }

  async suggest(prefix: string, limit = 5): Promise<Tag[]> {
    const lower = prefix.toLowerCase();
    return [...this.tags.values()]
      .filter(t => t.name.toLowerCase().startsWith(lower))
      .slice(0, limit)
      .map(t => ({ ...t }));
  }

  async incrementUsage(id: string): Promise<void> {
    const tag = this.tags.get(id);
    if (tag) tag.usageCount++;
  }

  async decrementUsage(id: string): Promise<void> {
    const tag = this.tags.get(id);
    if (tag && tag.usageCount > 0) tag.usageCount--;
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Tag>> {
    const lower = query.toLowerCase();
    const matches = [...this.tags.values()].filter(t =>
      t.name.toLowerCase().includes(lower) || (t.description && t.description.toLowerCase().includes(lower))
    );
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 50;
    return { items: matches.slice(offset, offset + limit).map(t => ({ ...t })), total: matches.length, offset, limit };
  }

  async count(): Promise<number> { return this.tags.size; }

  async dispose(): Promise<void> { this.tags.clear(); }
}
