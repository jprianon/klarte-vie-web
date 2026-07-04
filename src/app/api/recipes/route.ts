import { NextResponse } from "next/server";

import { dbCreateRecipe, dbListRecipes, hasDb } from "@/lib/db";
import { recipeDraftSchema } from "@/features/recipes/format";

/**
 * GET  /api/recipes  → { configured, recipes }
 * POST /api/recipes  → { recipe }   (body : { draft, rawNote, source })
 * Stockage : Postgres local (cf. src/lib/db.ts). Le champ `configured` indique
 * au client si la base est branchée (sinon il reste en mode démo).
 */
export const runtime = "nodejs";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ configured: false, recipes: [] });
  try {
    const recipes = await dbListRecipes();
    return NextResponse.json({ configured: true, recipes });
  } catch (e) {
    console.error("[api/recipes GET]", e);
    return NextResponse.json(
      {
        configured: true,
        recipes: [],
        error: "db_error",
        message: e instanceof Error ? e.message : "Base injoignable.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!hasDb()) {
    return NextResponse.json({ error: "not_configured", message: "Base non configurée." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = recipeDraftSchema.safeParse(body?.draft);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request", message: "Recette invalide." }, { status: 400 });
  }
  const rawNote = typeof body?.rawNote === "string" ? body.rawNote : null;
  const source = body?.source === "manual" ? "manual" : "ai";

  try {
    const recipe = await dbCreateRecipe(parsed.data, rawNote, source);
    return NextResponse.json({ recipe });
  } catch (e) {
    console.error("[api/recipes POST]", e);
    return NextResponse.json(
      { error: "db_error", message: e instanceof Error ? e.message : "Enregistrement impossible." },
      { status: 500 },
    );
  }
}
