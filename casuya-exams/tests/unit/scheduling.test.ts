import { Scheduler } from '../../src/scheduling/Scheduler';
import { ExamBuilder } from '../../src/exam-builder/ExamBuilder';
import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';

describe('Scheduler', () => {
  let scheduler: Scheduler;
  let examBuilder: ExamBuilder;
  let questionManager: QuestionManager;
  let tagManager: TagManager;
  let categoryManager: CategoryManager;
  let examId: string;
  let categoryId: string;

  beforeEach(() => {
    tagManager = new TagManager();
    categoryManager = new CategoryManager();
    questionManager = new QuestionManager(tagManager);
    examBuilder = new ExamBuilder(questionManager);
    scheduler = new Scheduler(examBuilder);

    const cat = categoryManager.create({ name: 'Test', description: '' });
    categoryId = cat.id;

    const exam = examBuilder.create({
      title: 'Final',
      description: 'Desc',
      timeLimit: 60,
      passingScore: 50,
    });
    examId = exam.id;

    const section = examBuilder.addSection(exam.id, { title: 'S1' })!;
    const q1 = questionManager.create({
      type: 'single-choice',
      title: 'Q1',
      body: 'Body',
      options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
      points: 1,
      difficulty: 'easy',
      categoryId,
      tags: [],
      metadata: {},
    });
    examBuilder.addQuestionsToSection(exam.id, section.id, [q1.id]);
    examBuilder.publish(exam.id);
  });

  it('should schedule an exam', () => {
    const schedule = scheduler.schedule({
      examId,
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T12:00:00Z'),
      timezone: 'UTC',
      allowedParticipants: [],
      maxParticipants: 0,
      proctoringEnabled: false,
    });
    expect(schedule.id).toBeTruthy();
    expect(schedule.status).toBe('pending');
  });

  it('should reject scheduling unpublished exams', () => {
    const draftExam = examBuilder.create({
      title: 'Draft',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    expect(() => {
      scheduler.schedule({
        examId: draftExam.id,
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000),
        timezone: 'UTC',
        allowedParticipants: [],
        maxParticipants: 0,
        proctoringEnabled: false,
      });
    }).toThrow('Only published exams can be scheduled');
  });

  it('should reschedule', () => {
    const schedule = scheduler.schedule({
      examId,
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T12:00:00Z'),
      timezone: 'UTC',
      allowedParticipants: [],
      maxParticipants: 0,
      proctoringEnabled: false,
    });
    const newStart = new Date('2025-01-02T10:00:00Z');
    const newEnd = new Date('2025-01-02T12:00:00Z');
    const updated = scheduler.reschedule(schedule.id, newStart, newEnd);
    expect(updated?.startTime).toEqual(newStart);
  });

  it('should cancel schedules', () => {
    const schedule = scheduler.schedule({
      examId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      timezone: 'UTC',
      allowedParticipants: [],
      maxParticipants: 0,
      proctoringEnabled: false,
    });
    expect(scheduler.cancel(schedule.id)).toBe(true);
    expect(scheduler.get(schedule.id)?.status).toBe('cancelled');
  });

  it('should get upcoming schedules', () => {
    scheduler.schedule({
      examId,
      startTime: new Date('2099-01-01T10:00:00Z'),
      endTime: new Date('2099-01-01T12:00:00Z'),
      timezone: 'UTC',
      allowedParticipants: [],
      maxParticipants: 0,
      proctoringEnabled: false,
    });
    const upcoming = scheduler.getUpcoming();
    expect(upcoming.length).toBe(1);
  });

  it('should check participant eligibility', () => {
    const schedule = scheduler.schedule({
      examId,
      startTime: new Date(),
      endTime: new Date(Date.now() + 3600000),
      timezone: 'UTC',
      allowedParticipants: ['student-1'],
      maxParticipants: 0,
      proctoringEnabled: false,
    });
    expect(scheduler.isParticipantAllowed(schedule.id, 'student-1')).toBe(true);
    expect(scheduler.isParticipantAllowed(schedule.id, 'student-2')).toBe(false);
  });
});
