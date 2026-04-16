import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

const limiter = rateLimit({ interval: 60_000, maxRequests: 20 });

async function verifyAdmin(
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

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Non autorisé." },
        { status: 401 }
      ),
    };
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 }
      ),
    };
  }

  return { ok: true };
}

function maskApiKey(key: string | undefined): string {
  if (!key || key.length < 8) return key ? "***" : "Non configurée";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  const check = await verifyAdmin(request);
  if (!check.ok) return check.response;

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
      openai: maskApiKey(process.env.OPENAI_API_KEY),
      gemini: maskApiKey(process.env.GEMINI_API_KEY),
    },
  });
}

export async function PUT(request: NextRequest) {
  const check = await verifyAdmin(request);
  if (!check.ok) return check.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Handle plan updates: { type: "plan", id: string, updates: { price_amount?, invoice_limit? } }
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "type" in body &&
    (body as { type: unknown }).type === "plan"
  ) {
    const planBody = body as unknown as {
      id: string;
      updates: { price_amount?: number; invoice_limit?: number };
    };
    const { id, updates } = planBody;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "id requis." }, { status: 400 });
    }

    const { error } = await admin
      .from("plans")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Plan update error:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  // Handle admin_settings update: { key: string, value: unknown }
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "key" in body &&
    "value" in body
  ) {
    const { key, value } = body as { key: string; value: unknown };

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "key requis." }, { status: 400 });
    }

    const { error } = await admin
      .from("admin_settings")
      .upsert(
        { key, value: value as import("@/lib/supabase/types").Json, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );

    if (error) {
      console.error("Admin settings update error:", error);
      return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Format de requête invalide." }, { status: 400 });
}
