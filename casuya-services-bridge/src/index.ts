import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { initContent, content } from './content';
import { initExams, examOps } from './exams';
import { initMedia, mediaOps } from './media';
import { initAuth, authOps } from './auth';
import { initAnalytics, analyticsOps } from './analytics';
import { initSearch, searchOps } from './search';

const app = express();
const PORT = parseInt(process.env.PORT || process.env.CASUYA_SERVICES_BRIDGE_PORT || '3003', 10);

app.use(helmet());
app.use(cors());
app.use(morgan('tiny'));
app.use(express.json({ limit: '25mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'casuya-services-bridge', version: '1.0.0' });
});

function asyncHandler(fn: (req: express.Request, res: express.Response) => Promise<unknown>) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const result = await fn(req, res);
      res.json(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error && process.env.NODE_ENV === 'development' ? err.stack : undefined;
      res.status(400).json({ error: message, stack });
    }
  };
}

// ─── Content ────────────────────────────────────────────────────────────────
app.post('/content', asyncHandler(async (req) => content.create(req.body)));
app.get('/content/slug/:slug', asyncHandler(async (req) => content.getBySlug(req.params.slug)));
app.get('/content', asyncHandler(async (req) => content.list(req.query)));
app.post('/content/categories', asyncHandler(async (req) => content.categories('create', req.body)));
app.get('/content/categories', asyncHandler(async () => content.categories('list', {})));
app.get('/content/categories/:id/children', asyncHandler(async (req) => content.categories('children', {}, req.params.id)));
app.get('/content/categories/:id/descendants', asyncHandler(async (req) => content.categories('descendants', {}, req.params.id)));
app.get('/content/categories/:id', asyncHandler(async (req) => content.categories('get', {}, req.params.id)));
app.delete('/content/categories/:id', asyncHandler(async (req) => content.categories('delete', {}, req.params.id)));
app.post('/content/tags', asyncHandler(async (req) => content.tags('create', req.body)));
app.get('/content/tags', asyncHandler(async () => content.tags('list', {})));
app.get('/content/tags/popular', asyncHandler(async () => content.tags('popular', {})));
app.get('/content/:id', asyncHandler(async (req) => content.get(req.params.id)));
app.put('/content/:id', asyncHandler(async (req) => content.update(req.params.id, req.body)));
app.delete('/content/:id', asyncHandler(async (req) => content.remove(req.params.id)));
app.post('/content/publish/:id', asyncHandler(async (req) => content.publish('publish', req.body, req.params.id)));
app.post('/content/unpublish/:id', asyncHandler(async (req) => content.publish('unpublish', {}, req.params.id)));
app.get('/content/publish/:id/state', asyncHandler(async (req) => content.publish('state', {}, req.params.id)));
app.post('/content/search', asyncHandler(async (req) => content.search(req.body)));

// ─── Exams ──────────────────────────────────────────────────────────────────
app.post('/exams/questions', asyncHandler(async (req) => examOps.question('create', req.body)));
app.get('/exams/questions', asyncHandler(async () => examOps.question('list', {})));
app.get('/exams/questions/:id', asyncHandler(async (req) => examOps.question('get', {}, req.params.id)));
app.put('/exams/questions/:id', asyncHandler(async (req) => examOps.question('update', req.body, req.params.id)));
app.delete('/exams/questions/:id', asyncHandler(async (req) => examOps.question('delete', {}, req.params.id)));
app.post('/exams/questions/filter', asyncHandler(async (req) => examOps.question('filter', req.body)));
app.post('/exams/categories', asyncHandler(async (req) => examOps.category('create', req.body)));
app.get('/exams/categories', asyncHandler(async () => examOps.category('list', {})));
app.post('/exams/tags', asyncHandler(async (req) => examOps.tag('create', req.body)));
app.get('/exams/tags', asyncHandler(async () => examOps.tag('list', {})));
app.post('/exams', asyncHandler(async (req) => examOps.exam('create', req.body)));
app.get('/exams', asyncHandler(async () => examOps.exam('list', {})));
app.get('/exams/:id', asyncHandler(async (req) => examOps.exam('get', {}, req.params.id)));
app.post('/exams/:id/publish', asyncHandler(async (req) => examOps.exam('publish', {}, req.params.id)));
app.post('/exams/:id/section', asyncHandler(async (req) => examOps.exam('addSection', req.body, req.params.id)));
app.post('/exams/:id/autofill', asyncHandler(async (req) => examOps.exam('autoFill', req.body, req.params.id)));
app.post('/exams/schedule', asyncHandler(async (req) => examOps.schedule('create', req.body)));
app.get('/exams/schedule/upcoming', asyncHandler(async () => examOps.schedule('upcoming', {})));
app.post('/exams/sessions', asyncHandler(async (req) => examOps.session('start', req.body)));
app.post('/exams/sessions/:id/submit', asyncHandler(async (req) => examOps.session('submit', req.body, req.params.id)));
app.post('/exams/sessions/:id/complete', asyncHandler(async (req) => examOps.session('complete', {}, req.params.id)));
app.post('/exams/grade', asyncHandler(async (req) => examOps.grade(req.body.examId, req.body)));
app.post('/exams/reports/summary', asyncHandler(async (req) => examOps.report('summary', req.body)));
app.post('/exams/reports/detailed', asyncHandler(async (req) => examOps.report('detailed', req.body)));
app.post('/exams/certificates', asyncHandler(async (req) => examOps.certificate('generate', req.body)));
app.post('/exams/certificates/verify', asyncHandler(async (req) => examOps.certificate('verify', req.body)));
app.post('/exams/analytics', asyncHandler(async (req) => examOps.analytics(req.body.examId)));
app.post('/exams/security', asyncHandler(async (req) => examOps.security(req.body.action, req.body)));

