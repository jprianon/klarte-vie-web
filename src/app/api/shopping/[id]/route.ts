import { NextResponse } from "next/server";

import { dbDeleteShopping, dbSetShoppingChecked, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.checked !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await dbSetShoppingChecked(id, body.checked);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  try {
    await dbDeleteShopping(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
