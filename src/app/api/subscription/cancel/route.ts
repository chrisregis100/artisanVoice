import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { downgradeProToFree } from "@/lib/subscription/expire";
import { rateLimit } from "@/lib/utils/rate-limit";

const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  const { success } = limiter(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  const result = await downgradeProToFree(supabase, user.id);

  if (!result.ok) {
    if (result.error === "not_pro") {
      return NextResponse.json(
        { error: "Seul le forfait Pro peut être résilié." },
        { status: 400 },
      );
    }
    if (result.error === "no_subscription") {
      return NextResponse.json(
        { error: "Aucun abonnement actif." },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { error: "Impossible de mettre à jour l'abonnement." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
