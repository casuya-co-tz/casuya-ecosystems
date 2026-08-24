import { ExamSchedule } from '../types';
import { generateId } from '../utilities/id-generator';
import { validateSchedule } from '../utilities/validators';
import { ExamBuilder } from '../exam-builder/ExamBuilder';

export class Scheduler {
  private schedules: Map<string, ExamSchedule>;
  private examBuilder: ExamBuilder;

  constructor(examBuilder: ExamBuilder) {
    this.schedules = new Map();
    this.examBuilder = examBuilder;
  }

  schedule(data: Omit<ExamSchedule, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ExamSchedule {
    const errors = validateSchedule(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join('; ')}`);
    }

    const exam = this.examBuilder.get(data.examId);
    if (!exam) {
      throw new Error(`Exam ${data.examId} not found`);
    }
    if (exam.status !== 'published') {
      throw new Error('Only published exams can be scheduled');
    }

    const hasOverlap = this.checkOverlap(data.examId, data.startTime, data.endTime);
    if (hasOverlap) {
      throw new Error('Schedule overlaps with an existing schedule for this exam');
    }

    const schedule: ExamSchedule = {
      id: generateId('sched'),
      ...data,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.schedules.set(schedule.id, schedule);
    return schedule;
  }

  reschedule(id: string, startTime: Date, endTime: Date): ExamSchedule | undefined {
    const schedule = this.schedules.get(id);
    if (!schedule) return undefined;

    const updated: ExamSchedule = {
      ...schedule,
      startTime,
      endTime,
      updatedAt: new Date(),
    };

    this.schedules.set(id, updated);
    return updated;
  }

  cancel(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.status = 'cancelled';
    schedule.updatedAt = new Date();
    this.schedules.set(id, schedule);
    return true;
  }

  activate(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.status = 'active';
    schedule.updatedAt = new Date();
    this.schedules.set(id, schedule);
    return true;
  }

  complete(id: string): boolean {
    const schedule = this.schedules.get(id);
    if (!schedule) return false;

    schedule.status = 'completed';
    schedule.updatedAt = new Date();
    this.schedules.set(id, schedule);
    return true;
  }

  get(id: string): ExamSchedule | undefined {
    return this.schedules.get(id);
  }

  getAll(): ExamSchedule[] {
    return Array.from(this.schedules.values());
  }

  getByExam(examId: string): ExamSchedule[] {
    return this.getAll().filter((s) => s.examId === examId);
  }

  getByParticipant(participantId: string): ExamSchedule[] {
    return this.getAll().filter((s) => s.allowedParticipants.includes(participantId));
  }

  getUpcoming(limit = 10): ExamSchedule[] {
    const now = new Date();
    return this.getAll()
      .filter((s) => s.startTime > now && s.status !== 'cancelled')
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, limit);
  }

  getActive(): ExamSchedule[] {
    const now = new Date();
    return this.getAll().filter(
      (s) => s.status === 'active' && s.startTime <= now && s.endTime >= now,
    );
  }

  isParticipantAllowed(scheduleId: string, participantId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;
    if (schedule.allowedParticipants.length === 0) return true;
    return schedule.allowedParticipants.includes(participantId);
  }

  hasCapacity(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;
    return schedule.maxParticipants <= 0;
  }

  private checkOverlap(examId: string, startTime: Date, endTime: Date): boolean {
    return this.getAll().some(
      (s) =>
        s.examId === examId &&
        s.status !== 'cancelled' &&
        s.startTime < endTime &&
        s.endTime > startTime,
    );
  }

  clear(): void {
    this.schedules.clear();
  }

  get size(): number {
    return this.schedules.size;
  }
}
