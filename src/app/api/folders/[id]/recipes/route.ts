import { NextResponse } from "next/server";

import { dbAddToFolder, dbRemoveFromFolder, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const recipeId = typeof body?.recipeId === "string" ? body.recipeId : "";
  if (!recipeId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await dbAddToFolder(id, recipeId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const recipeId = typeof body?.recipeId === "string" ? body.recipeId : "";
  if (!recipeId) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await dbRemoveFromFolder(id, recipeId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
