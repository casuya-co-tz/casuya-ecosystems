# Casuya Exams

**Examination Department** - Complete digital assessment capabilities for the Casuya platform.

## Overview

Casuya Exams is a Phase 2 educational repository that provides comprehensive digital assessment capabilities. It enables schools to manage question banks, generate exams, schedule assessments, conduct exam sessions, auto-grade objective questions, generate reports, issue certificates, and analyze assessment data.

## Features

- **Question Bank**: Full CRUD with categories, tags, difficulty levels, and versioning
- **Exam Builder**: Compose exams from sections with auto-fill and randomization
- **Scheduling**: Time-based scheduling with overlap detection and participant management
- **Exam Sessions**: Start, pause, resume, timeout, and complete exam sessions
- **Grading Engine**: Auto-grading for 8 question types with extensible strategy registry
- **Reports**: Summary, detailed, individual, and comparative report generation
- **Certificates**: Verifiable completion certificates with unique codes
- **Analytics**: Question difficulty index, discrimination index, and performance trends
- **Security**: Configurable rules, attempt limits, and proctoring event tracking

## Architecture

```
casuya-exams/
├── question-bank/         # Question management
│   ├── questions/         # CRUD, filter, search, random selection
│   ├── categories/        # Hierarchical categories
│   ├── tags/              # Normalized tags with usage tracking
│   └── difficulty/        # Configurable difficulty levels
├── exam-builder/          # Exam composition and section management
├── scheduling/            # Exam scheduling and participant management
├── sessions/              # Exam session lifecycle management
├── grading/               # Auto and manual grading with 8 strategies
├── reports/               # Summary, detailed, individual, comparative
├── certificates/          # Certificate generation with verification codes
├── analytics/             # Statistical analysis and question analytics
├── security/              # Security rules, proctoring, attempt limits
├── utilities/             # Shared utilities (ID gen, validation, statistics)
├── tests/                 # Unit and integration tests
└── src/
    ├── index.ts           # Public API exports
    ├── CasuyaExams.ts     # Unified orchestrator
    └── types.ts           # TypeScript type definitions
```

## Installation

```bash
npm install casuya-exams
```

## Quick Start

```typescript
import { CasuyaExams } from 'casuya-exams';

const exams = new CasuyaExams();

// Create a category and question
const category = exams.categories.create({ name: 'Mathematics', description: '' });
const question = exams.questions.create({
  type: 'multiple-choice',
  title: 'What is 2+2?',
  body: 'Choose the correct answer',
  options: [
    { id: 'a', text: '3', isCorrect: false, order: 0 },
    { id: 'b', text: '4', isCorrect: true, order: 1 },
  ],
  points: 10,
  difficulty: 'easy',
  categoryId: category.id,
  tags: [],
  metadata: {},
});

// Build an exam
const exam = exams.examBuilder.create({
  title: 'Math Quiz',
  description: 'Test your math skills',
  timeLimit: 30,
  passingScore: 50,
});

const section = exams.examBuilder.addSection(exam.id, { title: 'Section 1' })!;
exams.examBuilder.addQuestionsToSection(exam.id, section.id, [question.id]);
exams.examBuilder.publish(exam.id);

// Schedule and run
const schedule = exams.scheduling.schedule({
  examId: exam.id,
  startTime: new Date('2025-01-01T10:00:00Z'),
  endTime: new Date('2025-01-01T12:00:00Z'),
  timezone: 'UTC',
  allowedParticipants: [],
  maxParticipants: 0,
  proctoringEnabled: false,
});

const session = exams.sessions.start(exam.id, 'student-1');
exams.sessions.submitAnswer(session.id, {
  questionId: question.id,
  value: 'b',
  startedAt: new Date(),
  isFlagged: false,
});

const completed = exams.sessions.complete(session.id);

// Grade and generate report
const result = exams.grading.grade(
  session.id,
  exam.id,
  'student-1',
  completed!.answers,
  completed!.startedAt,
  completed!.completedAt!,
);

const report = exams.reports.generateSummary(exam.id);
console.log(`Score: ${result.percentage}%, Passed: ${result.passed}`);
```

