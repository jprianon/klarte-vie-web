import { NextResponse } from "next/server";

import { dbAddPlan, dbListPlan, hasDb } from "@/lib/db";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  if (!hasDb()) return NextResponse.json({ meals: [] });
  const url = new URL(request.url);
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    return NextResponse.json({ meals: await dbListPlan(from, to) });
  } catch {
    return NextResponse.json({ meals: [], error: "db_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : "";
  const recipeId = typeof body?.recipeId === "string" ? body.recipeId : "";
  if (!DATE_RE.test(date) || !recipeId) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    await dbAddPlan(date, recipeId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
