import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.CASUYA_PAYMENTS_DB || path.join(__dirname, '..', 'data', 'payments.db');

let db: SqlJsDatabase;

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();

  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  db.run('PRAGMA journal_mode = WAL');
  initTables();
  saveDb();
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) throw new Error('Database not initialized. Call initDb() first.');
  return db;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveDb(): void {
  if (!db) return;
  if (saveTimer) return; // already pending
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const data = db!.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }, 1000);
}

export function flushDb(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function initTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      status TEXT NOT NULL DEFAULT 'pending',
      provider TEXT NOT NULL DEFAULT 'azampay',
      provider_payment_id TEXT,
      customer_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      type TEXT NOT NULL DEFAULT 'payment',
      status TEXT NOT NULL DEFAULT 'pending',
      provider TEXT NOT NULL,
      provider_transaction_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      plan_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
      payment_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      payment_id TEXT,
      subscription_id TEXT,
      invoice_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      tax_amount REAL NOT NULL DEFAULT 0,
      discount_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      items TEXT,
      due_date TEXT NOT NULL,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS refunds (
      id TEXT PRIMARY KEY,
      payment_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      provider_refund_id TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (payment_id) REFERENCES payments(id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS billing_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      subscription_id TEXT,
      amount REAL NOT NULL,
      currency TEXT NOT NULL DEFAULT 'TZS',
      period TEXT NOT NULL DEFAULT 'monthly',
      status TEXT NOT NULL DEFAULT 'pending',
      due_date TEXT NOT NULL,
      paid_at TEXT,
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      metadata TEXT,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)');
  db.run('CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status)');
  db.run('CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_billing_user_id ON billing_records(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)');
}

export function runQuery(sql: string, params: unknown[] = []): Record<string, unknown>[] {
  const d = getDb();
  const stmt = d.prepare(sql);
  if (params.length) stmt.bind(params);
  const rows: Record<string, unknown>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export function runSingle(sql: string, params: unknown[] = []): Record<string, unknown> | undefined {
  const rows = runQuery(sql, params);
  return rows[0];
}

export function runExec(sql: string, params: unknown[] = []): void {
  const d = getDb();
  if (params.length) {
    d.run(sql, params);
  } else {
    d.run(sql);
  }
  saveDb();
}

export function generateId(prefix: string = ''): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function now(): string {
  return new Date().toISOString();
}
