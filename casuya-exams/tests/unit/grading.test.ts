import { GradingEngine } from '../../src/grading/GradingEngine';
import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';
import { ExamBuilder } from '../../src/exam-builder/ExamBuilder';
import { Question, Answer } from '../../src/types';

describe('GradingEngine', () => {
  let gradingEngine: GradingEngine;
  let questionManager: QuestionManager;
  let examBuilder: ExamBuilder;
  let tagManager: TagManager;
  let categoryManager: CategoryManager;
  let categoryId: string;

  function createQuestion(overrides: Partial<Question> = {}): Question {
    return questionManager.create({
      type: 'multiple-choice',
      title: 'Test Question',
      body: 'Body',
      options: [
        { id: 'a', text: 'Wrong', isCorrect: false, order: 0 },
        { id: 'b', text: 'Correct', isCorrect: true, order: 1 },
        { id: 'c', text: 'Wrong', isCorrect: false, order: 2 },
      ],
      points: 10,
      difficulty: 'easy',
      categoryId,
      tags: [],
      metadata: {},
      ...overrides,
    });
  }

  beforeEach(() => {
    tagManager = new TagManager();
    categoryManager = new CategoryManager();
    questionManager = new QuestionManager(tagManager);
    examBuilder = new ExamBuilder(questionManager);
    gradingEngine = new GradingEngine(questionManager, examBuilder);

    const cat = categoryManager.create({ name: 'Test', description: '' });
    categoryId = cat.id;
  });

  describe('multiple-choice grading', () => {
    it('should mark correct answer as correct', () => {
      const q = createQuestion();
      const answer: Answer = {
        questionId: q.id,
        value: ['b'],
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const result = gradingEngine.gradeQuestion(q, answer);
      expect(result.isCorrect).toBe(true);
      expect(result.pointsAwarded).toBe(10);
    });

    it('should mark wrong answer as incorrect', () => {
      const q = createQuestion();
      const answer: Answer = {
        questionId: q.id,
        value: ['a'],
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const result = gradingEngine.gradeQuestion(q, answer);
      expect(result.isCorrect).toBe(false);
      expect(result.pointsAwarded).toBe(0);
    });

    it('should require all correct options', () => {
      const q = createQuestion({
        type: 'multiple-choice',
        options: [
          { id: 'a', text: 'Correct1', isCorrect: true, order: 0 },
          { id: 'b', text: 'Correct2', isCorrect: true, order: 1 },
          { id: 'c', text: 'Wrong', isCorrect: false, order: 2 },
        ],
      });
      const answer: Answer = {
        questionId: q.id,
        value: ['a'],
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const result = gradingEngine.gradeQuestion(q, answer);
      expect(result.isCorrect).toBe(false);
    });
  });

  describe('single-choice grading', () => {
    it('should grade single choice correctly', () => {
      const q = createQuestion({ type: 'single-choice' });
      const correct: Answer = {
        questionId: q.id,
        value: 'b',
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const wrong: Answer = {
        questionId: q.id,
        value: 'a',
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      expect(gradingEngine.gradeQuestion(q, correct).isCorrect).toBe(true);
      expect(gradingEngine.gradeQuestion(q, wrong).isCorrect).toBe(false);
    });
  });

  describe('true-false grading', () => {
    it('should grade true-false', () => {
      const q = createQuestion({
        type: 'true-false',
        options: [
          { id: 'true', text: 'True', isCorrect: true, order: 0 },
          { id: 'false', text: 'False', isCorrect: false, order: 1 },
        ],
      });
      const correct: Answer = {
        questionId: q.id,
        value: 'true',
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      expect(gradingEngine.gradeQuestion(q, correct).isCorrect).toBe(true);
    });
  });

  describe('essay grading', () => {
    it('should mark essay as requiring manual grading', () => {
      const q = createQuestion({ type: 'essay', options: undefined });
      const answer: Answer = {
        questionId: q.id,
        value: 'Some long essay answer...',
        startedAt: new Date(),
        submittedAt: new Date(),
        isFlagged: false,
      };
      const result = gradingEngine.gradeQuestion(q, answer);
      expect(result.gradedBy).toBe('manual');
      expect(result.pointsAwarded).toBe(0);
    });
  });

  describe('full exam grading', () => {
    it('should grade an entire exam', () => {
      const exam = examBuilder.create({
        title: 'Final',
        description: 'Desc',
        timeLimit: 60,
        passingScore: 50,
      });
      const section = examBuilder.addSection(exam.id, {
        title: 'S1',
        pointsPerQuestion: 10,
      })!;

      const q1 = createQuestion({ type: 'single-choice' });
      const q2 = createQuestion({
        type: 'single-choice',
        title: 'Q2',
        options: [
          { id: 'x', text: 'X', isCorrect: true, order: 0 },
          { id: 'y', text: 'Y', isCorrect: false, order: 1 },
        ],
        correctAnswer: 'x',
      });

      examBuilder.addQuestionsToSection(exam.id, section.id, [q1.id, q2.id]);
      examBuilder.publish(exam.id);

      const startedAt = new Date();
      const completedAt = new Date(startedAt.getTime() + 300000);

      const result = gradingEngine.grade(
        'session-1',
        exam.id,
        'student-1',
        [
          {
            questionId: q1.id,
            value: 'b',
            startedAt,
            submittedAt: completedAt,
            isFlagged: false,
          },
          {
            questionId: q2.id,
            value: 'x',
            startedAt,
            submittedAt: completedAt,
            isFlagged: false,
          },
        ],
        startedAt,
        completedAt,
      );

      expect(result.earnedPoints).toBe(20);
      expect(result.totalPoints).toBe(20);
      expect(result.percentage).toBe(100);
      expect(result.passed).toBe(true);
      expect(result.results.length).toBe(2);
    });
  });
});
