import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/api/auth";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { env } from "@/lib/env";
import {
  adminApiKeyUpdateSchema,
  adminPlanUpdateSchema,
  adminSettingKeyValueSchema,
} from "@/lib/api/schemas";
import {
  ADMIN_SECRET_KEY_AFRI,
  ADMIN_SECRET_KEY_GEMINI,
  ADMIN_SECRET_KEY_OPENAI,
  buildSecretPayload,
  maskFromStored,
  parseStoredSecret,
} from "@/lib/admin/provider-keys";
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

function resolveServerKeyInfo(
  dbValue: unknown,
  envKey: string | undefined,
): { source: "database" | "environment" | "none"; mask: string } {
  const row = parseStoredSecret(dbValue);
  if (row) {
    return { source: "database", mask: maskFromStored(row) };
  }
  if (envKey) {
    return { source: "environment", mask: maskApiKey(envKey) };
  }
  return { source: "none", mask: "Non configurée" };
}

export async function GET(request: NextRequest) {
  const check = await verifyAdminWithRateLimit(request);
  if (!check.ok) return check.response;

  // Admin client is intentional: this route queries aggregate data across ALL users
  // (total user count, all invoices, all active subscriptions) — cross-user reads that
  // require bypassing RLS. Access is gated behind requireAdmin() above.
  const admin = createAdminClient();

  const [
    settingsResult,
    usersResult,
    invoicesResult,
    walletsResult,
    secretKeysResult,
  ] = await Promise.all([
    admin.from("admin_settings").select("*"),
    admin.from("users").select("id", { count: "exact", head: true }),
    admin.from("invoices").select("id", { count: "exact", head: true }),
    admin
      .from("credit_wallets")
      .select("balance", { count: "exact" }),
    admin
      .from("admin_settings")
      .select("key, value")
      .in("key", [ADMIN_SECRET_KEY_OPENAI, ADMIN_SECRET_KEY_GEMINI, ADMIN_SECRET_KEY_AFRI]),
  ]);

  const settings = settingsResult.data ?? [];
  const totalUsers = usersResult.count ?? 0;
  const totalInvoices = invoicesResult.count ?? 0;
  const wallets = walletsResult.data ?? [];
  const walletsWithCredits = wallets.filter((w) => w.balance > 0).length;
  const totalCreditsBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const secretRows = secretKeysResult.data ?? [];
  const openaiSecret = secretRows.find((r) => r.key === ADMIN_SECRET_KEY_OPENAI);
  const geminiSecret = secretRows.find((r) => r.key === ADMIN_SECRET_KEY_GEMINI);
  const afriSecret = secretRows.find((r) => r.key === ADMIN_SECRET_KEY_AFRI);

  return NextResponse.json({
    settings,
    plans: [],
    stats: {
      totalUsers,
      totalInvoices,
      freeSubscriptions: 0,
      proSubscriptions: 0,
      monthlyRevenue: 0,
      walletsWithCredits,
      totalCreditsBalance,
    },
    serverKeys: {
      openai: resolveServerKeyInfo(openaiSecret?.value, env.OPENAI_API_KEY),
      gemini: resolveServerKeyInfo(geminiSecret?.value, env.GEMINI_API_KEY),
      afri: resolveServerKeyInfo(afriSecret?.value, env.AFRI_API_KEY),
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

  // Plan updates are no longer supported — plans replaced by credit packs
  const planResult = adminPlanUpdateSchema.safeParse(rawBody);
  if (planResult.success) {
    return NextResponse.json(
      { error: "La gestion des plans a été remplacée par les packs de crédits." },
      { status: 410 },
    );
  }

  const apiKeyResult = adminApiKeyUpdateSchema.safeParse(rawBody);
  if (apiKeyResult.success) {
    const { provider, apiKey, clear } = apiKeyResult.data;
    const settingKey =
      provider === "gemini" ? ADMIN_SECRET_KEY_GEMINI : ADMIN_SECRET_KEY_OPENAI;

    if (clear) {
      const { error } = await admin.from("admin_settings").delete().eq("key", settingKey);
      if (error) {
        console.error("Admin API key clear error:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression." }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    try {
      const payload = buildSecretPayload(apiKey!.trim());
      const { error } = await admin.from("admin_settings").upsert(
        {
          key: settingKey,
          value: payload,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" },
      );
      if (error) {
        console.error("Admin API key upsert error:", error);
        return NextResponse.json({ error: "Erreur lors de l’enregistrement." }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    } catch (err) {
      if (err instanceof Error && err.message === "MISSING_ENCRYPTION_KEY") {
        return NextResponse.json(
          {
            error:
              "Définissez ADMIN_SECRETS_ENCRYPTION_KEY (32 octets encodés en base64, ex. openssl rand -base64 32) pour stocker des clés depuis l’interface.",
          },
          { status: 400 },
        );
      }
      throw err;
    }
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
    {
      error: "Données invalides.",
      details: {
        plan: planResult.success ? undefined : planResult.error.flatten(),
        apiKey: apiKeyResult.success ? undefined : apiKeyResult.error.flatten(),
        kv: kvResult.success ? undefined : kvResult.error.flatten(),
      },
    },
    { status: 400 },
  );
}
