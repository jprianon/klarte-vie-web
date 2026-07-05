import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { formatNote } from "@/features/recipes/ai-provider";

/**
 * POST /api/recipes/ocr — corps = image brute (content-type image/*).
 * Tesseract lit le texte de la capture, puis le moteur IA (Ollama/Claude) le
 * range dans le template. Renvoie { draft } comme /api/recipes/format.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

function runTesseract(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(
      "tesseract",
      [path, "stdout", "-l", "fra"],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => (err ? reject(err) : resolve(stdout)),
    );
  });
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return NextResponse.json({ error: "bad_type", message: "Fichier image attendu." }, { status: 400 });
  }

  const buf = Buffer.from(await request.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "empty", message: "Fichier vide." }, { status: 400 });
  }
  if (buf.length > 15_000_000) {
    return NextResponse.json({ error: "too_large", message: "Image trop lourde (max 15 Mo)." }, { status: 413 });
  }

  const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  const path = join(tmpdir(), `ocr-${randomUUID()}.${ext}`);

  let text = "";
  try {
    await writeFile(path, buf);
    text = await runTesseract(path);
  } catch (e) {
    console.error("[api/recipes/ocr]", e);
    return NextResponse.json(
      { error: "ocr_failed", message: "Lecture de l'image impossible (OCR indisponible ?)." },
      { status: 500 },
    );
  } finally {
    void unlink(path).catch(() => undefined);
  }

  if (text.trim().length < 10) {
    return NextResponse.json(
      { error: "empty_text", message: "Aucun texte lisible sur l'image." },
      { status: 422 },
    );
  }

  const result = await formatNote(text);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
  }
  return NextResponse.json({ draft: result.draft });
}
