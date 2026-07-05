import { NextResponse } from "next/server";

import { dbAddShopping, dbClearShopping, dbListShopping, hasDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  if (!hasDb()) return NextResponse.json({ configured: false, items: [] });
  try {
    return NextResponse.json({ configured: true, items: await dbListShopping() });
  } catch {
    return NextResponse.json({ configured: true, items: [], error: "db_error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const body = await request.json().catch(() => null);
  const labels: string[] = Array.isArray(body?.labels)
    ? body.labels.filter((l: unknown): l is string => typeof l === "string")
    : typeof body?.label === "string"
      ? [body.label]
      : [];
  if (labels.length === 0) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    await dbAddShopping(labels);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!hasDb()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const onlyChecked = new URL(request.url).searchParams.get("checked") === "1";
  try {
    await dbClearShopping(onlyChecked);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "db_error" }, { status: 500 });
  }
}
