import { NextResponse } from "next/server";

import {
  FORMAT_SYSTEM_PROMPT,
  RECIPE_JSON_SCHEMA,
  recipeDraftSchema,
} from "@/features/recipes/format";

/**
 * POST /api/recipes/format
 * Reçoit une note libre, appelle Claude (structured outputs) et renvoie une
 * recette structurée validée par zod.
 *
 * Appel via `fetch` (pas de SDK) — aucune dépendance runtime à installer, donc
 * aucun impact sur le lockfile / le build Docker.
 */

// Route serveur : lit ANTHROPIC_API_KEY (secret, jamais exposé au client).
export const runtime = "nodejs";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-4-8";

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Pas de clé → l'UI proposera la saisie manuelle du template.
    return NextResponse.json(
      { error: "ai_unavailable", message: "Reformatage IA non configuré (ANTHROPIC_API_KEY absente)." },
      { status: 503 },
    );
  }

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

  let anthropicRes: Response;
  try {
    anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2048,
        system: FORMAT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: note }],
        // Structured outputs : la réponse suit exactement le template.
        output_config: { format: { type: "json_schema", schema: RECIPE_JSON_SCHEMA } },
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "upstream_unreachable", message: "Impossible de joindre l'API Claude." },
      { status: 502 },
    );
  }

  if (!anthropicRes.ok) {
    const detail = await anthropicRes.text().catch(() => "");
    return NextResponse.json(
      { error: "upstream_error", status: anthropicRes.status, message: detail.slice(0, 500) },
      { status: 502 },
    );
  }

  const payload = await anthropicRes.json();

  // Les classifieurs de sûreté peuvent décliner (HTTP 200 + stop_reason refusal).
  if (payload?.stop_reason === "refusal") {
    return NextResponse.json(
      { error: "refused", message: "La demande a été refusée par le modèle." },
      { status: 422 },
    );
  }

  const text = Array.isArray(payload?.content)
    ? payload.content.find((b: { type?: string }) => b?.type === "text")?.text
    : undefined;
  if (typeof text !== "string") {
    return NextResponse.json(
      { error: "empty_response", message: "Réponse vide du modèle." },
      { status: 502 },
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "invalid_json", message: "Le modèle n'a pas renvoyé de JSON valide." },
      { status: 502 },
    );
  }

  const draft = recipeDraftSchema.safeParse(parsed);
  if (!draft.success) {
    return NextResponse.json(
      { error: "schema_mismatch", message: "La recette structurée est incomplète." },
      { status: 502 },
    );
  }

  return NextResponse.json({ draft: draft.data });
}
