import { NextResponse } from "next/server";

import { dbDeleteImage, dbGetImage, dbSetImage, hasDb } from "@/lib/db";

/**
 * GET    /api/recipes/:id/image  → l'image (ou 404)
 * POST   /api/recipes/:id/image  → corps = fichier image brut (content-type image/*)
 * DELETE /api/recipes/:id/image
 * Les images sont stockées dans Postgres (bytea) — incluses dans les sauvegardes.
 */
export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return new NextResponse(null, { status: 404 });
  const { id } = await params;
  const width = Number(new URL(request.url).searchParams.get("w")) || 0;
  try {
    const img = await dbGetImage(id);
    if (!img) return new NextResponse(null, { status: 404 });

    let data: Buffer = img.data;
    let contentType = img.contentType;

    // Vignette redimensionnée à la demande (?w=…) : divise par ~100 le poids
    // d'une photo de téléphone servie à 96px. sharp est optionnel : en cas
    // d'absence/erreur on renvoie l'original (aucune régression).
    if (width > 0 && width <= 2048) {
      const sharp = await import("sharp")
        .then((m) => m.default)
        .catch(() => null);
      if (sharp) {
        try {
          const wantsWebp = (request.headers.get("accept") ?? "").includes("image/webp");
          const pipe = sharp(img.data)
            .rotate() // auto-oriente via l'EXIF (photos de travers du mobile)
            .resize({ width, withoutEnlargement: true });
          data = wantsWebp
            ? await pipe.webp({ quality: 72 }).toBuffer()
            : await pipe.jpeg({ quality: 78 }).toBuffer();
          contentType = wantsWebp ? "image/webp" : "image/jpeg";
        } catch {
          /* garde l'original */
        }
      }
    }

    return new NextResponse(new Uint8Array(data), {
      headers: {
        "content-type": contentType,
        "cache-control": "private, max-age=86400",
        vary: "Accept",
      },
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
