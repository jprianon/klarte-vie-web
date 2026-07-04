import type { RecipeDraft } from "@/types";
import { FORMAT_SYSTEM_PROMPT, RECIPE_JSON_SCHEMA, recipeDraftSchema } from "./format";

/**
 * Reformatage « note → recette structurée », indépendant du fournisseur d'IA.
 *
 * Choix du provider via l'env (runtime, côté serveur uniquement) :
 *   RECIPE_AI_PROVIDER=ollama  → LLM local sur le VPS (gratuit, privé)
 *   RECIPE_AI_PROVIDER=claude  → API Claude
 *   (non défini)               → Claude si ANTHROPIC_API_KEY présent, sinon 503
 *
 * Les deux chemins renvoient le MÊME template (RECIPE_JSON_SCHEMA), donc l'UI et
 * le reste du code sont identiques quel que soit le moteur.
 */

export type FormatResult =
  | { ok: true; draft: RecipeDraft }
  | { ok: false; status: number; error: string; message: string };

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-opus-4-8";

/** Transforme un texte JSON en brouillon validé, ou une erreur normalisée. */
function parseDraft(text: string | undefined): FormatResult {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, status: 502, error: "empty_response", message: "Réponse vide du modèle." };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      ok: false,
      status: 502,
      error: "invalid_json",
      message: "Le modèle n'a pas renvoyé de JSON valide.",
    };
  }
  const draft = recipeDraftSchema.safeParse(parsed);
  if (!draft.success) {
    return {
      ok: false,
      status: 502,
      error: "schema_mismatch",
      message: "La recette structurée est incomplète.",
    };
  }
  return { ok: true, draft: draft.data };
}

/** Appel avec délai maximal (les modèles CPU peuvent être lents). */
async function fetchWithTimeout(url: string, init: RequestInit, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** ─── Claude (API) ─────────────────────────────────────────────────────── */
async function formatWithClaude(note: string): Promise<FormatResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      status: 503,
      error: "ai_unavailable",
      message: "Reformatage Claude non configuré (ANTHROPIC_API_KEY absente).",
    };
  }

  let res: Response;
  try {
    res = await fetchWithTimeout(
      ANTHROPIC_URL,
      {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 2048,
          system: FORMAT_SYSTEM_PROMPT,
          messages: [{ role: "user", content: note }],
          output_config: { format: { type: "json_schema", schema: RECIPE_JSON_SCHEMA } },
        }),
      },
      60_000,
    );
  } catch {
    return { ok: false, status: 502, error: "upstream_unreachable", message: "API Claude injoignable." };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      status: 502,
      error: "upstream_error",
      message: `Claude ${res.status} — ${detail.slice(0, 300)}`,
    };
  }

  const payload = await res.json();
  if (payload?.stop_reason === "refusal") {
    return { ok: false, status: 422, error: "refused", message: "Demande refusée par le modèle." };
  }
  const text = Array.isArray(payload?.content)
    ? payload.content.find((b: { type?: string }) => b?.type === "text")?.text
    : undefined;
  return parseDraft(text);
}

/** ─── Ollama (LLM local sur le VPS) ────────────────────────────────────── */
async function formatWithOllama(note: string): Promise<FormatResult> {
  const base = process.env.OLLAMA_URL;
  if (!base) {
    return {
      ok: false,
      status: 503,
      error: "ai_unavailable",
      message: "Reformatage Ollama non configuré (OLLAMA_URL absente).",
    };
  }
  const model = process.env.RECIPE_AI_MODEL ?? "qwen2.5:3b";

  let res: Response;
  try {
    res = await fetchWithTimeout(
      `${base.replace(/\/$/, "")}/api/chat`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          // Sorties structurées Ollama : on impose le même schéma que Claude.
          format: RECIPE_JSON_SCHEMA,
          options: { temperature: 0 },
          messages: [
            { role: "system", content: FORMAT_SYSTEM_PROMPT },
            { role: "user", content: note },
          ],
        }),
      },
      // Les 3B en CPU peuvent mettre plusieurs dizaines de secondes.
      110_000,
    );
  } catch {
    return {
      ok: false,
      status: 502,
      error: "upstream_unreachable",
      message: "Ollama injoignable (conteneur démarré ? modèle téléchargé ?).",
    };
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return {
      ok: false,
      status: 502,
      error: "upstream_error",
      message: `Ollama ${res.status} — ${detail.slice(0, 300)}`,
    };
  }

  const payload = await res.json();
  return parseDraft(payload?.message?.content);
}

/** Point d'entrée : dispatche selon RECIPE_AI_PROVIDER. */
export async function formatNote(note: string): Promise<FormatResult> {
  const provider = (process.env.RECIPE_AI_PROVIDER ?? "").toLowerCase();
  if (provider === "ollama") return formatWithOllama(note);
  if (provider === "claude" || process.env.ANTHROPIC_API_KEY) return formatWithClaude(note);
  return {
    ok: false,
    status: 503,
    error: "ai_unavailable",
    message: "Aucun fournisseur d'IA configuré (RECIPE_AI_PROVIDER / ANTHROPIC_API_KEY).",
  };
}
