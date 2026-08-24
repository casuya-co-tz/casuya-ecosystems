import { SessionManager } from '../../src/sessions/SessionManager';
import { ExamBuilder } from '../../src/exam-builder/ExamBuilder';
import { Scheduler } from '../../src/scheduling/Scheduler';
import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let examBuilder: ExamBuilder;
  let scheduler: Scheduler;
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
    sessionManager = new SessionManager(examBuilder, scheduler);

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

  it('should start a session', () => {
    const session = sessionManager.start(examId, 'student-1');
    expect(session.id).toBeTruthy();
    expect(session.status).toBe('active');
    expect(session.timeRemaining).toBe(3600);
  });

  it('should not start session for unpublished exam', () => {
    const draftExam = examBuilder.create({
      title: 'Draft',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    expect(() => {
      sessionManager.start(draftExam.id, 'student-1');
    }).toThrow('Exam is not published');
  });

  it('should not allow duplicate active sessions', () => {
    sessionManager.start(examId, 'student-1');
    expect(() => {
      sessionManager.start(examId, 'student-1');
    }).toThrow('already has an active session');
  });

  it('should submit answers', () => {
    const session = sessionManager.start(examId, 'student-1');
    const answer = sessionManager.submitAnswer(session.id, {
      questionId: 'q1',
      value: 'answer',
      startedAt: new Date(),
      isFlagged: false,
    });
    expect(answer).toBeDefined();
    expect(answer?.value).toBe('answer');
  });

  it('should flag and unflag questions', () => {
    const session = sessionManager.start(examId, 'student-1');
    expect(sessionManager.flagQuestion(session.id, 'q1')).toBe(true);
    expect(sessionManager.get(session.id)?.flaggedQuestions).toContain('q1');

    expect(sessionManager.unflagQuestion(session.id, 'q1')).toBe(true);
    expect(sessionManager.get(session.id)?.flaggedQuestions).not.toContain('q1');
  });

  it('should pause and resume sessions', () => {
    const session = sessionManager.start(examId, 'student-1');
    expect(sessionManager.pause(session.id)).toBe(true);
    expect(sessionManager.get(session.id)?.status).toBe('paused');

    expect(sessionManager.resume(session.id)).toBe(true);
    expect(sessionManager.get(session.id)?.status).toBe('active');
  });

  it('should complete sessions', () => {
    const session = sessionManager.start(examId, 'student-1');
    const completed = sessionManager.complete(session.id);
    expect(completed?.status).toBe('completed');
    expect(completed?.completedAt).toBeDefined();
  });

  it('should timeout sessions', () => {
    const session = sessionManager.start(examId, 'student-1');
    const timedOut = sessionManager.timeout(session.id);
    expect(timedOut?.status).toBe('timeout');
  });

  it('should terminate sessions', () => {
    const session = sessionManager.start(examId, 'student-1');
    const terminated = sessionManager.terminate(session.id);
    expect(terminated?.status).toBe('terminated');
  });
});
