import * as fs from 'fs';
import * as path from 'path';
import { IContentRepositoryProvider } from './content-repository-provider.interface';
import {
  ContentItem,
  ContentSummary,
  ContentRepositoryConfig,
  PaginationOptions,
  PaginatedResult,
} from '../../interfaces';

export class FileSystemContentRepositoryProvider implements IContentRepositoryProvider {
  public readonly name = 'filesystem';
  private basePath = '';

  async initialize(config: ContentRepositoryConfig): Promise<void> {
    this.basePath = (config?.provider?.options?.basePath as string) || './data/content';
    await fs.promises.mkdir(this.basePath, { recursive: true });
  }

  private getItemPath(id: string): string {
    return path.join(this.basePath, `${id}.json`);
  }

  async create(item: ContentItem): Promise<ContentItem> {
    await fs.promises.writeFile(this.getItemPath(item.id), JSON.stringify(item, null, 2));
    return { ...item };
  }

  async findById(id: string): Promise<ContentItem | null> {
    const filePath = this.getItemPath(id);
    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async findBySlug(slug: string): Promise<ContentItem | null> {
    const files = await fs.promises.readdir(this.basePath);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.promises.readFile(path.join(this.basePath, file), 'utf-8');
        const item: ContentItem = JSON.parse(content);
        if (item.slug === slug) return item;
      } catch {
        continue;
      }
    }
    return null;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    return this.query(items => items, options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    return this.query(items => items.filter(i => i.status === status), options);
  }

  async findByContentType(contentType: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    return this.query(items => items.filter(i => i.contentType === contentType), options);
  }

  async findByTags(tags: string[], options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    if (!tags || tags.length === 0) return { items: [], total: 0, offset: options?.offset ?? 0, limit: options?.limit ?? 50 };
    const tagSet = new Set(tags);
    return this.query(items => items.filter(i => i.tags.some(t => tagSet.has(t))), options);
  }

  async findByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    return this.query(items => items.filter(i => i.categoryIds.includes(categoryId)), options);
  }

  async update(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    const existing = await this.findById(id);
    if (!existing) throw new Error(`Content ${id} not found`);
    const updated: ContentItem = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1,
    };
    await fs.promises.writeFile(this.getItemPath(id), JSON.stringify(updated, null, 2));
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    const filePath = this.getItemPath(id);
    try {
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async count(): Promise<number> {
    const files = await fs.promises.readdir(this.basePath);
    return files.filter(f => f.endsWith('.json')).length;
  }

  async exists(id: string): Promise<boolean> {
    const filePath = this.getItemPath(id);
    try {
      await fs.promises.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    const lower = query.toLowerCase();
    return this.query(
      items => items.filter(i =>
        i.title.toLowerCase().includes(lower) ||
        (i.description && i.description.toLowerCase().includes(lower)) ||
        i.tags.some(t => t.toLowerCase().includes(lower))
      ),
      options
    );
  }

  async dispose(): Promise<void> {
  }

  private async query(
    filter: (items: ContentItem[]) => ContentItem[],
    options?: PaginationOptions
  ): Promise<PaginatedResult<ContentSummary>> {
    const allItems = await this.loadAll();
    const filtered = filter(allItems);
    return this.toPaginatedSummary(filtered, options);
  }

  private async loadAll(): Promise<ContentItem[]> {
    const files = await fs.promises.readdir(this.basePath);
    const items: ContentItem[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.promises.readFile(path.join(this.basePath, file), 'utf-8');
        items.push(JSON.parse(content));
      } catch {
        continue;
      }
    }
    return items;
  }

  private toPaginatedSummary(items: ContentItem[], options?: PaginationOptions): PaginatedResult<ContentSummary> {
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    const page = items.slice(offset, offset + limit);
    return {
      items: page.map(i => ({
        id: i.id,
        slug: i.slug,
        title: i.title,
        contentType: i.contentType,
        status: i.status,
        version: i.version,
        createdAt: i.createdAt,
        updatedAt: i.updatedAt,
      })),
      total: items.length,
      offset,
      limit,
    };
  }
}
