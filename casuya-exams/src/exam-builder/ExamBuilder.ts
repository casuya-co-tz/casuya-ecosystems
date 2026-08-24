import {
  Exam,
  ExamSection,
  DifficultyLevel,
  QuestionType,
  ExamFilter,
  PaginatedResult,
} from '../types';
import { generateId } from '../utilities/id-generator';
import { validateExam } from '../utilities/validators';
import { QuestionManager } from '../question-bank/questions/QuestionManager';

export interface ExamBuildConfig {
  title: string;
  description: string;
  timeLimit: number;
  passingScore: number;
  maxAttempts?: number;
  showResults?: boolean;
  randomizeSections?: boolean;
}

export interface SectionBuildConfig {
  title: string;
  instructions?: string;
  randomizeOrder?: boolean;
  timeLimit?: number;
  pointsPerQuestion?: number;
}

export interface QuestionSelectionCriteria {
  count: number;
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  tags?: string[];
}

export class ExamBuilder {
  private exams: Map<string, Exam>;
  private questionManager: QuestionManager;

  constructor(questionManager: QuestionManager) {
    this.exams = new Map();
    this.questionManager = questionManager;
  }

  create(config: ExamBuildConfig): Exam {
    const partial: Partial<Exam> = {
      title: config.title,
      description: config.description,
      timeLimit: config.timeLimit,
      passingScore: config.passingScore,
    };
    const errors = validateExam(partial);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    const exam: Exam = {
      id: generateId('exam'),
      title: config.title,
      description: config.description,
      status: 'draft',
      sections: [],
      timeLimit: config.timeLimit,
      passingScore: config.passingScore,
      maxAttempts: config.maxAttempts ?? 1,
      randomizeSections: config.randomizeSections ?? false,
      showResults: config.showResults ?? true,
      metadata: {},
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.exams.set(exam.id, exam);
    return exam;
  }

  addSection(examId: string, config: SectionBuildConfig): ExamSection | undefined {
    const exam = this.exams.get(examId);
    if (!exam) return undefined;

    const section: ExamSection = {
      id: generateId('sec'),
      title: config.title,
      instructions: config.instructions ?? '',
      questionIds: [],
      randomizeOrder: config.randomizeOrder ?? false,
      timeLimit: config.timeLimit,
      pointsPerQuestion: config.pointsPerQuestion ?? 1,
    };

    exam.sections.push(section);
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(examId, exam);
    return section;
  }

  addQuestionsToSection(examId: string, sectionId: string, questionIds: string[]): boolean {
    const exam = this.exams.get(examId);
    if (!exam) return false;

    const section = exam.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const validIds = questionIds.filter((id) => this.questionManager.get(id));
    section.questionIds.push(...validIds);
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(examId, exam);
    return true;
  }

  autoFillSection(examId: string, sectionId: string, criteria: QuestionSelectionCriteria): number {
    const exam = this.exams.get(examId);
    if (!exam) return 0;

    const section = exam.sections.find((s) => s.id === sectionId);
    if (!section) return 0;

    const questions = this.questionManager.getRandom(criteria.count, {
      type: criteria.type,
      difficulty: criteria.difficulty,
    });

    const ids = questions.map((q) => q.id);
    section.questionIds.push(...ids);
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(examId, exam);
    return ids.length;
  }

  removeSection(examId: string, sectionId: string): boolean {
    const exam = this.exams.get(examId);
    if (!exam) return false;

    const index = exam.sections.findIndex((s) => s.id === sectionId);
    if (index === -1) return false;

    exam.sections.splice(index, 1);
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(examId, exam);
    return true;
  }

  removeQuestionFromSection(examId: string, sectionId: string, questionId: string): boolean {
    const exam = this.exams.get(examId);
    if (!exam) return false;

    const section = exam.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    const index = section.questionIds.indexOf(questionId);
    if (index === -1) return false;

    section.questionIds.splice(index, 1);
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(examId, exam);
    return true;
  }

  publish(id: string): boolean {
    const exam = this.exams.get(id);
    if (!exam || exam.sections.length === 0) return false;

    const hasQuestions = exam.sections.some((s) => s.questionIds.length > 0);
    if (!hasQuestions) return false;

    exam.status = 'published';
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(id, exam);
    return true;
  }

  archive(id: string): boolean {
    const exam = this.exams.get(id);
    if (!exam) return false;

    exam.status = 'archived';
    exam.updatedAt = new Date();
    exam.version++;
    this.exams.set(id, exam);
    return true;
  }

  get(id: string): Exam | undefined {
    return this.exams.get(id);
  }

  getAll(): Exam[] {
    return Array.from(this.exams.values());
  }

  filter(filter: ExamFilter): PaginatedResult<Exam> {
    let results = this.getAll();

    if (filter.status) {
      results = results.filter((e) => e.status === filter.status);
    }
    if (filter.search) {
      const lower = filter.search.toLowerCase();
      results = results.filter(
        (e) => e.title.toLowerCase().includes(lower) || e.description.toLowerCase().includes(lower),
      );
    }

    const total = results.length;
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const items = results.slice(start, start + limit);

    return { items, total, page, limit, totalPages };
  }

  getTotalPoints(examId: string): number {
    const exam = this.exams.get(examId);
    if (!exam) return 0;

    let total = 0;
    for (const section of exam.sections) {
      for (const questionId of section.questionIds) {
        const question = this.questionManager.get(questionId);
        if (question) {
          total += question.points;
        }
      }
    }
    return total;
  }

  getTotalQuestions(examId: string): number {
    const exam = this.exams.get(examId);
    if (!exam) return 0;

    return exam.sections.reduce((total, section) => total + section.questionIds.length, 0);
  }

  clear(): void {
    this.exams.clear();
  }

  get size(): number {
    return this.exams.size;
  }
}
