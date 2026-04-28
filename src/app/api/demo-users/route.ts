import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";

export async function GET() {
  const org = db.select({ id: schema.organizations.id }).from(schema.organizations).get();
  if (!org) return NextResponse.json([]);
  const users = db
    .select({ id: schema.users.id, name: schema.users.name, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.orgId, org.id))
    .all();
  return NextResponse.json(users);
}
