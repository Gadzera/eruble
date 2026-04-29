import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  inn: text("inn").notNull(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  locale: text("locale").notNull().default("ru-RU"),
  timezone: text("timezone").notNull().default("Europe/Moscow"),
  createdAt: integer("created_at").notNull(),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // Viewer | Creator | Payroll | Treasurer | Approver | Signer | ChiefAccountant | CFO | Compliance | Security | Admin
  status: text("status").notNull().default("ACTIVE"),
  createdAt: integer("created_at").notNull(),
});

export const banks = sqliteTable("banks", {
  id: text("id").primaryKey(),
  code: text("code").notNull(), // SBER, VTB, ALFA
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | DEGRADED | DOWN
  cbrAlbumVersion: text("cbr_album_version").notNull().default("2026.07"),
  createdAt: integer("created_at").notNull(),
});

export const bankAccess = sqliteTable("bank_access", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  bankId: text("bank_id").notNull(),
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | SUSPENDED | RESUME_PENDING | TERMINATED
  isDefault: integer("is_default").notNull().default(0),
  createdAt: integer("created_at").notNull(),
});

export const wallets = sqliteTable("wallets", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  externalRef: text("external_ref").notNull(), // DR000000000001
  balanceCents: integer("balance_cents").notNull().default(0),
  blockedCents: integer("blocked_cents").notNull().default(0),
  status: text("status").notNull().default("ACTIVE"),
  lastSyncAt: integer("last_sync_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const counterparties = sqliteTable("counterparties", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  // Идентификация
  legalType: text("legal_type").notNull().default("ЮЛ"), // ЮЛ | ИП | ФЛ
  inn: text("inn").notNull(),
  kpp: text("kpp"),                     // 9 цифр, только для ЮЛ
  ogrn: text("ogrn"),                   // ОГРН (13) / ОГРНИП (15)
  name: text("name").notNull(),         // краткое
  fullName: text("full_name"),          // полное юридическое
  legalAddress: text("legal_address"),  // юридический адрес
  // Банковские реквизиты (традиционные)
  bik: text("bik"),                     // БИК (9 цифр)
  bankName: text("bank_name"),          // наименование банка
  bankAccount: text("bank_account"),    // р/с (20 цифр)
  corrAccount: text("corr_account"),    // к/с банка (20 цифр)
  // Цифровой рубль
  drAccountRef: text("dr_account_ref"), // DR + 12 цифр
  // Контакты
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  // Классификация (115-ФЗ)
  category: text("category"),           // SUPPLIER | BUYER | PARTNER | TAX | OTHER
  riskLevel: text("risk_level"),        // LOW | MEDIUM | HIGH
  notes: text("notes"),
  // Расширенные сведения (ЕГРЮЛ)
  okved: text("okved"),                     // основной ОКВЭД, напр. "28.99.9"
  okvedName: text("okved_name"),            // расшифровка ОКВЭД
  region: text("region"),                   // регион, напр. "г. Москва"
  registeredAt: integer("registered_at"),   // дата регистрации (timestamp)
  authorizedCapital: integer("authorized_capital"), // уставный капитал, руб.
  employees: integer("employees"),          // численность сотрудников
  employeesYear: integer("employees_year"), // год данных о численности
  directorName: text("director_name"),      // ФИО директора
  directorInn: text("director_inn"),        // ИНН директора
  directorSince: integer("director_since"), // дата назначения (timestamp)
  // Флаги ФНС (надёжность)
  fnsDebt: integer("fns_debt").notNull().default(0),         // налоговая задолженность
  fnsMassDirector: integer("fns_mass_director").notNull().default(0), // массовый руководитель
  fnsInvalid: integer("fns_invalid").notNull().default(0),   // недостоверность сведений
  fnsBankrupt: integer("fns_bankrupt").notNull().default(0), // банкротство
  fnsSanctions: integer("fns_sanctions").notNull().default(0), // санкционные списки
  fnsCbBlacklist: integer("fns_cb_blacklist").notNull().default(0), // ЦБ чёрный список
  fnsCheckedAt: integer("fns_checked_at"),                   // когда последний раз проверяли
  // Статус
  status: text("status").notNull().default("ACTIVE"), // ACTIVE | BLOCKED | ARCHIVED
  verifiedAt: integer("verified_at"),
  createdAt: integer("created_at").notNull(),
});

