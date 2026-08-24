import type { Exam, Question } from 'casuya-exams';

/**
 * In-memory repository for exams and questions used by the blackboard exam
 * flow. The API gateway has no persistent datastore of its own; this keeps
 * blackboard exams available for the lifetime of the process and is replaced
 * by a real store (postgres/redis) in production.
 */
class ExamRepository {
  private exams = new Map<string, Exam>();
  private questions = new Map<string, Question>();

  addExam(exam: Exam): void {
    this.exams.set(exam.id, exam);
  }

  getExam(id: string): Exam | undefined {
    return this.exams.get(id);
  }

  listExams(): Exam[] {
    return [...this.exams.values()];
  }

  addQuestion(question: Question): void {
    this.questions.set(question.id, question);
  }

  getQuestion(id: string): Question | undefined {
    return this.questions.get(id);
  }

  listQuestions(): Question[] {
    return [...this.questions.values()];
  }

  /** Resolve every question referenced by an exam's sections. */
  getExamQuestions(examId: string): Question[] {
    const exam = this.exams.get(examId);
    if (!exam) return [];
    const ids = exam.sections.flatMap((s) => s.questionIds);
    return ids.map((id) => this.questions.get(id)).filter((q): q is Question => Boolean(q));
  }

  clear(): void {
    this.exams.clear();
    this.questions.clear();
  }
}

export const examRepository = new ExamRepository();
