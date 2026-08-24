import { ExamResult, GradingResult, Answer, Question, QuestionType } from '../types';
import { generateId } from '../utilities/id-generator';
import { QuestionManager } from '../question-bank/questions/QuestionManager';
import { ExamBuilder } from '../exam-builder/ExamBuilder';

export type GradingStrategy = (question: Question, answer: Answer) => GradingResult;

export class GradingEngine {
  private strategies: Map<QuestionType, GradingStrategy>;
  private questionManager: QuestionManager;
  private examBuilder: ExamBuilder;
  private results: Map<string, ExamResult>;

  constructor(questionManager: QuestionManager, examBuilder: ExamBuilder) {
    this.strategies = new Map();
    this.questionManager = questionManager;
    this.examBuilder = examBuilder;
    this.results = new Map();

    this.registerDefaultStrategies();
  }

  registerStrategy(type: QuestionType, strategy: GradingStrategy): void {
    this.strategies.set(type, strategy);
  }

  registerStrategies(strategies: Map<QuestionType, GradingStrategy>): void {
    strategies.forEach((strategy, type) => {
      this.strategies.set(type, strategy);
    });
  }

  grade(
    sessionId: string,
    examId: string,
    participantId: string,
    answers: Answer[],
    startedAt: Date,
    completedAt: Date,
  ): ExamResult {
    const exam = this.examBuilder.get(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }

    const results: GradingResult[] = [];
    let earnedPoints = 0;
    const totalPoints = this.examBuilder.getTotalPoints(examId);

    for (const answer of answers) {
      const question = this.questionManager.get(answer.questionId);
      if (!question) continue;

      const strategy = this.strategies.get(question.type);
      if (!strategy) continue;

      const result = strategy(question, answer);
      results.push(result);
      earnedPoints += result.pointsAwarded;
    }

    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const result: ExamResult = {
      id: generateId('result'),
      sessionId,
      examId,
      participantId,
      totalPoints,
      earnedPoints,
      percentage: Math.round(percentage * 100) / 100,
      passed: percentage >= exam.passingScore,
      results,
      startedAt,
      completedAt,
      timeTaken: Math.floor((completedAt.getTime() - startedAt.getTime()) / 1000),
      metadata: {},
    };

    this.results.set(result.id, result);
    return result;
  }

  gradeQuestion(question: Question, answer: Answer): GradingResult {
    const strategy = this.strategies.get(question.type);
    if (!strategy) {
      return {
        questionId: question.id,
        type: question.type,
        pointsAwarded: 0,
        pointsPossible: question.points,
        isCorrect: false,
        feedback: 'No grading strategy available for this question type',
        gradedAt: new Date(),
        gradedBy: 'auto',
      };
    }

    return strategy(question, answer);
  }

  manualGrade(
    sessionId: string,
    examId: string,
    participantId: string,
    answers: Answer[],
    graderId: string,
    manualScores: Map<string, number>,
    startedAt: Date,
    completedAt: Date,
  ): ExamResult {
    const result = this.grade(sessionId, examId, participantId, answers, startedAt, completedAt);

    for (const [questionId, points] of manualScores) {
      const gradingResult = result.results.find((r) => r.questionId === questionId);
      if (gradingResult) {
        gradingResult.pointsAwarded = points;
        gradingResult.gradedBy = 'manual';
        gradingResult.graderId = graderId;
      }
    }

    result.earnedPoints = result.results.reduce((sum, r) => sum + r.pointsAwarded, 0);
    result.percentage =
      result.totalPoints > 0
        ? Math.round((result.earnedPoints / result.totalPoints) * 100 * 100) / 100
        : 0;
    result.passed = result.percentage >= (this.examBuilder.get(examId)?.passingScore ?? 50);

    this.results.set(result.id, result);
    return result;
  }

  getResult(id: string): ExamResult | undefined {
    return this.results.get(id);
  }

  getResultsByExam(examId: string): ExamResult[] {
    return Array.from(this.results.values()).filter((r) => r.examId === examId);
  }

  getResultsByParticipant(participantId: string): ExamResult[] {
    return Array.from(this.results.values()).filter((r) => r.participantId === participantId);
  }

  getAllResults(): ExamResult[] {
    return Array.from(this.results.values());
  }

