import { NextResponse } from "next/server";

import { dbRecipeFolderIds, hasDb } from "@/lib/db";

export const runtime = "nodejs";

/** GET /api/recipes/:id/folders → { folderIds } (dossiers contenant la recette). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) return NextResponse.json({ folderIds: [] });
  const { id } = await params;
  try {
    return NextResponse.json({ folderIds: await dbRecipeFolderIds(id) });
  } catch {
    return NextResponse.json({ folderIds: [], error: "db_error" }, { status: 500 });
  }
}
