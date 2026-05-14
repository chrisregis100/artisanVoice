import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @deprecated Plans have been replaced by credit packs.
 * Use /api/credits/packs to fetch available credit packs.
 */
export function GET() {
  return NextResponse.json(
    {
      error:
        "Les plans ont été remplacés par des packs de crédits. Utilisez /api/credits/packs.",
    },
    { status: 410 },
  );
}
