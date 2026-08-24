import { CasuyaExams } from 'casuya-exams';

let exams: CasuyaExams;

export async function initExams() {
  exams = new CasuyaExams();
}

export const examOps = {
  // Questions (sync)
  question(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.questions;
    switch (action) {
      case 'create': return m.create(body as Parameters<typeof m.create>[0]);
      case 'get': return m.get(id!);
      case 'update': return m.update(id!, body as Parameters<typeof m.update>[1]);
      case 'delete': return m.delete(id!);
      case 'list': return m.getAll();
      case 'filter': return m.filter(body || {});
      case 'random': return m.getRandom((body.count as number) || 5, body.filter as Parameters<typeof m.getRandom>[1]);
      case 'byType': return m.getByType(body.type as Parameters<typeof m.getByType>[0]);
      case 'byDifficulty': return m.getByDifficulty(body.difficulty as Parameters<typeof m.getByDifficulty>[0]);
      case 'byCategory': return m.getByCategory(body.categoryId as string);
      case 'byTags': return m.getByTags(body.tags as string[]);
      default: throw new Error(`Unknown question action: ${action}`);
    }
  },
  // Categories (sync)
  category(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.categories;
    switch (action) {
      case 'create': return m.create(body as Parameters<typeof m.create>[0]);
      case 'get': return m.get(id!);
      case 'list': return m.getAll();
      case 'children': return m.getChildren(id!);
      case 'root': return m.getRootCategories();
      case 'path': return m.getPath(id!);
      case 'search': return m.search(body.query as string);
      case 'delete': return m.delete(id!);
      case 'update': return m.update(id!, body as Parameters<typeof m.update>[1]);
      default: throw new Error(`Unknown category action: ${action}`);
    }
  },
  // Tags (sync)
  tag(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.tags;
    switch (action) {
      case 'create': return m.create((body.name as string) || body as unknown as Parameters<typeof m.create>[0]);
      case 'get': return m.get(id!);
      case 'list': return m.getAll();
      case 'byName': return m.findByName(body.name as string);
      case 'popular': return m.getPopularTags(body.limit as number | undefined);
      case 'suggest': return m.suggest(body.prefix as string, body.limit as number | undefined);
      case 'delete': return m.delete(id!);
      default: throw new Error(`Unknown tag action: ${action}`);
    }
  },
  // Exams (sync)
  exam(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.examBuilder;
    switch (action) {
      case 'create': return m.create(body as unknown as Parameters<typeof m.create>[0]);
      case 'get': return m.get(id!);
      case 'list': return m.getAll();
      case 'publish': return m.publish(id!);
      case 'archive': return m.archive(id!);
      case 'filter': return m.filter(body || {});
      case 'addSection': return m.addSection(id!, body as unknown as Parameters<typeof m.addSection>[1]);
      case 'addQuestions': return m.addQuestionsToSection(id!, body.sectionId as string, body.questionIds as string[]);
      case 'autoFill': return m.autoFillSection(id!, body.sectionId as string, (body.criteria as unknown as Parameters<typeof m.autoFillSection>[2]) || {});
      case 'removeSection': return m.removeSection(id!, body.sectionId as string);
      default: throw new Error(`Unknown exam action: ${action}`);
    }
  },
  // Scheduling (sync)
  schedule(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.scheduling;
    switch (action) {
      case 'create': return m.schedule(body as unknown as Parameters<typeof m.schedule>[0]);
      case 'get': return m.get(id!);
      case 'list': return m.getAll();
      case 'upcoming': return m.getUpcoming(body.limit as number | undefined);
      case 'active': return m.getActive();
      case 'reschedule': return m.reschedule(id!, new Date(body.startTime as string | number), new Date(body.endTime as string | number));
      case 'cancel': return m.cancel(id!);
      case 'activate': return m.activate(id!);
      case 'complete': return m.complete(id!);
      default: throw new Error(`Unknown schedule action: ${action}`);
    }
  },
  // Sessions (sync)
  session(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.sessions;
    switch (action) {
      case 'start': return m.start(body.examId as string, body.participantId as string, body.scheduleId as string);
      case 'get': return m.get(id!);
      case 'submit': return m.submitAnswer(id!, body.answer as Parameters<typeof m.submitAnswer>[1]);
      case 'complete': return m.complete(id!);
      case 'pause': return m.pause(id!);
      case 'resume': return m.resume(id!);
      case 'terminate': return m.terminate(id!);
      case 'list': return m.getAll();
      case 'byExam': return m.getByExam(body.examId as string);
      case 'byParticipant': return m.getByParticipant(body.participantId as string);
      default: throw new Error(`Unknown session action: ${action}`);
    }
  },
  grade(examId: string, body: Record<string, unknown>) {
    return exams.grading.grade(body.sessionId as string, examId, body.participantId as string, body.answers as Parameters<typeof exams.grading.grade>[3], new Date(body.startedAt as string | number), new Date(body.completedAt as string | number));
  },
  // Reports (sync)
  report(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.reports;
    switch (action) {
      case 'summary': return m.generateSummary(body.examId as string, body.filters as Parameters<typeof m.generateSummary>[1]);
      case 'detailed': return m.generateDetailed(body.examId as string, body.filters as Parameters<typeof m.generateDetailed>[1]);
      case 'individual': return m.generateIndividual(id!);
      case 'comparative': return m.generateComparative(body.examIds as string[], body.filters as Parameters<typeof m.generateComparative>[1]);
      default: throw new Error(`Unknown report action: ${action}`);
    }
  },
  certificate(action: string, body: Record<string, unknown>, id?: string) {
    const m = exams.certificates;
    switch (action) {
      case 'generate': return m.generate(body.participantId as string, body.examId as string, body.resultId as string, body.templateId as string);
      case 'generateBatch': return m.generateBatch(body.results as Parameters<typeof m.generateBatch>[0]);
      case 'verify': return m.verify(body.verificationCode as string);
      case 'render': return m.render(id!, body.templateId as string | undefined);
      default: throw new Error(`Unknown certificate action: ${action}`);
    }
  },
  // Analytics (sync)
  analytics(examId: string) {
    return exams.analytics.analyze(examId);
  },
  // Security (sync)
  security(action: string, body: Record<string, unknown>) {
    const m = exams.security;
    switch (action) {
      case 'checkAttempt': return m.checkAttemptLimit(body.participantId as string, body.examId as string);
      case 'recordAttempt': m.recordAttempt(body.participantId as string, body.examId as string); return { ok: true };
      case 'violations': return m.getSessionViolations(body.sessionId as string, body.minSeverity as Parameters<typeof m.getSessionViolations>[1]);
      case 'compromised': return m.isSessionCompromised(body.sessionId as string);
      case 'registerRule': return m.registerRule(body as Parameters<typeof m.registerRule>[0]);
      default: throw new Error(`Unknown security action: ${action}`);
    }
  },
};
