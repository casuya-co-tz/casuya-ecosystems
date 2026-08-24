import { CasuyaExams } from '../../src/CasuyaExams';
import { QuestionManager } from '../../src/question-bank/questions/QuestionManager';
import { CategoryManager } from '../../src/question-bank/categories/CategoryManager';
import { TagManager } from '../../src/question-bank/tags/TagManager';
import { DifficultyManager } from '../../src/question-bank/difficulty/DifficultyManager';
import { ExamBuilder } from '../../src/exam-builder/ExamBuilder';
import { Scheduler } from '../../src/scheduling/Scheduler';
import { SessionManager } from '../../src/sessions/SessionManager';
import { GradingEngine } from '../../src/grading/GradingEngine';
import { ReportGenerator } from '../../src/reports/ReportGenerator';
import { CertificateGenerator } from '../../src/certificates/CertificateGenerator';
import { AssessmentAnalyticsEngine } from '../../src/analytics/AssessmentAnalytics';
import { SecurityManager } from '../../src/security/SecurityManager';

describe('CasuyaExams', () => {
  it('should instantiate all sub-managers', () => {
    const exams = new CasuyaExams();

    expect(exams.questions).toBeInstanceOf(QuestionManager);
    expect(exams.categories).toBeInstanceOf(CategoryManager);
    expect(exams.tags).toBeInstanceOf(TagManager);
    expect(exams.difficulty).toBeInstanceOf(DifficultyManager);
    expect(exams.examBuilder).toBeInstanceOf(ExamBuilder);
    expect(exams.scheduling).toBeInstanceOf(Scheduler);
    expect(exams.sessions).toBeInstanceOf(SessionManager);
    expect(exams.grading).toBeInstanceOf(GradingEngine);
    expect(exams.reports).toBeInstanceOf(ReportGenerator);
    expect(exams.certificates).toBeInstanceOf(CertificateGenerator);
    expect(exams.analytics).toBeInstanceOf(AssessmentAnalyticsEngine);
    expect(exams.security).toBeInstanceOf(SecurityManager);
  });

  it('should support end-to-end workflow', () => {
    const exams = new CasuyaExams();

    const category = exams.categories.create({ name: 'Math', description: 'Math questions' });
    const tag = exams.tags.create('algebra');

    const q1 = exams.questions.create({
      type: 'multiple-choice',
      title: 'What is x in x+2=5?',
      body: 'Solve for x',
      options: [
        { id: 'a', text: '2', isCorrect: false, order: 0 },
        { id: 'b', text: '3', isCorrect: true, order: 1 },
        { id: 'c', text: '5', isCorrect: false, order: 2 },
      ],
      points: 10,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [tag.id],
      metadata: {},
    });

    const q2 = exams.questions.create({
      type: 'true-false',
      title: '2+2=4',
      body: 'Is this true?',
      options: [
        { id: 'true', text: 'True', isCorrect: true, order: 0 },
        { id: 'false', text: 'False', isCorrect: false, order: 1 },
      ],
      points: 5,
      difficulty: 'easy',
      categoryId: category.id,
      tags: [tag.id],
      metadata: {},
    });

    const exam = exams.examBuilder.create({
      title: 'Algebra Test',
      description: 'Test your algebra skills',
      timeLimit: 30,
      passingScore: 50,
    });

    const section = exams.examBuilder.addSection(exam.id, {
      title: 'Algebra',
      pointsPerQuestion: 10,
    })!;

    exams.examBuilder.addQuestionsToSection(exam.id, section.id, [q1.id, q2.id]);
    exams.examBuilder.publish(exam.id);

    const schedule = exams.scheduling.schedule({
      examId: exam.id,
      startTime: new Date('2025-01-01T10:00:00Z'),
      endTime: new Date('2025-01-01T12:00:00Z'),
      timezone: 'UTC',
      allowedParticipants: ['student-1'],
      maxParticipants: 30,
      proctoringEnabled: false,
    });

    const session = exams.sessions.start(exam.id, 'student-1', schedule.id);

    const startedAt = new Date();
    exams.sessions.submitAnswer(session.id, {
      questionId: q1.id,
      value: 'b',
      startedAt,
      isFlagged: false,
    });
    exams.sessions.submitAnswer(session.id, {
      questionId: q2.id,
      value: 'true',
      startedAt,
      isFlagged: false,
    });

    const completedSession = exams.sessions.complete(session.id);

    const result = exams.grading.grade(
      session.id,
      exam.id,
      'student-1',
      completedSession!.answers,
      completedSession!.startedAt,
      completedSession!.completedAt!,
    );

    expect(result.percentage).toBe(100);
    expect(result.passed).toBe(true);

    const analytics = exams.analytics.analyze(exam.id);
    expect(analytics.totalParticipants).toBe(1);
    expect(analytics.averageScore).toBe(100);

    const cert = exams.certificates.generate('student-1', exam.id, result.id);
    expect(cert).toBeDefined();
    expect(exams.certificates.verify(cert!.verificationCode)).toBeDefined();
  });
});
