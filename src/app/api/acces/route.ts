import { NextResponse } from "next/server";

/** POST /api/acces { code } → pose le cookie d'accès si le code est correct. */
export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.ACCESS_CODE;
  if (!expected) return NextResponse.json({ ok: true }); // protection désactivée

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (code !== expected) {
    return NextResponse.json({ error: "bad_code", message: "Code incorrect." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("klarte_access", expected, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
