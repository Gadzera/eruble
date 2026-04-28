import { NextResponse } from "next/server";
import { getOperation } from "@/lib/queries";
import { requireSession } from "@/lib/session";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const { id } = await params;
  const op = getOperation(id);
  if (!op || op.orgId !== s.orgId) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(op);
}