  private registerDefaultStrategies(): void {
    this.strategies.set('multiple-choice', (question, answer) =>
      this.gradeMultipleChoice(question, answer),
    );
    this.strategies.set('single-choice', (question, answer) =>
      this.gradeSingleChoice(question, answer),
    );
    this.strategies.set('true-false', (question, answer) => this.gradeTrueFalse(question, answer));
    this.strategies.set('short-answer', (question, answer) =>
      this.gradeShortAnswer(question, answer),
    );
    this.strategies.set('essay', (question, _answer) => ({
      questionId: question.id,
      type: 'essay',
      pointsAwarded: 0,
      pointsPossible: question.points,
      isCorrect: false,
      feedback: 'Pending manual grading — submit via manualGrade() with grader scores',
      gradedAt: new Date(),
      gradedBy: 'manual',
    }));

    this.strategies.set('matching', (question, answer) => this.gradeMatching(question, answer));
    this.strategies.set('fill-blank', (question, answer) => this.gradeFillBlank(question, answer));
    this.strategies.set('ordering', (question, answer) => this.gradeOrdering(question, answer));
  }

  private gradeMultipleChoice(question: Question, answer: Answer): GradingResult {
    const correct = question.options?.filter((o) => o.isCorrect).map((o) => o.id) || [];
    const userAnswer = Array.isArray(answer.value) ? answer.value : [answer.value];
    const isCorrect =
      userAnswer.length === correct.length &&
      userAnswer.every((v) => correct.includes(v)) &&
      correct.every((v) => userAnswer.includes(v));

    return {
      questionId: question.id,
      type: question.type,
      pointsAwarded: isCorrect ? question.points : 0,
      pointsPossible: question.points,
      isCorrect,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };
  }

  private gradeSingleChoice(question: Question, answer: Answer): GradingResult {
    const correct = question.options?.find((o) => o.isCorrect)?.id;
    const userAnswer = typeof answer.value === 'string' ? answer.value : answer.value[0];
    const isCorrect = userAnswer === correct;

    return {
      questionId: question.id,
      type: question.type,
      pointsAwarded: isCorrect ? question.points : 0,
      pointsPossible: question.points,
      isCorrect,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };
  }

  private gradeTrueFalse(question: Question, answer: Answer): GradingResult {
    return this.gradeSingleChoice(question, answer);
  }

  private gradeShortAnswer(question: Question, answer: Answer): GradingResult {
    const userAnswer = typeof answer.value === 'string' ? answer.value.trim().toLowerCase() : '';
    const correct =
      typeof question.correctAnswer === 'string' ? question.correctAnswer.toLowerCase().trim() : '';

    const isCorrect =
      userAnswer === correct || userAnswer.includes(correct) || correct.includes(userAnswer);

    return {
      questionId: question.id,
      type: question.type,
      pointsAwarded: isCorrect ? question.points : 0,
      pointsPossible: question.points,
      isCorrect,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };
  }

  private gradeMatching(question: Question, answer: Answer): GradingResult {
    if (!question.matchingPairs || !Array.isArray(answer.value)) {
      return {
        questionId: question.id,
        type: question.type,
        pointsAwarded: 0,
        pointsPossible: question.points,
        isCorrect: false,
        gradedAt: new Date(),
        gradedBy: 'auto',
      };
    }

    const userPairs = answer.value as string[];
    const correctPairs = question.matchingPairs.map((p) => `${p.left}:${p.right}`);
    let correct = 0;

    for (const pair of userPairs) {
      if (correctPairs.includes(pair)) correct++;
    }

    const ratio = correct / correctPairs.length;
    const pointsAwarded = Math.round(question.points * ratio);

    return {
      questionId: question.id,
      type: question.type,
      pointsAwarded,
      pointsPossible: question.points,
      isCorrect: correct === correctPairs.length,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };
  }

  private gradeFillBlank(question: Question, answer: Answer): GradingResult {
    return this.gradeShortAnswer(question, answer);
  }

  private gradeOrdering(question: Question, answer: Answer): GradingResult {
    if (!Array.isArray(answer.value) || !Array.isArray(question.correctAnswer)) {
      return {
        questionId: question.id,
        type: question.type,
        pointsAwarded: 0,
        pointsPossible: question.points,
        isCorrect: false,
        gradedAt: new Date(),
        gradedBy: 'auto',
      };
    }

    const correct = answer.value.every(
      (v, i) => Array.isArray(question.correctAnswer) && v === question.correctAnswer[i],
    );

    return {
      questionId: question.id,
      type: question.type,
      pointsAwarded: correct ? question.points : 0,
      pointsPossible: question.points,
      isCorrect: correct,
      gradedAt: new Date(),
      gradedBy: 'auto',
    };
  }

  clear(): void {
    this.results.clear();
  }
}
