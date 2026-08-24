import { QuestionManager } from './question-bank/questions/QuestionManager';
import { CategoryManager } from './question-bank/categories/CategoryManager';
import { TagManager } from './question-bank/tags/TagManager';
import { DifficultyManager } from './question-bank/difficulty/DifficultyManager';
import { ExamBuilder } from './exam-builder/ExamBuilder';
import { Scheduler } from './scheduling/Scheduler';
import { SessionManager } from './sessions/SessionManager';
import { GradingEngine } from './grading/GradingEngine';
import { ReportGenerator } from './reports/ReportGenerator';
import { CertificateGenerator } from './certificates/CertificateGenerator';
import { AssessmentAnalyticsEngine } from './analytics/AssessmentAnalytics';
import { SecurityManager } from './security/SecurityManager';

export class CasuyaExams {
  public readonly questions: QuestionManager;
  public readonly categories: CategoryManager;
  public readonly tags: TagManager;
  public readonly difficulty: DifficultyManager;
  public readonly examBuilder: ExamBuilder;
  public readonly scheduling: Scheduler;
  public readonly sessions: SessionManager;
  public readonly grading: GradingEngine;
  public readonly reports: ReportGenerator;
  public readonly certificates: CertificateGenerator;
  public readonly analytics: AssessmentAnalyticsEngine;
  public readonly security: SecurityManager;

  constructor() {
    this.tags = new TagManager();
    this.categories = new CategoryManager();
    this.difficulty = new DifficultyManager();
    this.questions = new QuestionManager(this.tags);
    this.examBuilder = new ExamBuilder(this.questions);
    this.scheduling = new Scheduler(this.examBuilder);
    this.sessions = new SessionManager(this.examBuilder, this.scheduling);
    this.grading = new GradingEngine(this.questions, this.examBuilder);
    this.reports = new ReportGenerator(this.grading, this.examBuilder);
    this.certificates = new CertificateGenerator(this.grading, this.examBuilder);
    this.analytics = new AssessmentAnalyticsEngine(this.grading, this.examBuilder, this.questions);
    this.security = new SecurityManager();
  }
}
