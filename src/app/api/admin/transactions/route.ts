import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const TX_KINDS = [
  "purchase",
  "signup_bonus",
  "debit",
  "refund",
  "admin_adjust",
  "migration",
] as const;

const PROVIDERS = ["fedapay", "lemonsqueezy"] as const;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  kind: z.enum(TX_KINDS).optional(),
  provider: z.enum(PROVIDERS).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().max(200).optional(),
});

export interface TransactionUser {
  id: string;
  email: string | null;
  businessName: string | null;
}

export interface TransactionPack {
  id: string;
  slug: string;
  displayName: string;
  priceXof: number;
  priceUsdCents: number;
}

export interface TransactionWithUser {
  id: string;
  userId: string;
  kind: string;
  delta: number;
  balanceAfter: number;
  packId: string | null;
  pack: TransactionPack | null;
  paymentProvider: string | null;
  paymentReference: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: TransactionUser;
}

export interface AdminTransactionsResponse {
  items: TransactionWithUser[];
  total: number;
  page: number;
  pageSize: number;
}

export async function GET(request: NextRequest) {
  const check = await requireAdmin(request);
  if (!check.ok) return check.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { page, pageSize, kind, provider, from, to, search } = parsed.data;
  const admin = createAdminClient();
  const offset = (page - 1) * pageSize;

  // If search contains '@', find user IDs matching that email first
  let filterUserIds: string[] | null = null;
  if (search && search.includes("@")) {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const matchedIds = (authData?.users ?? [])
      .filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()))
      .map((u) => u.id);
    filterUserIds = matchedIds.length > 0 ? matchedIds : ["__no_match__"];
  }

  let query = admin
    .from("credit_transactions")
    .select(
      "id, user_id, kind, delta, balance_after, pack_id, payment_provider, payment_reference, metadata, created_at",
      { count: "exact" },
    )
    .order("created_at", { ascending: false });

  if (kind) query = query.eq("kind", kind);
  if (provider) query = query.eq("payment_provider", provider);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  if (filterUserIds) {
    query = query.in("user_id", filterUserIds);
  } else if (search && !search.includes("@")) {
    query = query.ilike("payment_reference", `%${search}%`);
  }

  query = query.range(offset, offset + pageSize - 1);

  const { data: txData, error: txError, count } = await query;
  if (txError) {
    console.error("admin transactions error:", txError);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des transactions." },
      { status: 500 },
    );
  }

  const rows = txData ?? [];
  const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];
  const uniquePackIds = [...new Set(rows.map((r) => r.pack_id).filter(Boolean) as string[])];

  const [userResults, publicUserResult, packsResult] = await Promise.all([
    uniqueUserIds.length > 0
      ? Promise.all(uniqueUserIds.map((id) => admin.auth.admin.getUserById(id)))
      : Promise.resolve([]),
    uniqueUserIds.length > 0
      ? admin.from("users").select("id, business_name").in("id", uniqueUserIds)
      : Promise.resolve({ data: [] as Array<{ id: string; business_name: string }> }),
    uniquePackIds.length > 0
      ? admin
          .from("credit_packs")
          .select("id, slug, display_name, price_xof, price_usd_cents")
          .in("id", uniquePackIds)
      : Promise.resolve({ data: [] }),
  ]);

  const emailMap = new Map<string, string | null>();
  for (const result of userResults as Awaited<ReturnType<typeof admin.auth.admin.getUserById>>[]) {
    if (result.data?.user) {
      emailMap.set(result.data.user.id, result.data.user.email ?? null);
    }
  }

  const businessMap = new Map<string, string | null>();
  for (const u of (publicUserResult as { data: Array<{ id: string; business_name: string }> | null }).data ?? []) {
    businessMap.set(u.id, u.business_name ?? null);
  }

  const packMap = new Map<string, { slug: string; display_name: string; price_xof: number; price_usd_cents: number }>();
  for (const p of (packsResult.data ?? []) as Array<{ id: string; slug: string; display_name: string; price_xof: number; price_usd_cents: number }>) {
    packMap.set(p.id, p);
  }

  const items: TransactionWithUser[] = rows.map((tx) => {
    const packData = tx.pack_id ? packMap.get(tx.pack_id) ?? null : null;
    return {
      id: tx.id,
      userId: tx.user_id,
      kind: tx.kind,
      delta: tx.delta,
      balanceAfter: tx.balance_after,
      packId: tx.pack_id ?? null,
      pack: packData
        ? {
            id: tx.pack_id!,
            slug: packData.slug,
            displayName: packData.display_name,
            priceXof: packData.price_xof,
            priceUsdCents: packData.price_usd_cents,
          }
        : null,
      paymentProvider: tx.payment_provider ?? null,
      paymentReference: tx.payment_reference ?? null,
      metadata: (tx.metadata as Record<string, unknown>) ?? {},
      createdAt: tx.created_at,
      user: {
        id: tx.user_id,
        email: emailMap.get(tx.user_id) ?? null,
        businessName: businessMap.get(tx.user_id) ?? null,
      },
    };
  });

  const response: AdminTransactionsResponse = {
    items,
    total: count ?? 0,
    page,
    pageSize,
  };

  return NextResponse.json(response);
}
