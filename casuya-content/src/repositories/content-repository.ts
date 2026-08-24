import { v4 as uuidv4 } from 'uuid';
import {
  IContentRepository,
  ContentItem,
  ContentSummary,
  ContentRepositoryConfig,
  PaginationOptions,
  PaginatedResult,
} from '../interfaces';
import { IContentRepositoryProvider } from './providers/content-repository-provider.interface';
import { ValidationError } from '../errors';

export class ContentRepository implements IContentRepository {
  public readonly name: string;
  private provider: IContentRepositoryProvider;
  private initialized = false;

  constructor(provider: IContentRepositoryProvider) {
    this.name = `content-repository-${provider.name}`;
    this.provider = provider;
  }

  async initialize(config: ContentRepositoryConfig): Promise<void> {
    await this.provider.initialize(config);
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) throw new Error('ContentRepository not initialized');
  }

  async create(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ContentItem> {
    this.ensureInitialized();
    if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
      throw new ValidationError('title is required and must be a non-empty string', { field: 'title' });
    }
    if (!item.slug || typeof item.slug !== 'string' || item.slug.trim().length === 0) {
      throw new ValidationError('slug is required and must be a non-empty string', { field: 'slug' });
    }
    if (!item.contentType || typeof item.contentType !== 'string' || item.contentType.trim().length === 0) {
      throw new ValidationError('contentType is required and must be a non-empty string', { field: 'contentType' });
    }
    if (!item.createdBy || typeof item.createdBy !== 'string') {
      throw new ValidationError('createdBy is required', { field: 'createdBy' });
    }
    const now = new Date();
    const newItem: ContentItem = {
      ...item,
      id: uuidv4(),
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
    return this.provider.create(newItem);
  }

  async findById(id: string): Promise<ContentItem | null> {
    this.ensureInitialized();
    return this.provider.findById(id);
  }

  async findBySlug(slug: string): Promise<ContentItem | null> {
    this.ensureInitialized();
    return this.provider.findBySlug(slug);
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.findAll(options);
  }

  async findByStatus(status: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.findByStatus(status, options);
  }

  async findByContentType(contentType: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.findByContentType(contentType, options);
  }

  async findByTags(tags: string[], options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.findByTags(tags, options);
  }

  async findByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.findByCategory(categoryId, options);
  }

  async update(id: string, data: Partial<ContentItem>): Promise<ContentItem> {
    this.ensureInitialized();
    const { id: _, createdAt: _c, version: _v, ...safeData } = data;
    void _; void _c; void _v;
    return this.provider.update(id, safeData);
  }

  async delete(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.provider.delete(id);
  }

  async count(): Promise<number> {
    this.ensureInitialized();
    return this.provider.count();
  }

  async exists(id: string): Promise<boolean> {
    this.ensureInitialized();
    return this.provider.exists(id);
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>> {
    this.ensureInitialized();
    return this.provider.search(query, options);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
