import {
  AssessmentAnalytics,
  QuestionAnalytics,
  DifficultyLevel,
  GradingResult,
  ExamResult,
} from '../types';
import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculatePassRate,
} from '../utilities/statistics';
import { GradingEngine } from '../grading/GradingEngine';
import { ExamBuilder } from '../exam-builder/ExamBuilder';
import { QuestionManager } from '../question-bank/questions/QuestionManager';

export class AssessmentAnalyticsEngine {
  private gradingEngine: GradingEngine;
  private examBuilder: ExamBuilder;
  private questionManager: QuestionManager;

  constructor(
    gradingEngine: GradingEngine,
    examBuilder: ExamBuilder,
    questionManager: QuestionManager,
  ) {
    this.gradingEngine = gradingEngine;
    this.examBuilder = examBuilder;
    this.questionManager = questionManager;
  }

  analyze(examId: string): AssessmentAnalytics {
    const exam = this.examBuilder.get(examId);
    if (!exam) throw new Error(`Exam ${examId} not found`);

    const results = this.gradingEngine.getResultsByExam(examId);
    const scores = results.map((r) => r.percentage);
    const times = results.map((r) => r.timeTaken);

    const questionAnalytics = this.calculateQuestionAnalytics(results, examId);
    const difficultyBreakdown = this.calculateDifficultyBreakdown(examId);

    const now = new Date();
    const startTimes = results.map((r) => r.startedAt.getTime());
    const earliestStart = startTimes.length > 0 ? Math.min(...startTimes) : now.getTime();

    return {
      examId,
      totalParticipants: results.length,
      averageScore: calculateMean(scores),
      highestScore: scores.length > 0 ? Math.max(...scores) : 0,
      lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
      medianScore: calculateMedian(scores),
      standardDeviation: calculateStandardDeviation(scores),
      passRate: calculatePassRate(scores, exam.passingScore),
      averageTime: calculateMean(times),
      questionAnalytics,
      difficultyBreakdown,
      timeRange: {
        start: new Date(earliestStart),
        end: now,
      },
    };
  }

  private calculateQuestionAnalytics(results: ExamResult[], _examId: string): QuestionAnalytics[] {
    const questionMap = new Map<string, GradingResult[]>();

    for (const result of results) {
      for (const gradingResult of result.results) {
        const existing = questionMap.get(gradingResult.questionId) || [];
        existing.push(gradingResult);
        questionMap.set(gradingResult.questionId, existing);
      }
    }

    const analytics: QuestionAnalytics[] = [];

    for (const [questionId, gradingResults] of questionMap) {
      const total = gradingResults.length;
      const correct = gradingResults.filter((r) => r.isCorrect).length;
      const partial = gradingResults.filter((r) => !r.isCorrect && r.pointsAwarded > 0).length;
      const incorrect = gradingResults.filter((r) => !r.isCorrect && r.pointsAwarded === 0).length;

      const difficultyIndex = total > 0 ? correct / total : 0;

      const upperHalf = gradingResults
        .sort((a, b) => b.pointsAwarded - a.pointsAwarded)
        .slice(0, Math.ceil(gradingResults.length / 2));
      const lowerHalf = gradingResults
        .sort((a, b) => b.pointsAwarded - a.pointsAwarded)
        .slice(Math.floor(gradingResults.length / 2));

      const upperCorrect = upperHalf.filter((r) => r.isCorrect).length;
      const lowerCorrect = lowerHalf.filter((r) => r.isCorrect).length;
      const upperN = upperHalf.length || 1;
      const lowerN = lowerHalf.length || 1;
      const discriminationIndex = upperCorrect / upperN - lowerCorrect / lowerN;

      analytics.push({
        questionId,
        totalAttempts: total,
        correctAttempts: correct,
        partialAttempts: partial,
        incorrectAttempts: incorrect,
        skippedAttempts: 0,
        averageTime: 0,
        difficultyIndex: Math.round(difficultyIndex * 100) / 100,
        discriminationIndex: Math.round(discriminationIndex * 100) / 100,
      });
    }

    return analytics;
  }

  private calculateDifficultyBreakdown(examId: string): Record<DifficultyLevel, number> {
    const exam = this.examBuilder.get(examId);
    if (!exam) {
      return { easy: 0, medium: 0, hard: 0, 'very-hard': 0 };
    }

    const breakdown: Record<DifficultyLevel, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      'very-hard': 0,
    };

    const allQuestions = this.questionManager.getAll();
    for (const section of exam.sections) {
      for (const questionId of section.questionIds) {
        const question = allQuestions.find((q) => q.id === questionId);
        if (question) {
          breakdown[question.difficulty] = (breakdown[question.difficulty] || 0) + 1;
        }
      }
    }

    return breakdown;
  }

  getAverageScoreByQuestion(examId: string): Map<string, number> {
    const results = this.gradingEngine.getResultsByExam(examId);
    const questionScores = new Map<string, number[]>();

    for (const result of results) {
      for (const gr of result.results) {
        const scores = questionScores.get(gr.questionId) || [];
        scores.push(gr.pointsAwarded / Math.max(gr.pointsPossible, 1));
        questionScores.set(gr.questionId, scores);
      }
    }

    const averages = new Map<string, number>();
    for (const [questionId, scores] of questionScores) {
      averages.set(questionId, calculateMean(scores));
    }
    return averages;
  }

  getPerformanceOverTime(examId: string): { date: Date; averageScore: number }[] {
    const results = this.gradingEngine.getResultsByExam(examId);
    const dailyMap = new Map<string, number[]>();

    for (const result of results) {
      const dateKey = result.completedAt.toISOString().split('T')[0];
      const scores = dailyMap.get(dateKey) || [];
      scores.push(result.percentage);
      dailyMap.set(dateKey, scores);
    }

    return Array.from(dailyMap.entries())
      .map(([dateKey, scores]) => ({
        date: new Date(dateKey),
        averageScore: calculateMean(scores),
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}
