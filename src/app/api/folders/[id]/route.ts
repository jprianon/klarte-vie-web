import { NextResponse } from "next/server";

import { dbDeleteFolder, dbFolderRecipes, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ recipes: [] });
  const { id } = await params;
  try {
    return NextResponse.json({ recipes: await dbFolderRecipes(id) });
  } catch {
    return NextResponse.json({ recipes: [], error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  try {
    await dbDeleteFolder(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
