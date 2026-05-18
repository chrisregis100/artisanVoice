import { NextResponse } from "next/server";

/**
 * @deprecated This route has been replaced by /api/credits/verify-purchase.
 * The subscription model has been replaced by a pay-as-you-go credit system.
 */
export function GET() {
  return NextResponse.json(
    {
      error: "This endpoint is no longer available. Use /api/credits/verify-purchase instead.",
      code: "ENDPOINT_DEPRECATED",
    },
    { status: 410 },
  );
}

export function POST() {
  return NextResponse.json(
    {
      error: "This endpoint is no longer available. Use /api/credits/verify-purchase instead.",
      code: "ENDPOINT_DEPRECATED",
    },
    { status: 410 },
  );
}
