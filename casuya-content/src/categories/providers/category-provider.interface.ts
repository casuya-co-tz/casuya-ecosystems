import { Category, PaginationOptions, PaginatedResult } from '../../interfaces';

export interface ICategoryProvider {
  readonly name: string;
  initialize(): Promise<void>;
  create(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findBySlug(slug: string): Promise<Category | null>;
  getRootCategories(): Promise<Category[]>;
  getChildren(parentId: string): Promise<Category[]>;
  getAncestors(categoryId: string): Promise<Category[]>;
  getDescendants(categoryId: string): Promise<Category[]>;
  getTree(): Promise<Category[]>;
  update(id: string, data: Partial<Category>): Promise<Category>;
  delete(id: string): Promise<boolean>;
  move(id: string, newParentId: string): Promise<void>;
  reorder(id: string, newOrder: number): Promise<void>;
  search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Category>>;
  count(): Promise<number>;
  dispose(): Promise<void>;
}