export const operations = sqliteTable("operations", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  type: text("type").notNull(), // B2B_TRANSFER | CASH_IN | CASH_OUT | REGISTRY_ITEM | QR_SETTLEMENT
  bankId: text("bank_id").notNull(),
  recipientInn: text("recipient_inn"),
  recipientName: text("recipient_name"),
  recipientDrRef: text("recipient_dr_ref"),
  counterpartyId: text("counterparty_id"),
  amountCents: integer("amount_cents").notNull(),
  purpose: text("purpose").notNull().default(""),
  statusDashboard: text("status_dashboard").notNull(), // DRAFT | PENDING_APPROVAL | SUBMITTED | EXECUTED | REJECTED | CANCELED
  statusBank: text("status_bank"), // PENDING | ACCEPTED_BY_BANK | REJECTED_BY_BANK
  statusPlatform: text("status_platform"), // PENDING | ACCEPTED_BY_PLATFORM | IN_PROCESS | EXECUTED | REJECTED
  statusErp: text("status_erp"), // NOT_POSTED | POSTED | RECONCILED | MISMATCH
  cbrMessageId: text("cbr_message_id"),
  cbrMessageVersion: text("cbr_message_version"),
  cbrOrderVersion: text("cbr_order_version"),
  idempotencyKey: text("idempotency_key").notNull(),
  registryId: text("registry_id"),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at").notNull(),
  submittedAt: integer("submitted_at"),
  executedAt: integer("executed_at"),
});

export const registries = sqliteTable("registries", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  type: text("type").notNull(), // PAYROLL | VENDOR | TAX | DIVIDEND
  source: text("source").notNull(), // 1C | CSV | XLSX | API
  fileName: text("file_name"),
  bankId: text("bank_id").notNull(),
  rowsTotal: integer("rows_total").notNull().default(0),
  rowsValid: integer("rows_valid").notNull().default(0),
  rowsInvalid: integer("rows_invalid").notNull().default(0),
  rowsExecuted: integer("rows_executed").notNull().default(0),
  rowsRejected: integer("rows_rejected").notNull().default(0),
  totalAmountCents: integer("total_amount_cents").notNull().default(0),
  status: text("status").notNull(), // VALIDATING | VALIDATED | PENDING_APPROVAL | SUBMITTED | EXECUTED | FAILED
  approvalPolicy: text("approval_policy").notNull().default("STANDARD"),
  createdById: text("created_by_id").notNull(),
  createdAt: integer("created_at").notNull(),
  submittedAt: integer("submitted_at"),
});

export const registryItems = sqliteTable("registry_items", {
  id: text("id").primaryKey(),
  registryId: text("registry_id").notNull(),
  rowNumber: integer("row_number").notNull(),
  recipientInn: text("recipient_inn"),
  recipientName: text("recipient_name").notNull(),
  recipientDrRef: text("recipient_dr_ref"),
  amountCents: integer("amount_cents").notNull(),
  purpose: text("purpose").notNull().default(""),
  status: text("status").notNull(), // VALID | INVALID | EXECUTED | REJECTED
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  operationId: text("operation_id"),
});

export const approvalTasks = sqliteTable("approval_tasks", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  operationId: text("operation_id"),
  registryId: text("registry_id"),
  approverRole: text("approver_role").notNull(),
  approverUserId: text("approver_user_id"),
  status: text("status").notNull().default("PENDING"), // PENDING | APPROVED | REJECTED | CANCELED
  reason: text("reason"),
  createdAt: integer("created_at").notNull(),
  completedAt: integer("completed_at"),
});

export const auditEvents = sqliteTable("audit_events", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  actorId: text("actor_id"),
  actorName: text("actor_name").notNull(),
  action: text("action").notNull(), // login | logout | payment.create | payment.submit | registry.upload | access.suspend | etc
  objectType: text("object_type"),
  objectId: text("object_id"),
  ip: text("ip"),
  userAgent: text("user_agent"),
  payloadJson: text("payload_json"),
  severity: text("severity").notNull().default("INFO"), // INFO | WARN | CRITICAL
  createdAt: integer("created_at").notNull(),
});

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  userId: text("user_id"),
  type: text("type").notNull(), // approval | status | regtech | system
  severity: text("severity").notNull().default("INFO"),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: integer("read_at"),
  createdAt: integer("created_at").notNull(),
});

export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  keyPrefix: text("key_prefix").notNull(),
  keyFull: text("key_full").notNull(),
  scopes: text("scopes").notNull().default("read"),
  status: text("status").notNull().default("ACTIVE"),
  lastUsedAt: integer("last_used_at"),
  createdAt: integer("created_at").notNull(),
  revokedAt: integer("revoked_at"),
});

export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Bank = typeof banks.$inferSelect;
export type BankAccess = typeof bankAccess.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type Counterparty = typeof counterparties.$inferSelect;
export type Operation = typeof operations.$inferSelect;
export type Registry = typeof registries.$inferSelect;
export type RegistryItem = typeof registryItems.$inferSelect;
export type ApprovalTask = typeof approvalTasks.$inferSelect;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type ApiKey = typeof apiKeys.$inferSelect;
