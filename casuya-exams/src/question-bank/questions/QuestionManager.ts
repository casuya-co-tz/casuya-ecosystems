import {
  Question,
  QuestionType,
  DifficultyLevel,
  QuestionFilter,
  PaginatedResult,
} from '../../types';
import { generateId } from '../../utilities/id-generator';
import { shuffle } from '../../utilities/shuffle';
import { validateQuestion } from '../../utilities/validators';
import { TagManager } from '../tags/TagManager';

export class QuestionManager {
  private questions: Map<string, Question>;
  private tagManager: TagManager;

  constructor(tagManager: TagManager) {
    this.questions = new Map();
    this.tagManager = tagManager;
  }

  create(data: Omit<Question, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Question {
    const errors = validateQuestion(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    const question: Question = {
      id: generateId('q'),
      ...data,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.questions.set(question.id, question);

    for (const tagId of question.tags) {
      this.tagManager.incrementUsage(tagId);
    }

    return question;
  }

  update(id: string, data: Partial<Omit<Question, 'id' | 'createdAt'>>): Question | undefined {
    const existing = this.questions.get(id);
    if (!existing) return undefined;

    const oldTags = existing.tags;
    const updated: Question = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1,
    };
    this.questions.set(id, updated);

    if (data.tags) {
      for (const tagId of oldTags) {
        this.tagManager.decrementUsage(tagId);
      }
      for (const tagId of updated.tags) {
        this.tagManager.incrementUsage(tagId);
      }
    }

    return updated;
  }

  delete(id: string): boolean {
    const question = this.questions.get(id);
    if (!question) return false;

    for (const tagId of question.tags) {
      this.tagManager.decrementUsage(tagId);
    }

    return this.questions.delete(id);
  }

  get(id: string): Question | undefined {
    return this.questions.get(id);
  }

  getAll(): Question[] {
    return Array.from(this.questions.values());
  }

  filter(filter: QuestionFilter): PaginatedResult<Question> {
    let results = this.getAll();

    if (filter.type) {
      results = results.filter((q) => q.type === filter.type);
    }
    if (filter.difficulty) {
      results = results.filter((q) => q.difficulty === filter.difficulty);
    }
    if (filter.categoryId) {
      results = results.filter((q) => q.categoryId === filter.categoryId);
    }
    if (filter.tags && filter.tags.length > 0) {
      results = results.filter((q) => filter.tags!.some((t) => q.tags.includes(t)));
    }
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter(
        (q) => q.title.toLowerCase().includes(lower) || q.body.toLowerCase().includes(lower),
      );
    }

    const total = results.length;
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = results.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  }

  getByType(type: QuestionType): Question[] {
    return this.getAll().filter((q) => q.type === type);
  }

  getByDifficulty(difficulty: DifficultyLevel): Question[] {
    return this.getAll().filter((q) => q.difficulty === difficulty);
  }

  getByCategory(categoryId: string): Question[] {
    return this.getAll().filter((q) => q.categoryId === categoryId);
  }

  getByTags(tags: string[]): Question[] {
    return this.getAll().filter((q) => tags.some((t) => q.tags.includes(t)));
  }

  getRandom(
    count: number,
    filter?: { type?: QuestionType; difficulty?: DifficultyLevel },
  ): Question[] {
    let pool = this.getAll();
    if (filter?.type) {
      pool = pool.filter((q) => q.type === filter.type);
    }
    if (filter?.difficulty) {
      pool = pool.filter((q) => q.difficulty === filter.difficulty);
    }
    const shuffled = shuffle(pool);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  clear(): void {
    this.questions.clear();
  }

  get size(): number {
    return this.questions.size;
  }
}
