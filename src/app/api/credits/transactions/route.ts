import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { listTransactions } from "@/lib/credits/wallet";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

  try {
    const transactions = await listTransactions(auth.user.id, limit);
    return NextResponse.json({ transactions });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to load transactions",
      },
      { status: 500 },
    );
  }
}
