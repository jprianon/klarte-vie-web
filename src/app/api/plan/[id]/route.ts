import { NextResponse } from "next/server";

import { dbDeletePlan, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  try {
    await dbDeletePlan(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
