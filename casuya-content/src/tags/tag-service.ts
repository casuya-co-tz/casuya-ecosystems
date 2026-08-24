import { v4 as uuidv4 } from 'uuid';
import { ITagService, Tag, PaginationOptions, PaginatedResult } from '../interfaces';
import { ITagProvider } from './providers/tag-provider.interface';

export class TagService implements ITagService {
  public readonly name: string;
  private provider: ITagProvider;
  private initialized = false;

  constructor(provider: ITagProvider) {
    this.name = `tag-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('TagService not initialized');
  }

  async create(tag: Omit<Tag, 'id' | 'usageCount'>): Promise<Tag> {
    this.check();
    const newTag: Tag = { ...tag, id: uuidv4(), usageCount: 0 };
    return this.provider.create(newTag);
  }

  async findById(id: string): Promise<Tag | null> { this.check(); return this.provider.findById(id); }
  async findBySlug(slug: string): Promise<Tag | null> { this.check(); return this.provider.findBySlug(slug); }
  async findByName(name: string): Promise<Tag | null> { this.check(); return this.provider.findByName(name); }
  async findAll(options?: PaginationOptions): Promise<PaginatedResult<Tag>> { this.check(); return this.provider.findAll(options); }

  async update(id: string, data: Partial<Tag>): Promise<Tag> {
    this.check();
    return this.provider.update(id, data);
  }

  async delete(id: string): Promise<boolean> { this.check(); return this.provider.delete(id); }

  async getPopularTags(limit?: number): Promise<Tag[]> {
    this.check();
    return this.provider.getPopularTags(limit);
  }

  async suggest(prefix: string, limit?: number): Promise<Tag[]> {
    this.check();
    return this.provider.suggest(prefix, limit);
  }

  async incrementUsage(id: string): Promise<void> { this.check(); return this.provider.incrementUsage(id); }
  async decrementUsage(id: string): Promise<void> { this.check(); return this.provider.decrementUsage(id); }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Tag>> {
    this.check();
    return this.provider.search(query, options);
  }

  async count(): Promise<number> { this.check(); return this.provider.count(); }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
