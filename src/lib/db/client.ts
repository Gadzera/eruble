import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";
import { seedIfEmpty } from "./seed-data";

const DB_DIR = process.env.VERCEL ? "/tmp" : path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "orca.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

// Bootstrap tables (CREATE TABLE IF NOT EXISTS) — keeps things simple for MVP, no migrations.
sqlite.exec(`
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  inn TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'ru-RU',
  timezone TEXT NOT NULL DEFAULT 'Europe/Moscow',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS banks (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  cbr_album_version TEXT NOT NULL DEFAULT '2026.07',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS bank_access (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  bank_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  external_ref TEXT NOT NULL,
  balance_cents INTEGER NOT NULL DEFAULT 0,
  blocked_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_sync_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS counterparties (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  legal_type TEXT NOT NULL DEFAULT 'ЮЛ',
  inn TEXT NOT NULL,
  kpp TEXT,
  ogrn TEXT,
  name TEXT NOT NULL,
  full_name TEXT,
  legal_address TEXT,
  bik TEXT,
  bank_name TEXT,
  bank_account TEXT,
  corr_account TEXT,
  dr_account_ref TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  risk_level TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  verified_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS operations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  type TEXT NOT NULL,
  bank_id TEXT NOT NULL,
  recipient_inn TEXT,
  recipient_name TEXT,
  recipient_dr_ref TEXT,
  counterparty_id TEXT,
  amount_cents INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  status_dashboard TEXT NOT NULL,
  status_bank TEXT,
  status_platform TEXT,
  status_erp TEXT,
  cbr_message_id TEXT,
  cbr_message_version TEXT,
  cbr_order_version TEXT,
  idempotency_key TEXT NOT NULL,
  registry_id TEXT,
  created_by_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  submitted_at INTEGER,
  executed_at INTEGER
);

CREATE TABLE IF NOT EXISTS registries (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  file_name TEXT,
  bank_id TEXT NOT NULL,
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_valid INTEGER NOT NULL DEFAULT 0,
  rows_invalid INTEGER NOT NULL DEFAULT 0,
  rows_executed INTEGER NOT NULL DEFAULT 0,
  rows_rejected INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  approval_policy TEXT NOT NULL DEFAULT 'STANDARD',
  created_by_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  submitted_at INTEGER
);

CREATE TABLE IF NOT EXISTS registry_items (
  id TEXT PRIMARY KEY,
  registry_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  recipient_inn TEXT,
  recipient_name TEXT NOT NULL,
  recipient_dr_ref TEXT,
  amount_cents INTEGER NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  error_code TEXT,
  error_message TEXT,
  operation_id TEXT
);

CREATE TABLE IF NOT EXISTS approval_tasks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  operation_id TEXT,
  registry_id TEXT,
  approver_role TEXT NOT NULL,
  approver_user_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING',
  reason TEXT,
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT,
  object_id TEXT,
  ip TEXT,
  user_agent TEXT,
  payload_json TEXT,
  severity TEXT NOT NULL DEFAULT 'INFO',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'INFO',
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_full TEXT NOT NULL,
  scopes TEXT NOT NULL DEFAULT 'read',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  last_used_at INTEGER,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_operations_org ON operations(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status_dashboard);
CREATE INDEX IF NOT EXISTS idx_registries_org ON registries(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org ON audit_events(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id, read_at, created_at DESC);
`);

export const db = drizzle(sqlite, { schema });
export { schema };
export type DB = typeof db;

try { seedIfEmpty(db); } catch (e) { console.error("[seed] failed:", e); }
