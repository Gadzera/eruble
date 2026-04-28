import { cookies } from "next/headers";
import { db, schema } from "./db/client";
import { eq, and } from "drizzle-orm";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  orgId: string;
  orgName: string;
  orgInn: string;
  bankAccessId: string;
  bankId: string;
  bankCode: string;
  bankName: string;
  bankShort: string;
  bankStatus: string;
};

export async function getSession(): Promise<SessionUser | null> {
  const c = await cookies();
  const userId = c.get("orca_uid")?.value;
  const bankAccessId = c.get("orca_bank")?.value;

  // Default: pick CFO of org Alfa, default bank
  let user = userId
    ? db.select().from(schema.users).where(eq(schema.users.id, userId)).get()
    : null;

  if (!user) {
    user = db.select().from(schema.users).where(eq(schema.users.role, "CFO")).get() ?? null;
  }
  if (!user) return null;

  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, user.orgId)).get();
  if (!org) return null;

  let access = bankAccessId
    ? db.select().from(schema.bankAccess).where(and(eq(schema.bankAccess.id, bankAccessId), eq(schema.bankAccess.orgId, org.id))).get()
    : null;
  if (!access) {
    access = db.select().from(schema.bankAccess).where(and(eq(schema.bankAccess.orgId, org.id), eq(schema.bankAccess.isDefault, 1))).get()
        ?? db.select().from(schema.bankAccess).where(eq(schema.bankAccess.orgId, org.id)).get();
  }
  if (!access) return null;

  const bank = db.select().from(schema.banks).where(eq(schema.banks.id, access.bankId)).get();
  if (!bank) return null;

  return {
    id: user.id, name: user.name, email: user.email, role: user.role,
    orgId: org.id, orgName: org.shortName, orgInn: org.inn,
    bankAccessId: access.id, bankId: bank.id, bankCode: bank.code,
    bankName: bank.name, bankShort: bank.shortName, bankStatus: bank.status,
  };
}

export async function requireSession() {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}
