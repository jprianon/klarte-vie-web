import { NextResponse } from "next/server";

import { dbDeleteImage, dbGetImage, dbSetImage, hasDb } from "@/lib/db";

/**
 * GET    /api/recipes/:id/image  → l'image (ou 404)
 * POST   /api/recipes/:id/image  → corps = fichier image brut (content-type image/*)
 * DELETE /api/recipes/:id/image
 * Les images sont stockées dans Postgres (bytea) — incluses dans les sauvegardes.
 */
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  try {
    const img = await dbGetImage(id);
    if (!img) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(img.data), {
      headers: { "content-type": img.contentType, "cache-control": "private, max-age=3600" },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "bad_type", message: "Fichier image attendu." }, { status: 400 });
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "empty", message: "Fichier vide." }, { status: 400 });
  }
  if (buf.length > 10_000_000) {
    return NextResponse.json({ error: "too_large", message: "Image trop lourde (max 10 Mo)." }, { status: 413 });
  }

  try {
    await dbSetImage(id, contentType, buf);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/recipes/:id/image POST]", e);
    return NextResponse.json(
      { error: "db_error", message: e instanceof Error ? e.message : "Envoi impossible." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const { id } = await params;
  try {
    await dbDeleteImage(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[api/recipes/:id/image DELETE]", e);
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
