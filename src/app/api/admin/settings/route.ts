import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api/auth";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { env } from "@/lib/env";
import { adminPlanUpdateSchema, adminSettingKeyValueSchema } from "@/lib/api/schemas";
import type { Json } from "@/lib/supabase/types";

const limiter = rateLimit({ interval: 60_000, maxRequests: 20 });

async function verifyAdminWithRateLimit(
  request: NextRequest
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const ip = getClientIp(request);
  const { success } = limiter(ip);
  if (!success) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Trop de requêtes." },
        { status: 429 }
      ),
    };
  }

  return requireAdmin(request);
}

function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 8) return key ? "***" : "Non configurée";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const check = await verifyAdminWithRateLimit(request);
  if (!check.ok) return check.response;

  // Admin client is intentional: this route queries aggregate data across ALL users
  // (total user count, all invoices, all active subscriptions) — cross-user reads that
  // require bypassing RLS. Access is gated behind requireAdmin() above.
  const admin = createAdminClient();

  const [settingsResult, plansResult, usersResult, invoicesResult, subsResult] =
    await Promise.all([
      admin.from("admin_settings").select("*"),
      admin.from("plans").select("*").order("price_amount"),
      admin.from("users").select("id", { count: "exact", head: true }),
      admin.from("invoices").select("id", { count: "exact", head: true }),
      admin.from("subscriptions").select("plan_id, status").eq("status", "active"),
    ]);

  const settings = settingsResult.data ?? [];
  const plans = plansResult.data ?? [];
  const totalUsers = usersResult.count ?? 0;
  const totalInvoices = invoicesResult.count ?? 0;
  const activeSubs = subsResult.data ?? [];

  const proSubs = activeSubs.filter((s) => {
    const plan = plans.find((p) => p.id === s.plan_id);
    return plan && plan.price_amount > 0;
  });
  const freeSubs = activeSubs.length - proSubs.length;
  const monthlyRevenue = proSubs.reduce((acc, s) => {
    const plan = plans.find((p) => p.id === s.plan_id);
    return acc + (plan?.price_amount ?? 0);
  }, 0);

  return NextResponse.json({
    settings,
    plans,
    stats: {
      totalUsers,
      totalInvoices,
      freeSubscriptions: freeSubs,
      proSubscriptions: proSubs.length,
      monthlyRevenue,
    },
    serverKeys: {
      openai: maskApiKey(env.OPENAI_API_KEY),
      gemini: maskApiKey(env.GEMINI_API_KEY),
    },
  });
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

  // Admin client is intentional: mutates admin-only tables (`plans`, `admin_settings`)
  // that regular users must not be able to write to. Access is gated behind requireAdmin() above.
  const admin = createAdminClient();

  // Handle plan updates: { type: "plan", id: string, updates: { price_amount?, invoice_limit? } }
  const planResult = adminPlanUpdateSchema.safeParse(rawBody);
  if (planResult.success) {
    const { id, updates } = planResult.data;
    const { error } = await admin.from("plans").update(updates).eq("id", id);
    if (error) {
      console.error("Plan update error:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // Handle admin_settings update: { key: string, value: unknown }
  const kvResult = adminSettingKeyValueSchema.safeParse(rawBody);
  if (kvResult.success) {
    const { key, value } = kvResult.data;
    const { error } = await admin
      .from("admin_settings")
      .upsert(
        { key, value: value as Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    if (error) {
      console.error("Admin settings update error:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json(
    { error: "Données invalides.", details: planResult.error.flatten() },
    { status: 400 }
  );
}
