import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { initDb, runQuery, runSingle, runExec, generateId, now } from './database';
import { AzamPayProvider } from '../providers/azampay/provider';

const app: express.Express = express();
const PORT = parseInt(process.env.CASUYA_PAYMENTS_PORT || '3002', 10);

const cache = new Map<string, { data: Record<string, unknown>; expires: number }>();
function cacheGet(key: string): Record<string, unknown> | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.data;
}
function cacheSet(key: string, data: Record<string, unknown>, ttlMs: number = 5000): void {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}
function cacheClear(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) cache.delete(key);
  }
}

app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(morgan('tiny'));
app.use(express.json({ limit: '10kb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'casuya-payments', version: '1.0.0' });
});

// ─── PAYMENTS ────────────────────────────────────────────────────────────────

app.get('/payments', (req, res) => {
  const { user_id, status, limit = '100', offset = '0' } = req.query;
  let sql = 'SELECT * FROM payments WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (status) { sql += ' AND status = ?'; params.push(status); }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string), parseInt(offset as string));

  res.json(runQuery(sql, params));
});

app.get('/payments/:id', (req, res) => {
  const row = runSingle('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Payment not found' });
  res.json(row);
});

app.post('/payments', (req, res) => {
  const { user_id, amount, currency = 'TZS', provider = 'azampay', metadata } = req.body;
  const id = generateId('pay');
  const nowStr = now();

  runExec(`
    INSERT INTO payments (id, user_id, amount, currency, status, provider, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', ?, ?, ?, ?)
  `, [id, user_id || null, amount, currency, provider, JSON.stringify(metadata || {}), nowStr, nowStr]);

  cacheClear('stats');
  res.status(201).json(runSingle('SELECT * FROM payments WHERE id = ?', [id]));
});

