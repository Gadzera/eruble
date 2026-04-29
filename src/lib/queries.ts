import { db, schema } from "./db/client";
import { and, desc, eq, gte, isNull, or, sql } from "drizzle-orm";

export function getWallet(orgId: string) {
  return db.select().from(schema.wallets).where(eq(schema.wallets.orgId, orgId)).get();
}

export function getBanksForOrg(orgId: string) {
  return db
    .select({
      access: schema.bankAccess,
      bank: schema.banks,
    })
    .from(schema.bankAccess)
    .innerJoin(schema.banks, eq(schema.bankAccess.bankId, schema.banks.id))
    .where(eq(schema.bankAccess.orgId, orgId))
    .all();
}

export function dashboardStats(orgId: string) {
  const wallet = getWallet(orgId);

  const pendingApprovals = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.approvalTasks)
    .where(and(eq(schema.approvalTasks.orgId, orgId), eq(schema.approvalTasks.status, "PENDING")))
    .get()?.c ?? 0;

  const inProcess = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.operations)
    .where(and(eq(schema.operations.orgId, orgId), eq(schema.operations.statusDashboard, "SUBMITTED")))
    .get()?.c ?? 0;

  const failed = db
    .select({ c: sql<number>`count(*)` })
    .from(schema.operations)
    .where(and(eq(schema.operations.orgId, orgId), eq(schema.operations.statusDashboard, "REJECTED")))
    .get()?.c ?? 0;

  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  const todayAmount = db
    .select({ s: sql<number>`coalesce(sum(amount_cents), 0)` })
    .from(schema.operations)
    .where(and(
      eq(schema.operations.orgId, orgId),
      eq(schema.operations.statusDashboard, "EXECUTED"),
      gte(schema.operations.executedAt, today0.getTime()),
    ))
    .get()?.s ?? 0;

  return {
    walletBalanceCents: wallet?.balanceCents ?? 0,
    walletBlockedCents: wallet?.blockedCents ?? 0,
    walletExternalRef: wallet?.externalRef ?? "",
    walletLastSyncAt: Date.now(),
    pendingApprovals,
    inProcess,
    failed,
    todayAmountCents: todayAmount,
  };
}

export function listOperations(orgId: string, opts?: { limit?: number; status?: string; type?: string; bankId?: string; search?: string }) {
  const filters = [eq(schema.operations.orgId, orgId)];
  if (opts?.status) filters.push(eq(schema.operations.statusDashboard, opts.status));
  if (opts?.type) filters.push(eq(schema.operations.type, opts.type));
  if (opts?.bankId) filters.push(eq(schema.operations.bankId, opts.bankId));
  if (opts?.search) {
    const s = `%${opts.search}%`;
    filters.push(or(
      sql`${schema.operations.recipientName} LIKE ${s}`,
      sql`${schema.operations.recipientInn} LIKE ${s}`,
      sql`${schema.operations.id} LIKE ${s}`,
      sql`${schema.operations.purpose} LIKE ${s}`,
    )!);
  }
  return db
    .select()
    .from(schema.operations)
    .where(and(...filters))
    .orderBy(desc(schema.operations.createdAt))
    .limit(opts?.limit ?? 200)
    .all();
}

export function getOperation(id: string) {
  return db.select().from(schema.operations).where(eq(schema.operations.id, id)).get();
}

export function listRegistries(orgId: string) {
  return db
    .select()
    .from(schema.registries)
    .where(eq(schema.registries.orgId, orgId))
    .orderBy(desc(schema.registries.createdAt))
    .all();
}

export function getRegistry(id: string) {
  return db.select().from(schema.registries).where(eq(schema.registries.id, id)).get();
}

export function getRegistryItems(registryId: string) {
  return db
    .select()
    .from(schema.registryItems)
    .where(eq(schema.registryItems.registryId, registryId))
    .orderBy(schema.registryItems.rowNumber)
    .all();
}

export function listCounterparties(orgId: string) {
  return db
    .select()
    .from(schema.counterparties)
    .where(eq(schema.counterparties.orgId, orgId))
    .orderBy(schema.counterparties.name)
    .all();
}

export function listMyApprovals(orgId: string) {
  return db
    .select({
      task: schema.approvalTasks,
      operation: schema.operations,
      registry: schema.registries,
    })
    .from(schema.approvalTasks)
    .leftJoin(schema.operations, eq(schema.approvalTasks.operationId, schema.operations.id))
    .leftJoin(schema.registries, eq(schema.approvalTasks.registryId, schema.registries.id))
    .where(and(eq(schema.approvalTasks.orgId, orgId), eq(schema.approvalTasks.status, "PENDING")))
    .orderBy(desc(schema.approvalTasks.createdAt))
    .all();
}

export function listUsers(orgId: string) {
  return db
    .select()
    .from(schema.users)
    .where(eq(schema.users.orgId, orgId))
    .orderBy(schema.users.name)
    .all();
}

export function listAuditEvents(orgId: string, opts?: { limit?: number; severity?: string; search?: string }) {
  const filters = [eq(schema.auditEvents.orgId, orgId)];
  if (opts?.severity) filters.push(eq(schema.auditEvents.severity, opts.severity));
  if (opts?.search) {
    const s = `%${opts.search}%`;
    filters.push(or(
      sql`${schema.auditEvents.actorName} LIKE ${s}`,
      sql`${schema.auditEvents.action} LIKE ${s}`,
      sql`${schema.auditEvents.objectId} LIKE ${s}`,
    )!);
  }
  return db
    .select()
    .from(schema.auditEvents)
    .where(and(...filters))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(opts?.limit ?? 200)
    .all();
}

export function listNotifications(orgId: string, userId: string, limit = 20) {
  return db
    .select()
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.orgId, orgId),
      or(isNull(schema.notifications.userId), eq(schema.notifications.userId, userId))!,
    ))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .all();
}

export function unreadNotifCount(orgId: string, userId: string) {
  return db
    .select({ c: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(
      eq(schema.notifications.orgId, orgId),
      isNull(schema.notifications.readAt),
      or(isNull(schema.notifications.userId), eq(schema.notifications.userId, userId))!,
    ))
    .get()?.c ?? 0;
}

export function listCounterpartyOps(orgId: string, counterpartyId: string) {
  return db
    .select()
    .from(schema.operations)
    .where(and(eq(schema.operations.orgId, orgId), eq(schema.operations.counterpartyId, counterpartyId)))
    .orderBy(desc(schema.operations.createdAt))
    .limit(50)
    .all();
}

export function cashflowDaily(orgId: string, days = 30) {
  const since = Date.now() - days * 86400_000;
  const rows = db
    .select({
      day: sql<string>`date(executed_at / 1000, 'unixepoch')`,
      inflow: sql<number>`coalesce(sum(case when type in ('CASH_IN','QR_SETTLEMENT') then amount_cents else 0 end), 0)`,
      outflow: sql<number>`coalesce(sum(case when type in ('B2B_TRANSFER','CASH_OUT','REGISTRY_ITEM') then amount_cents else 0 end), 0)`,
    })
    .from(schema.operations)
    .where(and(
      eq(schema.operations.orgId, orgId),
      eq(schema.operations.statusDashboard, "EXECUTED"),
      gte(schema.operations.executedAt, since),
    ))
    .groupBy(sql`date(executed_at / 1000, 'unixepoch')`)
    .orderBy(sql`date(executed_at / 1000, 'unixepoch')`)
    .all();
  return rows;
}
