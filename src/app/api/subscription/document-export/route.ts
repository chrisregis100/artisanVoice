import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import {
  commitDocumentExport,
  precheckDocumentExport,
} from "@/lib/subscription/check-limits";
import { documentExportSchema } from "@/lib/api/schemas";

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

  const bodyResult = documentExportSchema.safeParse(rawBody);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const { documentId, phase } = bodyResult.data;

  if (phase === "precheck") {
    const result = await precheckDocumentExport(user.id, documentId);
    return NextResponse.json(result);
  }

  const outcome = await commitDocumentExport(user.id, documentId);
  if (outcome === "quota_exceeded") {
    return NextResponse.json(
      { error: "quota_exceeded", outcome },
      { status: 403 },
    );
  }
  return NextResponse.json({ outcome });
}
