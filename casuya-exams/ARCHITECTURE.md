# Casuya Exams Architecture

## Design Principles

### Phase 2 Compliance

- **Feature Provider**: Only provides examination capabilities
- **No Authentication**: Delegates to casuya-platform
- **No Synchronization**: Delegates to casuya-bridge
- **No Lesson Execution**: Delegates to casuya-runtime
- **Internet Resilient**: Offline-capable sessions with autosave
- **Weak Device Friendly**: Lightweight algorithms, minimal memory footprint
- **Extensible**: Plugin-based strategy system for new question types, grading algorithms, and report formats

## Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CasuyaExams                          │
│                   (Unified Public Interface)                 │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬────┘
       │      │      │      │      │      │      │      │
       ▼      ▼      ▼      ▼      ▼      ▼      ▼      ▼
┌─────────┐┌───────┐┌──────┐┌──────┐┌──────┐┌──────┐┌──────┐┌────────┐
│Question ││Exam   ││Sched ││Sessn ││Grad  ││Report││Cert  ││Security│
│  Bank   ││Builder││  uler││Mgr   ││Engine││Gen   ││Gen   ││Manager │
└─────────┘└───────┘└──────┘└──────┘└──────┘└──────┘└──────┘└────────┘
```

## Module Dependencies

```
QuestionManager  ────────┐
TagManager       ────────┤
CategoryManager  ────────┤
DifficultyMgr    ────────┤
                         ▼
                    ExamBuilder  ──►  Scheduler
                         │
                         ▼
                    SessionManager
                         │
                         ▼
                    GradingEngine
                         │
               ┌────────┼────────┐
               ▼        ▼        ▼
        ReportGen  CertGen  Analytics

SecurityManager (cross-cutting)
```

## Data Flow

1. **Question Bank** stores all questions with categories, tags, and difficulty
2. **Exam Builder** composes questions into exam sections
3. **Scheduler** assigns time windows for exam delivery
4. **Session Manager** runs exam sessions, collects answers
5. **Grading Engine** evaluates answers (auto for objective, manual for subjective)
6. **Reports** aggregate results into summary/detailed/comparative views
7. **Certificates** issue verification-coded completion proofs
8. **Analytics** provide question-level and exam-level statistical analysis
9. **Security** enforces rules, tracks proctoring events, limits attempts

## Extensibility Points

| Interface             | Purpose                  | Default Implementations                    |
| --------------------- | ------------------------ | ------------------------------------------ |
| `GradingStrategy`     | Grade a question type    | 8 built-in (MCQ, TF, essay, etc.)          |
| `CertificateTemplate` | Render certificate       | 1 default text template                    |
| `ReportExporter`      | Export report format     | JSON, CSV                                  |
| `SecurityRule`        | Enforce exam security    | Copy protection, attempt limit, proctoring |
| `DifficultyConfig`    | Define difficulty levels | Easy, Medium, Hard, Very Hard              |
