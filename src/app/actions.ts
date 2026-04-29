"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db/client";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getSession, requireSession } from "@/lib/session";

export async function switchBankAccess(accessId: string) {
  const c = await cookies();
  c.set("orca_bank", accessId, { path: "/", httpOnly: false, sameSite: "lax" });
  revalidatePath("/");
}

export async function approveTask(taskId: string) {
  const s = await requireSession();
  db.update(schema.approvalTasks)
    .set({ status: "APPROVED", approverUserId: s.id, completedAt: Date.now() })
    .where(eq(schema.approvalTasks.id, taskId))
    .run();
  await logAudit(s, "approval.approve", "approval_task", taskId);
  revalidatePath("/");
}

export async function rejectTask(taskId: string, reason: string) {
  const s = await requireSession();
  db.update(schema.approvalTasks)
    .set({ status: "REJECTED", approverUserId: s.id, completedAt: Date.now(), reason })
    .where(eq(schema.approvalTasks.id, taskId))
    .run();
  await logAudit(s, "approval.reject", "approval_task", taskId, { reason });
  revalidatePath("/");
}

export async function createPayment(input: {
  recipientInn: string;
  recipientName: string;
  recipientDrRef: string;
  amountRub: number;
  purpose: string;
  bankAccessId?: string;
}) {
  const s = await requireSession();
  const accessId = input.bankAccessId ?? s.bankAccessId;
  const access = db.select().from(schema.bankAccess).where(eq(schema.bankAccess.id, accessId)).get();
  if (!access || access.orgId !== s.orgId) throw new Error("invalid bank access");

  const id = `pay_${nanoid(10)}`;
  const idemp = nanoid(16);
  const now = Date.now();
  const amount = Math.round(input.amountRub * 100);

  db.insert(schema.operations).values({
    id, orgId: s.orgId, type: "B2B_TRANSFER", bankId: access.bankId,
    recipientInn: input.recipientInn, recipientName: input.recipientName, recipientDrRef: input.recipientDrRef,
    counterpartyId: null,
    amountCents: amount, purpose: input.purpose,
    statusDashboard: "PENDING_APPROVAL", statusBank: null, statusPlatform: null, statusErp: null,
    cbrMessageId: null, cbrMessageVersion: "2026.07", cbrOrderVersion: "2026.1",
    idempotencyKey: idemp, registryId: null,
    createdById: s.id, createdAt: now, submittedAt: null, executedAt: null,
  }).run();

  // Create one approval task (CFO/Approver)
  db.insert(schema.approvalTasks).values({
    id: `apr_${nanoid(8)}`, orgId: s.orgId, operationId: id, registryId: null,
    approverRole: "Approver", approverUserId: null, status: "PENDING",
    reason: null, createdAt: now, completedAt: null,
  }).run();

  await logAudit(s, "payment.create", "operation", id, { amount: input.amountRub });

  revalidatePath("/operations");
  revalidatePath("/");
  return id;
}

export async function submitPayment(operationId: string) {
  const s = await requireSession();
  const op = db.select().from(schema.operations).where(eq(schema.operations.id, operationId)).get();
  if (!op || op.orgId !== s.orgId) throw new Error("not found");

  const now = Date.now();
  const cbrMessageId = nanoid(16);

  // Move through statuses: SUBMITTED → ACCEPTED_BY_BANK → IN_PROCESS
  db.update(schema.operations)
    .set({
      statusDashboard: "SUBMITTED",
      statusBank: "ACCEPTED_BY_BANK",
      statusPlatform: "IN_PROCESS",
      statusErp: "NOT_POSTED",
      cbrMessageId,
      submittedAt: now,
    })
    .where(eq(schema.operations.id, operationId))
    .run();

  // Approve all pending tasks for this op
  db.update(schema.approvalTasks)
    .set({ status: "APPROVED", approverUserId: s.id, completedAt: now })
    .where(and(eq(schema.approvalTasks.operationId, operationId), eq(schema.approvalTasks.status, "PENDING")))
    .run();

  await logAudit(s, "payment.submit", "operation", operationId);

  // Schedule async execution (non-blocking; happens via setTimeout in node)
  setTimeout(() => {
    try {
      db.update(schema.operations)
        .set({
          statusDashboard: "EXECUTED",
          statusPlatform: "EXECUTED",
          statusErp: "POSTED",
          executedAt: Date.now(),
        })
        .where(eq(schema.operations.id, operationId))
        .run();
    } catch (e) { console.error("auto-execute failed", e); }
  }, 6000);

  revalidatePath("/operations");
  revalidatePath("/");
  return cbrMessageId;
}

