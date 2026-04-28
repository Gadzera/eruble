import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const VALID_IDS = new Set(["usr_cfo", "usr_trs", "usr_pay", "usr_app", "usr_ca", "usr_adm"]);

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId || !VALID_IDS.has(userId)) {
    return NextResponse.json({ error: "invalid user" }, { status: 400 });
  }
  const c = await cookies();
  c.set("orca_uid", userId, { path: "/", sameSite: "lax" });
  c.delete("orca_bank");
  return NextResponse.json({ ok: true });
}
