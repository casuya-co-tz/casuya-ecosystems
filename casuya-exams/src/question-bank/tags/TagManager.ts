import { QuestionTag } from '../../types';
import { generateId } from '../../utilities/id-generator';

export class TagManager {
  private tags: Map<string, QuestionTag>;
  private usageCount: Map<string, number>;

  constructor() {
    this.tags = new Map();
    this.usageCount = new Map();
  }

  create(name: string): QuestionTag {
    const normalized = name.toLowerCase().trim();
    const existing = this.findByName(normalized);
    if (existing) return existing;

    const tag: QuestionTag = {
      id: generateId('tag'),
      name: normalized,
      createdAt: new Date(),
    };
    this.tags.set(tag.id, tag);
    return tag;
  }

  delete(id: string): boolean {
    const deleted = this.tags.delete(id);
    this.usageCount.delete(id);
    return deleted;
  }

  get(id: string): QuestionTag | undefined {
    return this.tags.get(id);
  }

  getAll(): QuestionTag[] {
    return Array.from(this.tags.values());
  }

  findByName(name: string): QuestionTag | undefined {
    const normalized = name.toLowerCase().trim();
    return this.getAll().find((t) => t.name === normalized);
  }

  incrementUsage(tagId: string): void {
    const current = this.usageCount.get(tagId) || 0;
    this.usageCount.set(tagId, current + 1);
  }

  decrementUsage(tagId: string): void {
    const current = this.usageCount.get(tagId) || 0;
    if (current <= 1) {
      this.usageCount.delete(tagId);
    } else {
      this.usageCount.set(tagId, current - 1);
    }
  }

  getUsageCount(tagId: string): number {
    return this.usageCount.get(tagId) || 0;
  }

  getPopularTags(limit = 10): QuestionTag[] {
    return this.getAll()
      .filter((t) => this.usageCount.has(t.id))
      .sort((a, b) => (this.usageCount.get(b.id) || 0) - (this.usageCount.get(a.id) || 0))
      .slice(0, limit);
  }

  suggest(partial: string, limit = 5): QuestionTag[] {
    const lower = partial.toLowerCase().trim();
    if (!lower) return [];
    return this.getAll()
      .filter((t) => t.name.includes(lower))
      .slice(0, limit);
  }

  clear(): void {
    this.tags.clear();
    this.usageCount.clear();
  }

  get size(): number {
    return this.tags.size;
  }
}
