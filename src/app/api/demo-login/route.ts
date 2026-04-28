import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db/client";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "missing userId" }, { status: 400 });

  const user = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });

  const c = await cookies();
  c.set("orca_uid", userId, { path: "/", sameSite: "lax" });
  c.delete("orca_bank");

  return NextResponse.json({ ok: true });
}
