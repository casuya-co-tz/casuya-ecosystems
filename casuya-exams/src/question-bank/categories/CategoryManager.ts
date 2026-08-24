import { QuestionCategory } from '../../types';
import { generateId } from '../../utilities/id-generator';

export class CategoryManager {
  private categories: Map<string, QuestionCategory>;

  constructor() {
    this.categories = new Map();
  }

  create(data: Omit<QuestionCategory, 'id' | 'createdAt' | 'updatedAt'>): QuestionCategory {
    const category: QuestionCategory = {
      id: generateId('cat'),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.categories.set(category.id, category);
    return category;
  }

  update(
    id: string,
    data: Partial<Omit<QuestionCategory, 'id' | 'createdAt'>>,
  ): QuestionCategory | undefined {
    const existing = this.categories.get(id);
    if (!existing) return undefined;

    const updated: QuestionCategory = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
    };
    this.categories.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.categories.delete(id);
  }

  get(id: string): QuestionCategory | undefined {
    return this.categories.get(id);
  }

  getAll(): QuestionCategory[] {
    return Array.from(this.categories.values());
  }

  getChildren(parentId: string): QuestionCategory[] {
    return this.getAll().filter((c) => c.parentId === parentId);
  }

  getRootCategories(): QuestionCategory[] {
    return this.getAll().filter((c) => !c.parentId);
  }

  getPath(id: string): QuestionCategory[] {
    const path: QuestionCategory[] = [];
    let current = this.categories.get(id);
    while (current) {
      path.unshift(current);
      current = current.parentId ? this.categories.get(current.parentId) : undefined;
    }
    return path;
  }

  search(query: string): QuestionCategory[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      (c) => c.name.toLowerCase().includes(lower) || c.description.toLowerCase().includes(lower),
    );
  }

  clear(): void {
    this.categories.clear();
  }

  get size(): number {
    return this.categories.size;
  }
}
