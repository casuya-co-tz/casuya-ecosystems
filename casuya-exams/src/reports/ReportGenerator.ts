import { ExamReport, ReportFilter } from '../types';
import { generateId } from '../utilities/id-generator';
import {
  calculateMean,
  calculateMedian,
  calculateStandardDeviation,
  calculatePassRate,
} from '../utilities/statistics';
import { GradingEngine } from '../grading/GradingEngine';
import { ExamBuilder } from '../exam-builder/ExamBuilder';

export type ReportFormat = 'json' | 'csv' | 'pdf' | 'html';
export type ReportExporter = (report: ExamReport, format: ReportFormat) => string;

export class ReportGenerator {
  private reports: Map<string, ExamReport>;
  private gradingEngine: GradingEngine;
  private examBuilder: ExamBuilder;
  private exporters: Map<ReportFormat, ReportExporter>;

  constructor(gradingEngine: GradingEngine, examBuilder: ExamBuilder) {
    this.reports = new Map();
    this.gradingEngine = gradingEngine;
    this.examBuilder = examBuilder;
    this.exporters = new Map();
    this.registerDefaultExporters();
  }

  registerExporter(format: ReportFormat, exporter: ReportExporter): void {
    this.exporters.set(format, exporter);
  }

  generateSummary(examId: string, filters?: ReportFilter[]): ExamReport {
    const exam = this.examBuilder.get(examId);
    if (!exam) throw new Error(`Exam ${examId} not found`);

    const results = this.gradingEngine.getResultsByExam(examId);
    const scores = results.map((r) => r.percentage);

    const report: ExamReport = {
      id: generateId('report'),
      examId,
      title: `${exam.title} - Summary Report`,
      type: 'summary',
      generatedAt: new Date(),
      data: {
        examTitle: exam.title,
        totalParticipants: results.length,
        averageScore: calculateMean(scores),
        medianScore: calculateMedian(scores),
        highestScore: scores.length > 0 ? Math.max(...scores) : 0,
        lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
        standardDeviation: calculateStandardDeviation(scores),
        passRate: calculatePassRate(scores, exam.passingScore),
        passingScore: exam.passingScore,
        totalQuestions: this.examBuilder.getTotalQuestions(examId),
        totalPoints: this.examBuilder.getTotalPoints(examId),
      },
      filters,
    };

    this.reports.set(report.id, report);
    return report;
  }

  generateDetailed(examId: string, filters?: ReportFilter[]): ExamReport {
    const exam = this.examBuilder.get(examId);
    if (!exam) throw new Error(`Exam ${examId} not found`);

    const results = this.gradingEngine.getResultsByExam(examId);

    const report: ExamReport = {
      id: generateId('report'),
      examId,
      title: `${exam.title} - Detailed Report`,
      type: 'detailed',
      generatedAt: new Date(),
      data: {
        examTitle: exam.title,
        results: results.map((r) => ({
          participantId: r.participantId,
          score: r.percentage,
          passed: r.passed,
          timeTaken: r.timeTaken,
          questionResults: r.results.map((qr) => ({
            questionId: qr.questionId,
            pointsAwarded: qr.pointsAwarded,
            pointsPossible: qr.pointsPossible,
            isCorrect: qr.isCorrect,
          })),
        })),
      },
      filters,
    };

    this.reports.set(report.id, report);
    return report;
  }

  generateIndividual(resultId: string): ExamReport | undefined {
    const allResults = this.gradingEngine.getAllResults();
    const result = allResults.find((r) => r.id === resultId);
    if (!result) return undefined;

    const exam = this.examBuilder.get(result.examId);

    const report: ExamReport = {
      id: generateId('report'),
      examId: result.examId,
      title: exam ? `${exam.title} - Individual Report` : 'Individual Report',
      type: 'individual',
      generatedAt: new Date(),
      data: {
        participantId: result.participantId,
        score: result.percentage,
        totalPoints: result.totalPoints,
        earnedPoints: result.earnedPoints,
        passed: result.passed,
        timeTaken: result.timeTaken,
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        results: result.results,
      },
    };

    this.reports.set(report.id, report);
    return report;
  }

  generateComparative(examIds: string[], filters?: ReportFilter[]): ExamReport {
    const examData = examIds.map((id) => {
      const exam = this.examBuilder.get(id);
      const results = this.gradingEngine.getResultsByExam(id);
      const scores = results.map((r) => r.percentage);

      return {
        examId: id,
        examTitle: exam?.title ?? 'Unknown',
        totalParticipants: results.length,
        averageScore: calculateMean(scores),
        medianScore: calculateMedian(scores),
        standardDeviation: calculateStandardDeviation(scores),
        passRate: exam ? calculatePassRate(scores, exam.passingScore) : 0,
      };
    });

    const report: ExamReport = {
      id: generateId('report'),
      examId: 'comparative',
      title: 'Comparative Report',
      type: 'comparative',
      generatedAt: new Date(),
      data: { exams: examData },
      filters,
    };

    this.reports.set(report.id, report);
    return report;
  }

  export(id: string, format: ReportFormat): string | undefined {
    const report = this.reports.get(id);
    if (!report) return undefined;

    const exporter = this.exporters.get(format);
    if (!exporter) throw new Error(`No exporter registered for format: ${format}`);

    return exporter(report, format);
  }

  get(id: string): ExamReport | undefined {
    return this.reports.get(id);
  }

  getByExam(examId: string): ExamReport[] {
    return Array.from(this.reports.values()).filter((r) => r.examId === examId);
  }

  getAll(): ExamReport[] {
    return Array.from(this.reports.values());
  }

  private registerDefaultExporters(): void {
    this.exporters.set('json', (report) => JSON.stringify(report, null, 2));
    this.exporters.set('csv', (report) => {
      const rows: string[] = [];
      rows.push('Field,Value');
      for (const [key, value] of Object.entries(report.data)) {
        if (typeof value !== 'object') {
          rows.push(`${key},${value}`);
        }
      }
      return rows.join('\n');
    });
  }

  clear(): void {
    this.reports.clear();
  }
}