app.post('/payments/:id/process', async (req, res) => {
  try {
    const settings = getAzamPayConfig();
    const provider = new AzamPayProvider(settings);
    const payment = await provider.processPayment(req.params.id);
    res.json(payment);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post('/payments/:id/refund', (req, res) => {
  const { amount, reason } = req.body;
  const payment = runSingle('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });

  const refundAmount = amount || payment.amount;
  const refundId = generateId('ref');
  const nowStr = now();

  runExec(`
    INSERT INTO refunds (id, payment_id, amount, currency, reason, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'completed', ?, ?)
  `, [refundId, payment.id, refundAmount, payment.currency, reason || '', nowStr, nowStr]);

  runExec('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', ['refunded', nowStr, payment.id]);

  cacheClear('stats');
  res.json(runSingle('SELECT * FROM refunds WHERE id = ?', [refundId]));
});

app.post('/payments/:id/cancel', (req, res) => {
  const nowStr = now();
  runExec('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?', ['cancelled', nowStr, req.params.id]);
  cacheClear('stats');
  const row = runSingle('SELECT * FROM payments WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Payment not found' });
  res.json(row);
});

// ─── AZAMPAY CHECKOUT ────────────────────────────────────────────────────────

app.post('/checkout', async (req, res) => {
  try {
    const settings = getAzamPayConfig();
    const provider = new AzamPayProvider(settings);
    const { amount, mobile_number, provider: payProvider = 'm-pesa', user_id, idempotency_key } = req.body;

    const payment = await provider.createPayment(amount, 'TZS', {
      user_id,
      id: user_id,
      metadata: { mobile_number, idempotency_key },
    });

    if (settings.sandbox) {
      return res.json({
        id: payment.id,
        amount_tzs: amount,
        provider: payProvider,
        status: 'pending',
        sandbox: true,
        note: 'Sandbox mode — no real charge will be made',
      });
    }

    const result = await provider.createMobileCheckout(amount, mobile_number, payProvider, payment.id);
    res.json({
      id: payment.id,
      amount_tzs: amount,
      provider: payProvider,
      status: 'pending',
      sandbox: false,
      external: result,
    });
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

app.post('/webhook', async (req, res) => {
  try {
    const settings = getAzamPayConfig();
    const provider = new AzamPayProvider(settings);
    const result = await provider.handleWebhook(req.body);
    cacheClear('stats');
    res.json(result);
  } catch (err: unknown) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// ─── TRANSACTIONS ────────────────────────────────────────────────────────────

app.get('/transactions', (req, res) => {
  const { payment_id, user_id, limit = '100', offset = '0' } = req.query;
  let sql = 'SELECT t.* FROM transactions t JOIN payments p ON t.payment_id = p.id WHERE 1=1';
  const params: unknown[] = [];

  if (payment_id) { sql += ' AND t.payment_id = ?'; params.push(payment_id); }
  if (user_id) { sql += ' AND p.user_id = ?'; params.push(user_id); }

  sql += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string), parseInt(offset as string));

  res.json(runQuery(sql, params));
});

// ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

app.get('/subscriptions', (req, res) => {
  const { user_id, status } = req.query;
  let sql = 'SELECT * FROM subscriptions WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (status) { sql += ' AND status = ?'; params.push(status); }

  sql += ' ORDER BY created_at DESC';
  res.json(runQuery(sql, params));
});

app.get('/subscriptions/:id', (req, res) => {
  const row = runSingle('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });
  res.json(row);
});

app.post('/subscriptions', (req, res) => {
  const { user_id, plan_id, amount, currency = 'TZS' } = req.body;
  const id = generateId('sub');
  const nowStr = now();
  const periodEnd = new Date(Date.now() + 30 * 86400000).toISOString();

  runExec(`
    INSERT INTO subscriptions (id, user_id, plan_id, status, amount, currency, current_period_start, current_period_end, cancel_at_period_end, created_at, updated_at)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?, 0, ?, ?)
  `, [id, user_id, plan_id, amount, currency, nowStr, periodEnd, nowStr, nowStr]);

  const invId = generateId('inv');
  const invNumber = `INV-${Date.now().toString().slice(-6)}`;
  runExec(`
    INSERT INTO invoices (id, user_id, subscription_id, invoice_number, amount, currency, total_amount, status, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
  `, [invId, user_id, id, invNumber, amount, currency, amount, periodEnd, nowStr]);

  cacheClear('stats');
  res.status(201).json(runSingle('SELECT * FROM subscriptions WHERE id = ?', [id]));
});

app.post('/subscriptions/:id/cancel', (req, res) => {
  const { immediate } = req.body;
  const nowStr = now();

  if (immediate) {
    runExec('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?', ['cancelled', nowStr, req.params.id]);
  } else {
    runExec('UPDATE subscriptions SET cancel_at_period_end = 1, updated_at = ? WHERE id = ?', [nowStr, req.params.id]);
  }

  cacheClear('stats');
  const row = runSingle('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });
  res.json(row);
});

app.post('/subscriptions/:id/pause', (req, res) => {
  runExec('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?', ['inactive', now(), req.params.id]);
  cacheClear('stats');
  const row = runSingle('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });
  res.json(row);
});

app.post('/subscriptions/:id/resume', (req, res) => {
  runExec('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?', ['active', now(), req.params.id]);
  cacheClear('stats');
  const row = runSingle('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Subscription not found' });
  res.json(row);
});

// ─── INVOICES ────────────────────────────────────────────────────────────────

app.get('/invoices', (req, res) => {
  const { user_id, status, subscription_id } = req.query;
  let sql = 'SELECT * FROM invoices WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (status) { sql += ' AND status = ?'; params.push(status); }
  if (subscription_id) { sql += ' AND subscription_id = ?'; params.push(subscription_id); }

  sql += ' ORDER BY created_at DESC';
  res.json(runQuery(sql, params));
});

app.get('/invoices/:id', (req, res) => {
  const row = runSingle('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  res.json(row);
});

app.post('/invoices', (req, res) => {
  const { user_id, payment_id, subscription_id, amount, currency = 'TZS', tax_amount = 0, discount_amount = 0, items, due_date } = req.body;
  const id = generateId('inv');
  const invNumber = `INV-${Date.now().toString().slice(-6)}`;
  const total = amount + tax_amount - discount_amount;
  const nowStr = now();

  runExec(`
    INSERT INTO invoices (id, user_id, payment_id, subscription_id, invoice_number, amount, currency, tax_amount, discount_amount, total_amount, status, items, due_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `, [id, user_id, payment_id || null, subscription_id || null, invNumber, amount, currency, tax_amount, discount_amount, total, JSON.stringify(items || []), due_date || new Date(Date.now() + 30 * 86400000).toISOString(), nowStr]);

  cacheClear('stats');
  res.status(201).json(runSingle('SELECT * FROM invoices WHERE id = ?', [id]));
});

app.post('/invoices/:id/pay', (req, res) => {
  const nowStr = now();
  runExec('UPDATE invoices SET status = ?, paid_at = ? WHERE id = ?', ['paid', nowStr, req.params.id]);
  cacheClear('stats');
  const row = runSingle('SELECT * FROM invoices WHERE id = ?', [req.params.id]);
  if (!row) return res.status(404).json({ error: 'Invoice not found' });
  res.json(row);
});

// ─── REFUNDS ─────────────────────────────────────────────────────────────────

app.get('/refunds', (req, res) => {
  const { payment_id, user_id } = req.query;
  let sql = 'SELECT r.* FROM refunds r JOIN payments p ON r.payment_id = p.id WHERE 1=1';
  const params: unknown[] = [];

  if (payment_id) { sql += ' AND r.payment_id = ?'; params.push(payment_id); }
  if (user_id) { sql += ' AND p.user_id = ?'; params.push(user_id); }

  sql += ' ORDER BY r.created_at DESC';
  res.json(runQuery(sql, params));
});

// ─── BILLING ─────────────────────────────────────────────────────────────────

app.get('/billing', (req, res) => {
  const { user_id, subscription_id } = req.query;
  let sql = 'SELECT * FROM billing_records WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (subscription_id) { sql += ' AND subscription_id = ?'; params.push(subscription_id); }

  sql += ' ORDER BY created_at DESC';
  res.json(runQuery(sql, params));
});

app.post('/billing', (req, res) => {
  const { user_id, subscription_id, amount, currency = 'TZS', period = 'monthly', due_date } = req.body;
  const id = generateId('bill');
  const nowStr = now();

  runExec(`
    INSERT INTO billing_records (id, user_id, subscription_id, amount, currency, period, status, due_date, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
  `, [id, user_id, subscription_id || null, amount, currency, period, due_date || new Date(Date.now() + 30 * 86400000).toISOString(), nowStr, nowStr]);

  cacheClear('stats');
  res.status(201).json(runSingle('SELECT * FROM billing_records WHERE id = ?', [id]));
});

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────

app.get('/audit', (req, res) => {
  const { user_id, action, resource_type, limit = '100', offset = '0' } = req.query;
  let sql = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: unknown[] = [];

  if (user_id) { sql += ' AND user_id = ?'; params.push(user_id); }
  if (action) { sql += ' AND action = ?'; params.push(action); }
  if (resource_type) { sql += ' AND resource_type = ?'; params.push(resource_type); }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit as string), parseInt(offset as string));

  res.json(runQuery(sql, params));
});

app.post('/audit', (req, res) => {
  const { user_id, action, resource_type, resource_id, metadata, ip_address } = req.body;
  const id = generateId('audit');

  runExec(`
    INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, metadata, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [id, user_id || null, action, resource_type, resource_id || null, JSON.stringify(metadata || {}), ip_address || null, now()]);

  res.status(201).json({ id, created: true });
});

// ─── STATS ───────────────────────────────────────────────────────────────────

app.get('/stats', (req, res) => {
  const { user_id } = req.query;
  const cacheKey = `stats:${user_id || 'all'}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  const whereClause = user_id ? 'WHERE user_id = ?' : '';
  const params = user_id ? [user_id] : [];

  const totalPayments = runSingle(`SELECT COUNT(*) as count FROM payments ${whereClause}`, params)!.count;
  const completedPayments = runSingle(`SELECT COUNT(*) as count FROM payments ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'success'`, params)!.count;
  const totalRevenue = runSingle(`SELECT COALESCE(SUM(amount), 0) as total FROM payments ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'success'`, params)!.total;
  const activeSubscriptions = runSingle(`SELECT COUNT(*) as count FROM subscriptions ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'active'`, params)!.count;
  const pendingInvoices = runSingle(`SELECT COUNT(*) as count FROM invoices ${whereClause ? whereClause + ' AND' : 'WHERE'} status = 'pending'`, params)!.count;
  const totalRefunds = runSingle(`SELECT COALESCE(SUM(r.amount), 0) as total FROM refunds r JOIN payments p ON r.payment_id = p.id ${whereClause ? 'WHERE p.' + (user_id ? 'user_id = ?' : '1=1') : ''}`, params)!.total;

  const result = {
    total_payments: totalPayments,
    completed_payments: completedPayments,
    total_revenue: totalRevenue,
    active_subscriptions: activeSubscriptions,
    pending_invoices: pendingInvoices,
    total_refunds: totalRefunds,
  };
  cacheSet(cacheKey, result, 10000);
  res.json(result);
});

// ─── CURRENCIES ──────────────────────────────────────────────────────────────

const CURRENCIES: Record<string, { name: string; symbol: string; rate: number }> = {
  TZS: { name: 'Tanzanian Shilling', symbol: 'TSh', rate: 1 },
  USD: { name: 'US Dollar', symbol: '$', rate: 0.00039 },
  EUR: { name: 'Euro', symbol: '\u20AC', rate: 0.00036 },
  GBP: { name: 'British Pound', symbol: '\u00A3', rate: 0.00031 },
  KES: { name: 'Kenyan Shilling', symbol: 'KSh', rate: 0.05 },
  NGN: { name: 'Nigerian Naira', symbol: '\u20A6', rate: 0.6 },
  GHS: { name: 'Ghanaian Cedi', symbol: 'GH\u20B5', rate: 0.006 },
  ZAR: { name: 'South African Rand', symbol: 'R', rate: 0.007 },
};

app.get('/currencies', (_req, res) => {
  res.json(Object.entries(CURRENCIES).map(([code, c]) => ({ code, ...c })));
});

app.get('/currencies/convert', (req, res) => {
  const { amount, from, to } = req.query;
  const fromRate = CURRENCIES[from as string]?.rate || 1;
  const toRate = CURRENCIES[to as string]?.rate || 1;
  const result = (parseFloat(amount as string) / fromRate) * toRate;
  res.json({ amount: parseFloat(amount as string), from, to, result });
});

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function getAzamPayConfig() {
  return {
    clientId: process.env.AZAMPAY_CLIENT_ID || '',
    clientSecret: process.env.AZAMPAY_CLIENT_SECRET || '',
    sandbox: process.env.AZAMPAY_SANDBOX !== 'false',
  };
}

// ─── START SERVER ────────────────────────────────────────────────────────────

export async function startServer() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[casuya-payments] Running on http://0.0.0.0:${PORT}`);
    console.log(`[casuya-payments] Health: http://localhost:${PORT}/health`);
  });

  const { flushDb } = require('./database');
  process.on('SIGINT', () => { flushDb(); process.exit(0); });
  process.on('SIGTERM', () => { flushDb(); process.exit(0); });
}

export { app };

startServer();
