import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  commitDocumentExport,
  precheckDocumentExport,
} from "@/lib/subscription/check-limits";

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const documentId =
    typeof raw.documentId === "string" ? raw.documentId.trim() : "";
  const phase = raw.phase;

  if (!documentId) {
    return NextResponse.json({ error: "documentId requis" }, { status: 400 });
  }

  if (phase === "precheck") {
    const result = await precheckDocumentExport(user.id, documentId);
    return NextResponse.json(result);
  }

  if (phase === "commit") {
    const outcome = await commitDocumentExport(user.id, documentId);
    if (outcome === "quota_exceeded") {
      return NextResponse.json(
        { error: "quota_exceeded", outcome },
        { status: 403 },
      );
    }
    return NextResponse.json({ outcome });
  }

  return NextResponse.json(
    { error: "phase invalide (precheck | commit)" },
    { status: 400 },
  );
}
