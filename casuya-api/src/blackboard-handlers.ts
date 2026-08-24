import { Request, Response } from 'express';
import { RestContract } from './contracts/rest-contract';
import { MathService } from './integrations/math-service';
import { ExamsService } from './integrations/exams-service';
import { examRepository } from './integrations/exam-repository';

interface BlackboardProgress {
  student_id: string;
  lesson_id: string;
  step: number;
  elements: any[];
  timestamp: number;
}

const progressStore = new Map<string, BlackboardProgress[]>();
const mathService = new MathService();
const examsService = new ExamsService();

function getProgressKey(studentId: string, lessonId: string): string {
  return `${studentId}:${lessonId}`;
}

export const blackboardHandlers = {
  async syncProgress(req: Request, res: Response): Promise<void> {
    try {
      const { student_id, lesson_id, step, elements, timestamp } = req.body as BlackboardProgress;
      const key = getProgressKey(student_id, lesson_id);
      const existing = progressStore.get(key) || [];
      existing.push({ student_id, lesson_id, step, elements, timestamp });
      progressStore.set(key, existing);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to sync progress' });
    }
  },

  async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, lessonId } = req.params;
      const key = getProgressKey(studentId, lessonId);
      const progress = progressStore.get(key);
      if (!progress || progress.length === 0) {
        res.status(404).json({ error: 'No progress found' });
        return;
      }
      res.json(progress[progress.length - 1]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to get progress' });
    }
  },

  async validateStep(req: Request, res: Response): Promise<void> {
    try {
      const { step } = req.body as { step: { stepNumber?: number; recognizedLatex?: string; expectedAnswer?: string; elements?: any[] } };
      const result = await examsService.validateStep({
        stepNumber: step?.stepNumber || 1,
        recognizedLatex: step?.recognizedLatex,
        expectedAnswer: step?.expectedAnswer,
        elements: step?.elements,
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Validation failed' });
    }
  },

  async submitExam(req: Request, res: Response): Promise<void> {
    try {
      const body = req.body as {
        examId?: string;
        studentId?: string;
        answers?: Array<{ questionId: string; value: string | string[] }>;
        steps?: { stepNumber: number; recognizedLatex?: string; expectedAnswer?: string }[];
      };

      // Structured exam path: real casuya-exams GradingEngine.
      if (body.examId) {
        const result = await examsService.gradeExam({
          examId: body.examId,
          studentId: body.studentId || 'anonymous',
          answers: body.answers || [],
        });
        if (!result) {
          res.status(404).json({ error: 'Exam not found' });
          return;
        }
        res.json(result);
        return;
      }

      // Step-based path: grade each handwritten step.
      const steps = body.steps || [];
      const results = await Promise.all(
        steps.map((s) =>
          examsService.validateStep({
            stepNumber: s.stepNumber,
            recognizedLatex: s.recognizedLatex,
            expectedAnswer: s.expectedAnswer,
          }),
        ),
      );
      const totalScore = results.reduce((sum, r) => sum + r.score, 0);
      const maxScore = results.reduce((sum, r) => sum + r.maxScore, 0);
      const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
      res.json({
        examId: `exam-${Date.now()}`,
        totalScore,
        maxScore,
        percentage,
        stepResults: results,
        passed: percentage >= 50,
      });
    } catch (err) {
      res.status(500).json({ error: 'Exam submission failed' });
    }
  },

  async createExam(req: Request, res: Response): Promise<void> {
    try {
      const { exam, questions } = req.body as {
        exam: any;
        questions?: any[];
      };
      if (!exam || !exam.id) {
        res.status(400).json({ error: 'exam with id is required' });
        return;
      }
      if (Array.isArray(questions)) {
        for (const q of questions) {
          if (q && q.id) examRepository.addQuestion(q);
        }
      }
      examRepository.addExam(exam);
      res.json({ success: true, examId: exam.id });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create exam' });
    }
  },

  async solveEquation(req: Request, res: Response): Promise<void> {
    try {
      const { equation } = req.body as { equation: string };
      const result = await mathService.solveEquation(equation);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Solve failed' });
    }
  },

  async checkEquivalence(req: Request, res: Response): Promise<void> {
    try {
      const { expr1, expr2 } = req.body as { expr1: string; expr2: string };
      const result = await mathService.checkEquivalence(expr1, expr2);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Equivalence check failed' });
    }
  },
};

interface ContractRoute {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  path: string;
  name: string;
  handler: (req: Request, res: Response) => Promise<void>;
}

const routes: ContractRoute[] = [
  { method: 'POST', path: '/progress/sync', name: 'progress-sync', handler: blackboardHandlers.syncProgress },
  { method: 'GET', path: '/progress/:studentId/:lessonId', name: 'progress-get', handler: blackboardHandlers.getProgress },
  { method: 'POST', path: '/exams/validate-step', name: 'exams-validate-step', handler: blackboardHandlers.validateStep },
  { method: 'POST', path: '/exams/submit', name: 'exams-submit', handler: blackboardHandlers.submitExam },
  { method: 'POST', path: '/exams', name: 'exams-create', handler: blackboardHandlers.createExam },
  { method: 'POST', path: '/math/solve', name: 'math-solve', handler: blackboardHandlers.solveEquation },
  { method: 'POST', path: '/math/equivalence', name: 'math-equivalence', handler: blackboardHandlers.checkEquivalence },
];

export function createBlackboardContracts(): { contract: RestContract; handler: (req: Request, res: Response) => Promise<void> }[] {
  return routes.map(({ method, path, name, handler }) => ({
    contract: new RestContract(method, path, {
      name,
      version: '1.0.0',
      description: `Blackboard ${path}`,
      tags: ['blackboard'],
    }),
    handler,
  }));
}
