import { NextResponse } from "next/server";

import { dbDeleteRecipe, dbToggleFavorite, hasDb } from "@/lib/db";

/**
 * PATCH  /api/recipes/:id  → { is_favorite: boolean }
 * DELETE /api/recipes/:id
 */
export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.is_favorite !== "boolean") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await dbToggleFavorite(id, body.is_favorite);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/recipes/:id]", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  try {
    await dbDeleteRecipe(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/recipes/:id]", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