## Supported Question Types

| Type              | Auto-Gradable | Description                |
| ----------------- | ------------- | -------------------------- |
| `multiple-choice` | Yes           | Select all correct options |
| `single-choice`   | Yes           | Select one correct option  |
| `true-false`      | Yes           | True or false              |
| `short-answer`    | Yes           | Text match                 |
| `essay`           | No (manual)   | Free-form text             |
| `matching`        | Yes           | Match left to right items  |
| `fill-blank`      | Yes           | Fill in the blank          |
| `ordering`        | Yes           | Order items correctly      |

## Extensibility

Register custom grading strategies, report exporters, certificate templates, and security rules:

```typescript
// Custom grading strategy
engine.registerStrategy('my-type', (question, answer) => ({
  questionId: question.id,
  type: 'my-type',
  pointsAwarded: customLogic(question, answer) ? question.points : 0,
  pointsPossible: question.points,
  isCorrect: true,
  gradedAt: new Date(),
  gradedBy: 'auto',
}));

// Custom report exporter
generator.registerExporter('pdf', (report) => generatePDF(report));
```

## API Reference

### Question Bank

- `exams.questions.create(data)` - Create a question
- `exams.questions.update(id, data)` - Update a question
- `exams.questions.delete(id)` - Delete a question
- `exams.questions.get(id)` - Get a question by ID
- `exams.questions.filter(filter)` - Filter questions with pagination
- `exams.questions.getRandom(count, filter?)` - Get random questions
- `exams.categories.*` - Category management
- `exams.tags.*` - Tag management
- `exams.difficulty.*` - Difficulty configuration

### Exam Builder

- `exams.examBuilder.create(config)` - Create an exam
- `exams.examBuilder.addSection(examId, config)` - Add a section
- `exams.examBuilder.addQuestionsToSection(...)` - Add questions
- `exams.examBuilder.autoFillSection(examId, sectionId, criteria)` - Auto-fill
- `exams.examBuilder.publish(id)` - Publish an exam

### Scheduling

- `exams.scheduling.schedule(data)` - Schedule an exam
- `exams.scheduling.cancel(id)` - Cancel a schedule
- `exams.scheduling.getUpcoming()` - Get upcoming schedules

### Sessions

- `exams.sessions.start(examId, participantId)` - Start a session
- `exams.sessions.submitAnswer(sessionId, answer)` - Submit an answer
- `exams.sessions.pause(id)` / `resume(id)` - Pause/resume
- `exams.sessions.complete(id)` - Complete a session

### Grading

- `exams.grading.grade(sessionId, examId, participantId, answers, ...)` - Full grading
- `exams.grading.gradeQuestion(question, answer)` - Grade single question
- `exams.grading.registerStrategy(type, strategy)` - Custom strategy

### Reports & Certificates

- `exams.reports.generateSummary(examId)` - Summary report
- `exams.reports.generateDetailed(examId)` - Detailed report
- `exams.reports.export(id, format)` - Export report
- `exams.certificates.generate(...)` - Generate certificate
- `exams.certificates.verify(code)` - Verify certificate

### Analytics & Security

- `exams.analytics.analyze(examId)` - Full assessment analytics
- `exams.security.registerRule(rule)` - Add security rule
- `exams.security.logProctoringEvent(event)` - Log proctoring event

## Scripts

| Command             | Description        |
| ------------------- | ------------------ |
| `npm run build`     | Compile TypeScript |
| `npm test`          | Run all tests      |
| `npm run lint`      | Lint code          |
| `npm run format`    | Format code        |
| `npm run typecheck` | TypeScript check   |
| `npm run clean`     | Remove dist        |

## License

MIT
