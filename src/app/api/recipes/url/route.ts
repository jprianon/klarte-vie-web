import { NextResponse } from "next/server";

import { formatNote } from "@/features/recipes/ai-provider";

/**
 * POST /api/recipes/url — corps = { url }.
 * Récupère la page, en extrait la recette (JSON-LD schema.org/Recipe en priorité,
 * sinon texte nettoyé), puis la met en fiche via l'IA. Renvoie { draft } comme
 * /api/recipes/format. Best-effort : dépend du balisage du site source.
 */
export const runtime = "nodejs";
export const maxDuration = 120;

async function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Certains sites renvoient une page vide sans user-agent « navigateur ».
        "user-agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile Safari/604.1",
        accept: "text/html,application/xhtml+xml",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Décode les entités HTML les plus courantes. */
function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

/** HTML → texte lisible (retire script/style/nav, aplatit les balises). */
function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(nav|header|footer|aside)[\s\S]*?<\/\1>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

type JsonLdRecipe = {
  name?: string;
  recipeYield?: unknown;
  totalTime?: string;
  recipeIngredient?: unknown;
  ingredients?: unknown;
  recipeInstructions?: unknown;
};

/** Cherche un objet @type Recipe dans un JSON-LD (gère @graph et les tableaux). */
function findRecipe(node: unknown): JsonLdRecipe | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = findRecipe(n);
      if (r) return r;
    }
    return null;
  }
  const obj = node as Record<string, unknown>;
  const type = obj["@type"];
  const isRecipe = Array.isArray(type)
    ? type.some((t) => String(t).toLowerCase() === "recipe")
    : String(type ?? "").toLowerCase() === "recipe";
  if (isRecipe) return obj as JsonLdRecipe;
  if (obj["@graph"]) return findRecipe(obj["@graph"]);
  return null;
}

/** Objet Recipe JSON-LD → texte structuré donné à l'IA. */
function recipeToText(r: JsonLdRecipe): string {
  const lines: string[] = [];
  if (r.name) lines.push(String(r.name));
  if (r.recipeYield) lines.push(`Pour : ${String(r.recipeYield)}`);
  if (r.totalTime) lines.push(`Durée : ${String(r.totalTime)}`);

  const ings = r.recipeIngredient ?? r.ingredients;
  if (Array.isArray(ings) && ings.length) {
    lines.push("Ingrédients :");
    for (const i of ings) lines.push(`- ${String(i)}`);
  }

  const steps = r.recipeInstructions;
  const stepTexts: string[] = [];
  if (typeof steps === "string") stepTexts.push(steps);
  else if (Array.isArray(steps)) {
    for (const s of steps) {
      if (typeof s === "string") stepTexts.push(s);
      else if (s && typeof s === "object" && "text" in s) stepTexts.push(String((s as { text: unknown }).text));
    }
  }
  if (stepTexts.length) {
    lines.push("Préparation :");
    for (const s of stepTexts) lines.push(s);
  }
  return lines.join("\n");
}

/** Extrait la recette d'une page : JSON-LD d'abord, sinon texte brut nettoyé. */
function extractRecipeText(html: string): string {
  const scripts = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const m of scripts) {
    try {
      const recipe = findRecipe(JSON.parse(m[1]!.trim()));
      if (recipe) {
        const text = recipeToText(recipe);
        if (text.trim().length >= 30) return text;
      }
    } catch {
      /* JSON-LD mal formé : on continue */
    }
  }
  return htmlToText(html).slice(0, 8000);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  if (!/^https?:\/\/.+/i.test(url)) {
    return NextResponse.json({ error: "bad_url", message: "Lien invalide (https://…)." }, { status: 400 });
  }

  let html = "";
  try {
    const res = await fetchWithTimeout(url, 20_000);
    if (!res.ok) {
      return NextResponse.json(
        { error: "fetch_failed", message: `Page inaccessible (${res.status}).` },
        { status: 502 },
      );
    }
    html = await res.text();
  } catch {
    return NextResponse.json(
      { error: "unreachable", message: "Impossible de récupérer la page." },
      { status: 502 },
    );
  }

  const text = extractRecipeText(html);
  if (text.trim().length < 30) {
    return NextResponse.json(
      { error: "empty_text", message: "Aucune recette trouvée sur cette page." },
      { status: 422 },
    );
  }

  const result = await formatNote(text);
  if (!result.ok) {
    return NextResponse.json({ error: result.error, message: result.message }, { status: result.status });
  }
  return NextResponse.json({ draft: result.draft });
}
