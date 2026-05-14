import { NextResponse } from "next/server";

/**
 * @deprecated Subscription creation is no longer supported.
 * Users purchase credit packs at /credits/buy instead.
 */
export function POST() {
  return NextResponse.json(
    {
      error:
        "Les abonnements ont été remplacés par des crédits. Achetez des crédits sur /credits/buy.",
    },
    { status: 410 },
  );
}
