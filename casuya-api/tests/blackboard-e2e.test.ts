import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { RestEngine } from '../src/rest/rest-engine';
import { createBlackboardContracts } from '../src/blackboard-handlers';

describe('Blackboard REST endpoints (end-to-end)', () => {
  let app: any;

  beforeAll(async () => {
    const engine = new RestEngine({ port: 0, logger: undefined as any });
    for (const { contract, handler } of createBlackboardContracts()) {
      engine.registerRoute(contract as any, handler as any);
    }
    app = engine.getApp();
    app.use('/api', engine.getRegistrar().getRouter());
  });

  it('validates a correct step via casuya-exams grading', async () => {
    const res = await request(app)
      .post('/api/exams/validate-step')
      .send({ step: { stepNumber: 1, recognizedLatex: 'x = 5', expectedAnswer: 'x=5' } });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(true);
    expect(res.body.score).toBe(1);
  });

  it('marks an incorrect step as wrong', async () => {
    const res = await request(app)
      .post('/api/exams/validate-step')
      .send({ step: { stepNumber: 2, recognizedLatex: 'x = 4', expectedAnswer: 'x=5' } });
    expect(res.status).toBe(200);
    expect(res.body.correct).toBe(false);
  });

  it('submits an exam and aggregates the score', async () => {
    const res = await request(app)
      .post('/api/exams/submit')
      .send({
        lessonId: 'l1',
        studentId: 's1',
        steps: [
          { stepNumber: 1, recognizedLatex: 'x=5', expectedAnswer: 'x=5' },
          { stepNumber: 2, recognizedLatex: 'y=4', expectedAnswer: 'y=4' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.totalScore).toBe(2);
    expect(res.body.maxScore).toBe(2);
    expect(res.body.percentage).toBe(100);
    expect(res.body.passed).toBe(true);
  });

  it('syncs and retrieves progress for a student+lesson', async () => {
    await request(app)
      .post('/api/progress/sync')
      .send({ student_id: 's1', lesson_id: 'l1', step: 3, elements: [{ type: 'stroke' }], timestamp: Date.now() });

    const res = await request(app).get('/api/progress/s1/l1');
    expect(res.status).toBe(200);
    expect(res.body.step).toBe(3);
    expect(Array.isArray(res.body.elements)).toBe(true);
  });

  it('returns 404 when no progress exists', async () => {
    const res = await request(app).get('/api/progress/nobody/nolesson');
    expect(res.status).toBe(404);
  });

  it('solves an equation via casuya-math', async () => {
    const res = await request(app).post('/api/math/solve').send({ equation: 'E = 2 * 3' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('solution');
  });

  it('checks equivalence of two expressions', async () => {
    const res = await request(app)
      .post('/api/math/equivalence')
      .send({ expr1: '2*x + 3', expr2: '2*x+3' });
    expect(res.status).toBe(200);
    expect(res.body.equivalent).toBe(true);
  });

  it('grades a structured exam through casuya-exams GradingEngine', async () => {
    // Create an exam with two single-choice questions.
    const createRes = await request(app)
      .post('/api/exams')
      .send({
        exam: {
          id: 'exam-abc',
          title: 'Algebra Quiz',
          description: '',
          status: 'published',
          sections: [{ id: 's1', title: 'Q', instructions: '', questionIds: ['q1', 'q2'], randomizeOrder: false, pointsPerQuestion: 1 }],
          timeLimit: 600,
          passingScore: 50,
          maxAttempts: 1,
          randomizeSections: false,
          showResults: true,
          metadata: {},
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        questions: [
          {
            id: 'q1', type: 'single-choice', title: 'Q1', body: '2+2?',
            options: [
              { id: 'a', text: '4', isCorrect: true, order: 0 },
              { id: 'b', text: '5', isCorrect: false, order: 1 },
            ],
            points: 1, difficulty: 'easy', categoryId: 'cat', tags: [], metadata: {},
            version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
          {
            id: 'q2', type: 'single-choice', title: 'Q2', body: '3+3?',
            options: [
              { id: 'a', text: '6', isCorrect: true, order: 0 },
              { id: 'b', text: '7', isCorrect: false, order: 1 },
            ],
            points: 1, difficulty: 'easy', categoryId: 'cat', tags: [], metadata: {},
            version: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          },
        ],
      });
    expect(createRes.status).toBe(200);
    expect(createRes.body.examId).toBe('exam-abc');

    const submitRes = await request(app)
      .post('/api/exams/submit')
      .send({ examId: 'exam-abc', studentId: 's1', answers: [
        { questionId: 'q1', value: 'a' },
        { questionId: 'q2', value: 'b' },
      ] });
    expect(submitRes.status).toBe(200);
    expect(submitRes.body.totalScore).toBe(1);
    expect(submitRes.body.maxScore).toBe(2);
    expect(submitRes.body.percentage).toBe(50);
    expect(submitRes.body.passed).toBe(true);
    expect(submitRes.body.results).toHaveLength(2);
  });

  it('returns 404 grading a non-existent exam', async () => {
    const res = await request(app)
      .post('/api/exams/submit')
      .send({ examId: 'nope', studentId: 's1', answers: [] });
    expect(res.status).toBe(404);
  });
});
