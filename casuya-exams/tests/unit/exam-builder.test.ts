import { ExamBuilder } from '../../src/exam-builder/ExamBuilder';
import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';

describe('ExamBuilder', () => {
  let examBuilder: ExamBuilder;
  let questionManager: QuestionManager;
  let tagManager: TagManager;
  let categoryManager: CategoryManager;
  let categoryId: string;

  beforeEach(() => {
    tagManager = new TagManager();
    categoryManager = new CategoryManager();
    questionManager = new QuestionManager(tagManager);
    examBuilder = new ExamBuilder(questionManager);

    const category = categoryManager.create({ name: 'Math', description: '' });
    categoryId = category.id;
  });

  it('should create an exam', () => {
    const exam = examBuilder.create({
      title: 'Math Final',
      description: 'Final exam for math',
      timeLimit: 60,
      passingScore: 50,
    });
    expect(exam.id).toBeTruthy();
    expect(exam.title).toBe('Math Final');
    expect(exam.status).toBe('draft');
  });

  it('should validate exam creation', () => {
    expect(() => {
      examBuilder.create({
        title: '',
        description: '',
        timeLimit: 0,
        passingScore: -1,
      });
    }).toThrow('Validation failed');
  });

  it('should add sections', () => {
    const exam = examBuilder.create({
      title: 'Test Exam',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 60,
    });
    const section = examBuilder.addSection(exam.id, {
      title: 'Section 1',
      instructions: 'Answer all',
    });
    expect(section).toBeDefined();
    expect(section?.title).toBe('Section 1');

    const updated = examBuilder.get(exam.id);
    expect(updated?.sections.length).toBe(1);
  });

  it('should add questions to section', () => {
    const exam = examBuilder.create({
      title: 'Test',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    const section = examBuilder.addSection(exam.id, { title: 'S1' })!;

    const q1 = questionManager.create({
      type: 'multiple-choice',
      title: 'Q1',
      body: 'Body',
      options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
      points: 1,
      difficulty: 'easy',
      categoryId,
      tags: [],
      metadata: {},
    });

    const result = examBuilder.addQuestionsToSection(exam.id, section.id, [q1.id]);
    expect(result).toBe(true);

    const updated = examBuilder.get(exam.id);
    expect(updated?.sections[0].questionIds.length).toBe(1);
  });

  it('should auto-fill section with random questions', () => {
    for (let i = 0; i < 5; i++) {
      questionManager.create({
        type: 'multiple-choice',
        title: `Q${i}`,
        body: 'Body',
        options: [{ id: 'a', text: 'A', isCorrect: true, order: 0 }],
        points: 1,
        difficulty: 'easy',
        categoryId,
        tags: [],
        metadata: {},
      });
    }

    const exam = examBuilder.create({
      title: 'Test',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    const section = examBuilder.addSection(exam.id, { title: 'S1' })!;

    const count = examBuilder.autoFillSection(exam.id, section.id, { count: 3 });
    expect(count).toBe(3);
  });

  it('should publish only if sections have questions', () => {
    const exam = examBuilder.create({
      title: 'Test',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });

    expect(examBuilder.publish(exam.id)).toBe(false);

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

    expect(examBuilder.publish(exam.id)).toBe(true);
    expect(examBuilder.get(exam.id)?.status).toBe('published');
  });

  it('should archive an exam', () => {
    const exam = examBuilder.create({
      title: 'Old',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    examBuilder.archive(exam.id);
    expect(examBuilder.get(exam.id)?.status).toBe('archived');
  });

  it('should calculate total points', () => {
    const exam = examBuilder.create({
      title: 'Test',
      description: 'Desc',
      timeLimit: 30,
      passingScore: 50,
    });
    const section = examBuilder.addSection(exam.id, {
      title: 'S1',
      pointsPerQuestion: 5,
    })!;

    for (let i = 0; i < 3; i++) {
      const q = questionManager.create({
        type: 'true-false',
        title: `Q${i}`,
        body: 'Body',
        options: [
          { id: 'true', text: 'True', isCorrect: true, order: 0 },
          { id: 'false', text: 'False', isCorrect: false, order: 1 },
        ],
        points: 5,
        difficulty: 'easy',
        categoryId,
        tags: [],
        metadata: {},
      });
      examBuilder.addQuestionsToSection(exam.id, section.id, [q.id]);
    }

    expect(examBuilder.getTotalPoints(exam.id)).toBe(15);
    expect(examBuilder.getTotalQuestions(exam.id)).toBe(3);
  });
});
