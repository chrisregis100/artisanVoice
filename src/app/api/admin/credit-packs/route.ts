import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api/auth";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

const limiter = rateLimit({ interval: 60_000, maxRequests: 20 });

const packUpdateSchema = z.object({
  id: z.string().uuid(),
  updates: z.object({
    price_usd_cents: z.number().int().min(0).optional(),
    price_xof: z.number().int().min(0).optional(),
    bonus_credits: z.number().int().min(0).optional(),
    is_active: z.boolean().optional(),
  }),
});

async function verifyAdminWithRateLimit(
  request: NextRequest,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const ip = getClientIp(request);
  const { success } = limiter(ip);
  if (!success) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Trop de requêtes." }, { status: 429 }),
    };
  }
  return requireAdmin(request);
}

export async function GET(request: NextRequest) {
  const check = await verifyAdminWithRateLimit(request);
  if (!check.ok) return check.response;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("credit_packs")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("credit_packs GET error:", error);
    return NextResponse.json({ error: "Impossible de charger les packs." }, { status: 500 });
  }

  return NextResponse.json({ packs: data ?? [] });
}

export async function PUT(request: NextRequest) {
  const check = await verifyAdminWithRateLimit(request);
  if (!check.ok) return check.response;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const parsed = packUpdateSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { id, updates } = parsed.data;
  const admin = createAdminClient();

  const { error } = await admin.from("credit_packs").update(updates).eq("id", id);
  if (error) {
    console.error("credit_packs PUT error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
