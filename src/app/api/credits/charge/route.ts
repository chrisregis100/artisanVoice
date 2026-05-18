import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { precheckCharge, commitCharge } from "@/lib/credits/charge";
import { creditChargeSchema } from "@/lib/api/schemas";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user } = auth;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const bodyResult = creditChargeSchema.safeParse(rawBody);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const { documentId, phase } = bodyResult.data;

  if (phase === "precheck") {
    const result = await precheckCharge(user.id, documentId);
    return NextResponse.json(result);
  }

  // phase === "commit"
  const result = await commitCharge(user.id, documentId);
  if (result === "insufficient_balance") {
    return NextResponse.json(
      { error: "insufficient_balance", result },
      { status: 402 },
    );
  }
  return NextResponse.json({ result });
}
