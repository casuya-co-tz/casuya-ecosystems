import { ExamSession, Answer } from '../types';
import { generateId } from '../utilities/id-generator';
import { validateAnswer } from '../utilities/validators';
import { ExamBuilder } from '../exam-builder/ExamBuilder';
import { Scheduler } from '../scheduling/Scheduler';

export class SessionManager {
  private sessions: Map<string, ExamSession>;
  private examBuilder: ExamBuilder;
  private scheduler: Scheduler;

  constructor(examBuilder: ExamBuilder, scheduler: Scheduler) {
    this.sessions = new Map();
    this.examBuilder = examBuilder;
    this.scheduler = scheduler;
  }

  start(examId: string, participantId: string, scheduleId?: string): ExamSession {
    const exam = this.examBuilder.get(examId);
    if (!exam) {
      throw new Error(`Exam ${examId} not found`);
    }
    if (exam.status !== 'published') {
      throw new Error('Exam is not published');
    }

    if (scheduleId) {
      if (!this.scheduler.isParticipantAllowed(scheduleId, participantId)) {
        throw new Error('Participant is not allowed in this schedule');
      }
    }

    const existingActive = this.getActiveByParticipant(participantId);
    if (existingActive.length > 0) {
      throw new Error('Participant already has an active session');
    }

    const session: ExamSession = {
      id: generateId('sess'),
      examId,
      scheduleId,
      participantId,
      status: 'active',
      startedAt: new Date(),
      timeRemaining: exam.timeLimit * 60,
      answers: [],
      flaggedQuestions: [],
      metadata: {},
    };

    this.sessions.set(session.id, session);
    return session;
  }

  submitAnswer(sessionId: string, answer: Omit<Answer, 'submittedAt'>): Answer | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return undefined;

    const errors = validateAnswer(answer);
    if (errors.length > 0) return undefined;

    const fullAnswer: Answer = {
      ...answer,
      submittedAt: new Date(),
    };

    const existingIndex = session.answers.findIndex((a) => a.questionId === answer.questionId);
    if (existingIndex >= 0) {
      session.answers[existingIndex] = fullAnswer;
    } else {
      session.answers.push(fullAnswer);
    }

    this.sessions.set(sessionId, session);
    return fullAnswer;
  }

  flagQuestion(sessionId: string, questionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (!session.flaggedQuestions.includes(questionId)) {
      session.flaggedQuestions.push(questionId);
      this.sessions.set(sessionId, session);
    }
    return true;
  }

  unflagQuestion(sessionId: string, questionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const index = session.flaggedQuestions.indexOf(questionId);
    if (index >= 0) {
      session.flaggedQuestions.splice(index, 1);
      this.sessions.set(sessionId, session);
    }
    return true;
  }

  pause(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'active') return false;

    session.status = 'paused';
    session.timeRemaining = this.calculateTimeRemaining(session);
    this.sessions.set(sessionId, session);
    return true;
  }

  resume(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== 'paused') return false;

    session.status = 'active';
    this.sessions.set(sessionId, session);
    return true;
  }

  complete(sessionId: string): ExamSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'completed';
    session.completedAt = new Date();
    session.timeRemaining = 0;
    this.sessions.set(sessionId, session);
    return session;
  }

  timeout(sessionId: string): ExamSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'timeout';
    session.completedAt = new Date();
    session.timeRemaining = 0;
    this.sessions.set(sessionId, session);
    return session;
  }

  terminate(sessionId: string): ExamSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    session.status = 'terminated';
    session.completedAt = new Date();
    this.sessions.set(sessionId, session);
    return session;
  }

  get(id: string): ExamSession | undefined {
    return this.sessions.get(id);
  }

  getAll(): ExamSession[] {
    return Array.from(this.sessions.values());
  }

  getByExam(examId: string): ExamSession[] {
    return this.getAll().filter((s) => s.examId === examId);
  }

  getByParticipant(participantId: string): ExamSession[] {
    return this.getAll().filter((s) => s.participantId === participantId);
  }

  getActiveByParticipant(participantId: string): ExamSession[] {
    return this.getAll().filter((s) => s.participantId === participantId && s.status === 'active');
  }

  getActive(): ExamSession[] {
    return this.getAll().filter((s) => s.status === 'active');
  }

  updateTimeRemaining(sessionId: string, seconds: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.timeRemaining = Math.max(0, seconds);
    this.sessions.set(sessionId, session);
    return true;
  }

  private calculateTimeRemaining(session: ExamSession): number {
    if (!session.startedAt) return session.timeRemaining;
    const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    return Math.max(0, session.timeRemaining - elapsed);
  }

  clear(): void {
    this.sessions.clear();
  }

  get size(): number {
    return this.sessions.size;
  }
}
