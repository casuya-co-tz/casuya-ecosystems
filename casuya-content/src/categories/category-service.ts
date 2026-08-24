import { v4 as uuidv4 } from 'uuid';
import { ICategoryService, Category, PaginationOptions, PaginatedResult } from '../interfaces';
import { ICategoryProvider } from './providers/category-provider.interface';

export class CategoryService implements ICategoryService {
  public readonly name: string;
  private provider: ICategoryProvider;
  private initialized = false;

  constructor(provider: ICategoryProvider) {
    this.name = `category-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('CategoryService not initialized');
  }

  async create(category: Omit<Category, 'id'>): Promise<Category> {
    this.check();
    const newCat: Category = { ...category, id: uuidv4() };
    return this.provider.create(newCat);
  }

  async findById(id: string): Promise<Category | null> { this.check(); return this.provider.findById(id); }
  async findBySlug(slug: string): Promise<Category | null> { this.check(); return this.provider.findBySlug(slug); }
  async getRootCategories(): Promise<Category[]> { this.check(); return this.provider.getRootCategories(); }
  async getChildren(parentId: string): Promise<Category[]> { this.check(); return this.provider.getChildren(parentId); }
  async getAncestors(categoryId: string): Promise<Category[]> { this.check(); return this.provider.getAncestors(categoryId); }
  async getDescendants(categoryId: string): Promise<Category[]> { this.check(); return this.provider.getDescendants(categoryId); }
  async getTree(): Promise<Category[]> { this.check(); return this.provider.getTree(); }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    this.check();
    return this.provider.update(id, data);
  }

  async delete(id: string): Promise<boolean> { this.check(); return this.provider.delete(id); }
  async move(id: string, newParentId: string): Promise<void> { this.check(); return this.provider.move(id, newParentId); }
  async reorder(id: string, newOrder: number): Promise<void> { this.check(); return this.provider.reorder(id, newOrder); }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Category>> {
    this.check();
    return this.provider.search(query, options);
  }

  async count(): Promise<number> { this.check(); return this.provider.count(); }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
