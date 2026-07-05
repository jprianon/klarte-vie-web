import { NextResponse } from "next/server";

import { dbCreateFolder, dbListFolders, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ configured: false, folders: [] });
  try {
    return NextResponse.json({ configured: true, folders: await dbListFolders() });
  } catch {
    return NextResponse.json({ configured: true, folders: [], error: "db_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (name.length < 1) {
    return NextResponse.json({ error: "bad_request", message: "Nom de dossier requis." }, { status: 400 });
  }
  try {
    return NextResponse.json({ folder: await dbCreateFolder(name) });
  } catch (e) {
    console.error("[api/folders POST]", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
