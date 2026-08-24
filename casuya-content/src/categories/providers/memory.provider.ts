import { ICategoryProvider } from './category-provider.interface';
import { Category, PaginationOptions, PaginatedResult } from '../../interfaces';
import { NotFoundError, CycleError } from '../../errors';

export class MemoryCategoryProvider implements ICategoryProvider {
  public readonly name = 'memory';
  private categories = new Map<string, Category>();

  async initialize(): Promise<void> {}

  async create(cat: Category): Promise<Category> {
    this.categories.set(cat.id, { ...cat });
    return { ...cat };
  }

  async findById(id: string): Promise<Category | null> {
    const c = this.categories.get(id);
    return c ? { ...c } : null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    for (const c of this.categories.values()) {
      if (c.slug === slug) return { ...c };
    }
    return null;
  }

  async getRootCategories(): Promise<Category[]> {
    return [...this.categories.values()]
      .filter(c => !c.parentId)
      .map(c => ({ ...c }))
      .sort((a, b) => a.order - b.order);
  }

  async getChildren(parentId: string): Promise<Category[]> {
    return [...this.categories.values()]
      .filter(c => c.parentId === parentId)
      .map(c => ({ ...c }))
      .sort((a, b) => a.order - b.order);
  }

  async getAncestors(categoryId: string): Promise<Category[]> {
    if (!this.categories.has(categoryId)) throw new NotFoundError('Category', categoryId);
    const ancestors: Category[] = [];
    let current = this.categories.get(categoryId);
    const visited = new Set<string>();
    while (current && current.parentId) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      const parent = this.categories.get(current.parentId);
      if (parent) {
        ancestors.unshift({ ...parent });
        current = parent;
      } else break;
    }
    return ancestors;
  }

  async getDescendants(categoryId: string): Promise<Category[]> {
    const result: Category[] = [];
    const stack = [categoryId];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const c of this.categories.values()) {
        if (c.parentId === currentId) {
          result.push({ ...c });
          stack.push(c.id);
        }
      }
    }
    return result;
  }

  async getTree(): Promise<Category[]> {
    const visited = new Set<string>();
    const buildTree = (parentId?: string): Category[] => {
      return [...this.categories.values()]
        .filter(c => c.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(c => {
          if (visited.has(c.id)) return { ...c, children: [] };
          visited.add(c.id);
          return {
            ...c,
            children: buildTree(c.id),
          };
        });
    };
    return buildTree();
  }

  async update(id: string, data: Partial<Category>): Promise<Category> {
    const existing = this.categories.get(id);
    if (!existing) throw new NotFoundError('Category', id);
    const updated = { ...existing, ...data, id: existing.id };
    this.categories.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    if (!this.categories.has(id)) return false;
    const stack = [id];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (!this.categories.has(currentId)) continue;
      const children = [...this.categories.values()].filter(c => c.parentId === currentId);
      for (const child of children) {
        stack.push(child.id);
      }
      this.categories.delete(currentId);
    }
    return true;
  }

  async move(id: string, newParentId: string): Promise<void> {
    if (id === newParentId) throw new CycleError('Category', id, newParentId);
    const cat = this.categories.get(id);
    if (!cat) throw new NotFoundError('Category', id);
    if (newParentId && !this.categories.has(newParentId)) throw new NotFoundError('Category', newParentId);
    if (this.isDescendant(id, newParentId)) throw new CycleError('Category', id, newParentId);
    cat.parentId = newParentId;
  }

  async reorder(id: string, newOrder: number): Promise<void> {
    const cat = this.categories.get(id);
    if (!cat) throw new NotFoundError('Category', id);
    cat.order = newOrder;
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<Category>> {
    const lower = query.toLowerCase();
    const matches = [...this.categories.values()].filter(c =>
      c.name.toLowerCase().includes(lower) || (c.description && c.description.toLowerCase().includes(lower))
    );
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    return { items: matches.slice(offset, offset + limit).map(c => ({ ...c })), total: matches.length, offset, limit };
  }

  async count(): Promise<number> { return this.categories.size; }

  async dispose(): Promise<void> { this.categories.clear(); }

  private isDescendant(nodeId: string, targetId: string): boolean {
    const visited = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === targetId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const c of this.categories.values()) {
        if (c.parentId === currentId) {
          stack.push(c.id);
        }
      }
    }
    return false;
  }
}
