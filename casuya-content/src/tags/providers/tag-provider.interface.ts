import { Tag, PaginationOptions, PaginatedResult } from '../../interfaces';

export interface ITagProvider {
  readonly name: string;
  initialize(): Promise<void>;
  create(tag: Tag): Promise<Tag>;
  findById(id: string): Promise<Tag | null>;
  findBySlug(slug: string): Promise<Tag | null>;
  findByName(name: string): Promise<Tag | null>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<Tag>>;
  update(id: string, data: Partial<Tag>): Promise<Tag>;
  delete(id: string): Promise<boolean>;
  getPopularTags(limit?: number): Promise<Tag[]>;
  suggest(prefix: string, limit?: number): Promise<Tag[]>;
  incrementUsage(id: string): Promise<void>;
  decrementUsage(id: string): Promise<void>;
  search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Tag>>;
  count(): Promise<number>;
  dispose(): Promise<void>;
}
