export type QuestionType =
  | 'multiple-choice'
  | 'single-choice'
  | 'true-false'
  | 'short-answer'
  | 'essay'
  | 'matching'
  | 'fill-blank'
  | 'ordering';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'very-hard';

export type ExamStatus = 'draft' | 'published' | 'scheduled' | 'active' | 'completed' | 'archived';

export type SessionStatus =
  'pending' | 'active' | 'paused' | 'completed' | 'timeout' | 'terminated';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

export interface MatchingPair {
  id: string;
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  body: string;
  options?: QuestionOption[];
  matchingPairs?: MatchingPair[];
  correctAnswer?: string | string[];
  points: number;
  difficulty: DifficultyLevel;
  categoryId: string;
  tags: string[];
  explanation?: string;
  hints?: string[];
  metadata: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionTag {
  id: string;
  name: string;
  createdAt: Date;
}

export interface DifficultyConfig {
  level: DifficultyLevel;
  label: string;
  color: string;
  weight: number;
  description: string;
}

export interface ExamSection {
  id: string;
  title: string;
  instructions: string;
  questionIds: string[];
  randomizeOrder: boolean;
  timeLimit?: number;
  pointsPerQuestion: number;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  status: ExamStatus;
  sections: ExamSection[];
  timeLimit: number;
  passingScore: number;
  maxAttempts: number;
  randomizeSections: boolean;
  showResults: boolean;
  metadata: Record<string, unknown>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExamSchedule {
  id: string;
  examId: string;
  startTime: Date;
  endTime: Date;
  timezone: string;
  allowedParticipants: string[];
  maxParticipants: number;
  proctoringEnabled: boolean;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface Answer {
  questionId: string;
  value: string | string[];
  startedAt: Date;
  submittedAt: Date;
  isFlagged: boolean;
}

export interface ExamSession {
  id: string;
  examId: string;
  scheduleId?: string;
  participantId: string;
  status: SessionStatus;
  startedAt: Date;
  completedAt?: Date;
  timeRemaining: number;
  answers: Answer[];
  flaggedQuestions: string[];
  metadata: Record<string, unknown>;
}

export interface GradingResult {
  questionId: string;
  type: QuestionType;
  pointsAwarded: number;
  pointsPossible: number;
  isCorrect: boolean;
  feedback?: string;
  gradedAt: Date;
  gradedBy: 'auto' | 'manual' | 'pending';
  graderId?: string;
}

export interface ExamResult {
  id: string;
  sessionId: string;
  examId: string;
  participantId: string;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
  passed: boolean;
  results: GradingResult[];
  startedAt: Date;
  completedAt: Date;
  timeTaken: number;
  metadata: Record<string, unknown>;
}

export interface ExamReport {
  id: string;
  examId: string;
  title: string;
  type: 'summary' | 'detailed' | 'individual' | 'comparative';
  generatedAt: Date;
  data: Record<string, unknown>;
  filters?: ReportFilter[];
}

export interface ReportFilter {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'between';
  value: unknown;
}

export interface Certificate {
  id: string;
  participantId: string;
  examId: string;
  resultId: string;
  title: string;
  issuedAt: Date;
  expiresAt?: Date;
  verificationCode: string;
  metadata: Record<string, unknown>;
}

export interface AssessmentAnalytics {
  examId: string;
  totalParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  medianScore: number;
  standardDeviation: number;
  passRate: number;
  averageTime: number;
  questionAnalytics: QuestionAnalytics[];
  difficultyBreakdown: Record<DifficultyLevel, number>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

export interface QuestionAnalytics {
  questionId: string;
  totalAttempts: number;
  correctAttempts: number;
  partialAttempts: number;
  incorrectAttempts: number;
  skippedAttempts: number;
  averageTime: number;
  difficultyIndex: number;
  discriminationIndex: number;
}

export interface SecurityRule {
  id: string;
  name: string;
  type:
    | 'ip-restriction'
    | 'time-restriction'
    | 'attempt-limit'
    | 'device-restriction'
    | 'proctoring'
    | 'copy-protection';
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface ProctoringEvent {
  id: string;
  sessionId: string;
  type: 'tab-switch' | 'copy-paste' | 'right-click' | 'timeout-warning' | 'suspicious-activity';
  timestamp: Date;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface QuestionFilter {
  type?: QuestionType;
  difficulty?: DifficultyLevel;
  categoryId?: string;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}

export interface ExamFilter {
  status?: ExamStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
