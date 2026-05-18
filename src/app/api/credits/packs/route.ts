import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { listPacks } from "@/lib/credits/packs";

export const dynamic = "force-dynamic";

const limiter = rateLimit({ interval: 60_000, maxRequests: 120 });

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!limiter(ip).success) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  try {
    const packs = await listPacks();
    return NextResponse.json({ packs });
  } catch (err) {
    console.error("list credit packs:", err);
    return NextResponse.json({ error: "Indisponible." }, { status: 500 });
  }
}