export async function inviteUser(input: { name: string; email: string; role: string }) {
  const s = await requireSession();
  const id = `usr_${nanoid(10)}`;
  db.insert(schema.users).values({
    id, orgId: s.orgId, email: input.email, name: input.name,
    role: input.role, status: "ACTIVE", createdAt: Date.now(),
  }).run();
  await logAudit(s, "access.invite", "user", id, { email: input.email, role: input.role });
  revalidatePath("/access");
}

export async function setUserRole(userId: string, role: string) {
  const s = await requireSession();
  db.update(schema.users).set({ role })
    .where(and(eq(schema.users.id, userId), eq(schema.users.orgId, s.orgId)))
    .run();
  await logAudit(s, "access.role_change", "user", userId, { role });
  revalidatePath("/access");
}

export async function setUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const s = await requireSession();
  db.update(schema.users).set({ status })
    .where(and(eq(schema.users.id, userId), eq(schema.users.orgId, s.orgId)))
    .run();
  await logAudit(s, status === "ACTIVE" ? "access.activate" : "access.suspend", "user", userId);
  revalidatePath("/access");
}

export async function addCounterparty(input: {
  inn: string;
  name: string;
  drAccountRef?: string;
  legalType?: string;
  kpp?: string;
  ogrn?: string;
  fullName?: string;
  legalAddress?: string;
  bik?: string;
  bankName?: string;
  bankAccount?: string;
  corrAccount?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: string;
  riskLevel?: string;
  notes?: string;
}) {
  const s = await requireSession();
  const id = `cp_${nanoid(10)}`;
  db.insert(schema.counterparties).values({
    id, orgId: s.orgId,
    legalType: input.legalType || "ЮЛ",
    inn: input.inn,
    kpp: input.kpp || null,
    ogrn: input.ogrn || null,
    name: input.name,
    fullName: input.fullName || null,
    legalAddress: input.legalAddress || null,
    bik: input.bik || null,
    bankName: input.bankName || null,
    bankAccount: input.bankAccount || null,
    corrAccount: input.corrAccount || null,
    drAccountRef: input.drAccountRef || null,
    contactPerson: input.contactPerson || null,
    email: input.email || null,
    phone: input.phone || null,
    category: input.category || null,
    riskLevel: input.riskLevel || null,
    notes: input.notes || null,
    status: "ACTIVE", verifiedAt: null, createdAt: Date.now(),
  }).run();
  await logAudit(s, "counterparty.create", "counterparty", id, { inn: input.inn, name: input.name, legalType: input.legalType });
  revalidatePath("/counterparties");
}

export async function verifyCounterparty(id: string) {
  const s = await requireSession();
  db.update(schema.counterparties)
    .set({ verifiedAt: Date.now() })
    .where(and(eq(schema.counterparties.id, id), eq(schema.counterparties.orgId, s.orgId)))
    .run();
  await logAudit(s, "counterparty.verify", "counterparty", id);
  revalidatePath("/counterparties");
  revalidatePath(`/counterparties/${id}`);
}

export async function updateCounterparty(id: string, input: {
  name?: string;
  fullName?: string;
  kpp?: string;
  ogrn?: string;
  legalAddress?: string;
  bik?: string;
  bankName?: string;
  bankAccount?: string;
  corrAccount?: string;
  drAccountRef?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  category?: string;
  riskLevel?: string;
  notes?: string;
}) {
  const s = await requireSession();
  db.update(schema.counterparties)
    .set({
      name: input.name,
      fullName: input.fullName || null,
      kpp: input.kpp || null,
      ogrn: input.ogrn || null,
      legalAddress: input.legalAddress || null,
      bik: input.bik || null,
      bankName: input.bankName || null,
      bankAccount: input.bankAccount || null,
      corrAccount: input.corrAccount || null,
      drAccountRef: input.drAccountRef || null,
      contactPerson: input.contactPerson || null,
      email: input.email || null,
      phone: input.phone || null,
      category: input.category || null,
      riskLevel: input.riskLevel || null,
      notes: input.notes || null,
    })
    .where(and(eq(schema.counterparties.id, id), eq(schema.counterparties.orgId, s.orgId)))
    .run();
  await logAudit(s, "counterparty.update", "counterparty", id, { name: input.name });
  revalidatePath("/counterparties");
  revalidatePath(`/counterparties/${id}`);
}

