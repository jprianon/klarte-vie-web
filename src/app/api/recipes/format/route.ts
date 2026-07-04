import { NextResponse } from "next/server";

import { formatNote } from "@/features/recipes/ai-provider";

/**
 * POST /api/recipes/format
 * Reçoit une note libre et renvoie une recette structurée validée.
 * Le moteur (Claude API ou Ollama local) est choisi par variable d'env dans
 * `ai-provider.ts` — cette route ne fait qu'orchestrer la requête/réponse.
 */

// Route serveur : lit les secrets/URLs d'IA (jamais exposés au client).
export const runtime = "nodejs";
// Un LLM local en CPU peut être lent : on autorise une exécution longue.
export const maxDuration = 120;

export async function POST(request: Request) {
  let note: unknown;
  try {
    note = (await request.json())?.note;
  } catch {
    return NextResponse.json({ error: "bad_request", message: "Corps JSON invalide." }, { status: 400 });
  }
  if (typeof note !== "string" || note.trim().length < 3) {
    return NextResponse.json(
      { error: "bad_request", message: "Écris quelques mots de recette d'abord." },
      { status: 400 },
    );
  }

  const result = await formatNote(note);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, message: result.message },
      { status: result.status },
    );
  }
  return NextResponse.json({ draft: result.draft });
}
