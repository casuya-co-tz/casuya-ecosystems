import { GradingEngine } from 'casuya-exams';
import type { Question, Answer, GradingResult } from 'casuya-exams';
import { examRepository } from './exam-repository';

export interface StepValidationInput {
  stepNumber: number;
  recognizedLatex?: string;
  expectedAnswer?: string;
  elements?: unknown[];
}

export interface StepValidationOutput {
  stepNumber: number;
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  recognizedLatex?: string;
}

export interface StructuredExamInput {
  examId: string;
  studentId: string;
  answers: Array<{ questionId: string; value: string | string[] }>;
}

export interface StructuredExamOutput {
  examId: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  results: StepValidationOutput[];
}

/**
 * Wraps the `casuya-exams` GradingEngine to grade blackboard steps and full
 * exams. Falls back to normalized comparison if the package is unavailable or
 * the exam is not found in the repository.
 */
export class ExamsService {
  private GradingEngineCtor: any = null;
  private loaded = false;

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    try {
      this.GradingEngineCtor = GradingEngine;
    } catch {
      this.GradingEngineCtor = null;
    }
    this.loaded = true;
  }

  private getEngine(): any {
    if (!this.GradingEngineCtor) return null;
    // gradeQuestion only needs the registered strategies; managers are unused.
    return new this.GradingEngineCtor({}, {});
  }

  async validateStep(input: StepValidationInput): Promise<StepValidationOutput> {
    await this.ensureLoaded();
    const engine = this.getEngine();
    if (!engine) return this.localValidate(input);

    try {
      const normalized = (s: string) => (s || '').replace(/\s+/g, '').toLowerCase();
      const question: Question = {
        id: `step-${input.stepNumber}`,
        type: 'short-answer',
        title: `Step ${input.stepNumber}`,
        body: normalized(input.expectedAnswer || ''),
        correctAnswer: normalized(input.expectedAnswer || ''),
        points: 1,
        difficulty: 'easy',
        categoryId: 'blackboard',
        tags: ['blackboard-step'],
        metadata: {},
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const answer: Answer = {
        questionId: question.id,
        value: normalized(input.recognizedLatex || ''),
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const result: GradingResult = engine.gradeQuestion(question, answer);
      return {
        stepNumber: input.stepNumber,
        correct: result.isCorrect,
        score: result.pointsAwarded,
        maxScore: result.pointsPossible,
        feedback: result.feedback || (result.isCorrect ? 'Correct!' : `Expected: ${input.expectedAnswer}`),
        recognizedLatex: input.recognizedLatex,
      };
    } catch {
      return this.localValidate(input);
    }
  }

  /** Grade a full exam using the real casuya-exams GradingEngine per question. */
  async gradeExam(input: StructuredExamInput): Promise<StructuredExamOutput | null> {
    await this.ensureLoaded();
    const exam = examRepository.getExam(input.examId);
    if (!exam) return null;
    const engine = this.getEngine();
    if (!engine) return null;

    const results: StepValidationOutput[] = [];
    let totalScore = 0;
    let maxScore = 0;

    for (const ans of input.answers) {
      const question = examRepository.getQuestion(ans.questionId);
      if (!question) continue;
      const answer: Answer = {
        questionId: question.id,
        value: ans.value,
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const graded: GradingResult = engine.gradeQuestion(question, answer);
      totalScore += graded.pointsAwarded;
      maxScore += graded.pointsPossible;
      results.push({
        stepNumber: results.length + 1,
        correct: graded.isCorrect,
        score: graded.pointsAwarded,
        maxScore: graded.pointsPossible,
        feedback: graded.feedback || (graded.isCorrect ? 'Correct!' : 'Incorrect'),
      });
    }

    const passingScore = exam.passingScore ?? 50;
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    return {
      examId: exam.id,
      totalScore,
      maxScore,
      percentage,
      passed: percentage >= passingScore,
      results,
    };
  }

  private localValidate(input: StepValidationInput): StepValidationOutput {
    if (!input.expectedAnswer || !input.recognizedLatex) {
      return {
        stepNumber: input.stepNumber,
        correct: false,
        score: 0,
        maxScore: 1,
        feedback: 'No answer to validate',
      };
    }
    const normalized = (s: string) => s.replace(/\s+/g, '').toLowerCase();
    const correct = normalized(input.recognizedLatex) === normalized(input.expectedAnswer);
    return {
      stepNumber: input.stepNumber,
      correct,
      score: correct ? 1 : 0,
      maxScore: 1,
      feedback: correct ? 'Correct!' : `Expected: ${input.expectedAnswer}`,
      recognizedLatex: input.recognizedLatex,
    };
  }
}