// ─── Media ──────────────────────────────────────────────────────────────────
app.post('/media/upload', asyncHandler(async (req) => mediaOps.upload(req.body)));
app.get('/media', asyncHandler(async (req) => mediaOps.list(req.query)));
app.get('/media/stats', asyncHandler(async () => mediaOps.stats()));
app.post('/media/search', asyncHandler(async (req) => mediaOps.search(req.body)));
app.get('/media/:id', asyncHandler(async (req) => mediaOps.get(req.params.id)));
app.delete('/media/:id', asyncHandler(async (req) => mediaOps.remove(req.params.id)));
app.get('/media/:id/deliver', asyncHandler(async (req) => mediaOps.deliver(req.params.id, req.query)));
app.post('/media/:id/thumbnail', asyncHandler(async (req) => mediaOps.thumbnail(req.params.id, req.body)));

// ─── Auth ───────────────────────────────────────────────────────────────────
app.post('/auth/register', asyncHandler(async (req) => authOps.register(req.body)));
app.post('/auth/login', asyncHandler(async (req) => authOps.login(req.body)));
app.post('/auth/verify', asyncHandler(async (req) => authOps.verifyToken(req.body.token)));
app.post('/auth/refresh', asyncHandler(async (req) => authOps.refresh(req.body)));
app.post('/auth/hash', asyncHandler(async (req) => authOps.hashPassword(req.body.password)));
app.post('/auth/verify-password', asyncHandler(async (req) => ({ valid: await authOps.verifyPassword(req.body.password, req.body.hash) })));
app.post('/auth/permission', asyncHandler(async (req) => authOps.checkPermission(req.body)));
app.get('/auth/roles/:userId', asyncHandler(async (req) => authOps.getUserRoles(req.params.userId)));
app.post('/auth/policy', asyncHandler(async (req) => authOps.createPolicy(req.body)));
app.post('/auth/policy/evaluate', asyncHandler(async (req) => authOps.evaluatePolicy(req.body)));
app.post('/auth/mfa/setup', asyncHandler(async (req) => authOps.setupMfa(req.body.userId, req.body.method)));
app.post('/auth/audit', asyncHandler(async (req) => authOps.audit(req.body)));

// ─── Analytics ──────────────────────────────────────────────────────────────
app.post('/analytics/ingest', asyncHandler(async (req) => analyticsOps.ingest(req.body)));
app.post('/analytics/aggregate', asyncHandler(async (req) => analyticsOps.aggregate(req.body)));
app.post('/analytics/event', asyncHandler(async (req) => analyticsOps.emit(req.body)));
app.post('/analytics/metric', asyncHandler(async (req) => analyticsOps.recordMetric(req.body)));
app.post('/analytics/metric/query', asyncHandler(async (req) => analyticsOps.queryMetric(req.body)));
app.post('/analytics/predict', asyncHandler(async (req) => analyticsOps.predict(req.body)));
app.post('/analytics/export', asyncHandler(async (req) => analyticsOps.exportData(req.body)));
app.post('/analytics/cache', asyncHandler(async (req) => analyticsOps.cacheSet(req.body)));
app.post('/analytics/cache/get', asyncHandler(async (req) => analyticsOps.cacheGet(req.body.key)));
app.post('/analytics/retention/rule', asyncHandler(async (req) => analyticsOps.retentionAddRule(req.body)));
app.post('/analytics/retention/evaluate', asyncHandler(async (req) => analyticsOps.retentionEvaluate()));
app.post('/analytics/report', asyncHandler(async (req) => analyticsOps.buildReport(req.body)));
app.post('/analytics/query', asyncHandler(async (req) => analyticsOps.buildQuery(req.body)));
app.get('/analytics/stats', asyncHandler(async () => analyticsOps.stats()));

// ─── Search ─────────────────────────────────────────────────────────────────
app.post('/search/index', asyncHandler(async (req) => searchOps.index(req.body)));
app.post('/search/index-batch', asyncHandler(async (req) => searchOps.indexBatch(req.body)));
app.delete('/search/:id', asyncHandler(async (req) => searchOps.remove(req.params.id)));
app.post('/search/query', asyncHandler(async (req) => searchOps.search(req.body)));
app.get('/search/suggestions', asyncHandler(async (req) => searchOps.suggestions(req.query.q as string)));
app.get('/search/recommendations/:userId', asyncHandler(async (req) => searchOps.recommendations(req.params.userId)));
app.post('/search/interaction', asyncHandler(async (req) => searchOps.recordInteraction(req.body)));
app.get('/search/stats', asyncHandler(async () => searchOps.stats()));
app.get('/search/trends', asyncHandler(async (req) => searchOps.trends(req.query.days ? parseInt(req.query.days as string) : undefined)));

async function start() {
  await initContent();
  await initExams();
  await initMedia();
  await initAuth();
  await initAnalytics();
  await initSearch();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[casuya-services-bridge] Running on http://0.0.0.0:${PORT}`);
    console.log(`[casuya-services-bridge] Health: http://localhost:${PORT}/health`);
  });
}

start().catch((err) => {
  console.error('Failed to start casuya-services-bridge:', err);
  process.exit(1);
});