export async function setCounterpartyStatus(id: string, status: "ACTIVE" | "BLOCKED" | "ARCHIVED") {
  const s = await requireSession();
  db.update(schema.counterparties)
    .set({ status })
    .where(and(eq(schema.counterparties.id, id), eq(schema.counterparties.orgId, s.orgId)))
    .run();
  await logAudit(s, `counterparty.${status.toLowerCase()}`, "counterparty", id);
  revalidatePath("/counterparties");
  revalidatePath(`/counterparties/${id}`);
}

export async function logout() {
  const s = await getSession();
  const c = await cookies();
  if (s) {
    db.insert(schema.auditEvents).values({
      id: `aud_${nanoid(10)}`,
      orgId: s.orgId,
      actorId: s.id,
      actorName: s.name,
      action: "logout",
      objectType: "session",
      objectId: s.id,
      ip: "127.0.0.1",
      userAgent: "Orca/1.0",
      payloadJson: null,
      severity: "INFO",
      createdAt: Date.now(),
    }).run();
  }
  c.delete("orca_uid");
  c.delete("orca_bank");
  redirect("/login");
}

export async function updateProfile(name: string) {
  const s = await requireSession();
  db.update(schema.users).set({ name }).where(eq(schema.users.id, s.id)).run();
  await logAudit(s, "profile.update", "user", s.id, { name });
  revalidatePath("/");
}

export async function switchUser(userId: string) {
  const c = await cookies();
  c.set("orca_uid", userId, { path: "/", httpOnly: false, sameSite: "lax" });
  redirect("/");
}

export async function createApiKey(name: string, scopes: string): Promise<string> {
  const s = await requireSession();
  const id = `key_${nanoid(10)}`;
  const keyFull = `erbl_${nanoid(40)}`;
  const keyPrefix = keyFull.slice(0, 14) + "...";
  db.insert(schema.apiKeys).values({
    id, orgId: s.orgId, name, keyPrefix, keyFull, scopes,
    status: "ACTIVE", lastUsedAt: null, createdAt: Date.now(), revokedAt: null,
  }).run();
  await logAudit(s, "apikey.create", "api_key", id, { name, scopes });
  return keyFull;
}

export async function revokeApiKey(id: string) {
  const s = await requireSession();
  db.update(schema.apiKeys)
    .set({ status: "REVOKED", revokedAt: Date.now() })
    .where(and(eq(schema.apiKeys.id, id), eq(schema.apiKeys.orgId, s.orgId)))
    .run();
  await logAudit(s, "apikey.revoke", "api_key", id);
}

export async function getApiKeys() {
  const s = await requireSession();
  return db.select().from(schema.apiKeys)
    .where(eq(schema.apiKeys.orgId, s.orgId))
    .orderBy(desc(schema.apiKeys.createdAt))
    .all();
}

export async function getOrgUsers() {
  const s = await requireSession();
  return db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.orgId, s.orgId))
    .all();
}

export async function getUserSecurityEvents() {
  const s = await requireSession();
  return db.select()
    .from(schema.auditEvents)
    .where(and(eq(schema.auditEvents.orgId, s.orgId), eq(schema.auditEvents.actorId, s.id)))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(8)
    .all();
}

export async function getCounterpartyAmlDetail(counterpartyId: string) {
  const s = await requireSession();
  const ops = db.select({
    id: schema.operations.id,
    type: schema.operations.type,
    amountCents: schema.operations.amountCents,
    statusDashboard: schema.operations.statusDashboard,
    purpose: schema.operations.purpose,
    createdAt: schema.operations.createdAt,
  })
    .from(schema.operations)
    .where(and(eq(schema.operations.orgId, s.orgId), eq(schema.operations.counterpartyId, counterpartyId)))
    .orderBy(desc(schema.operations.createdAt))
    .limit(50)
    .all();
  return { ops };
}

async function logAudit(
  s: { id: string; name: string; orgId: string },
  action: string,
  objectType: string,
  objectId: string,
  payload?: Record<string, unknown>,
) {
  db.insert(schema.auditEvents).values({
    id: `aud_${nanoid(10)}`,
    orgId: s.orgId,
    actorId: s.id,
    actorName: s.name,
    action,
    objectType,
    objectId,
    ip: "127.0.0.1",
    userAgent: "Orca/1.0",
    payloadJson: payload ? JSON.stringify(payload) : null,
    severity: "INFO",
    createdAt: Date.now(),
  }).run();
}
