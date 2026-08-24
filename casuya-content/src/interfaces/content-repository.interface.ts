import {
  ContentItem,
  ContentSummary,
  ContentRepositoryConfig,
  PaginationOptions,
  PaginatedResult,
} from './types';

export interface IContentRepository {
  readonly name: string;
  initialize(config: ContentRepositoryConfig): Promise<void>;
  create(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ContentItem>;
  findById(id: string): Promise<ContentItem | null>;
  findBySlug(slug: string): Promise<ContentItem | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  findByStatus(status: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  findByContentType(contentType: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  findByTags(tags: string[], options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  findByCategory(categoryId: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  update(id: string, data: Partial<ContentItem>): Promise<ContentItem>;
  delete(id: string): Promise<boolean>;
  count(): Promise<number>;
  exists(id: string): Promise<boolean>;
  search(query: string, options?: PaginationOptions): Promise<PaginatedResult<ContentSummary>>;
  dispose(): Promise<void>;
}
