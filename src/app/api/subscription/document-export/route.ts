import { NextResponse } from "next/server";

/**
 * @deprecated Use /api/credits/charge instead.
 * This endpoint has been replaced by the pay-as-you-go credit system.
 */
export async function POST() {
  return NextResponse.json(
    {
      deprecated: true,
      message: "Use /api/credits/charge instead.",
    },
    { status: 410 },
  );
}
