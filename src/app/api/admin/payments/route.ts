import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const PROVIDERS = ["fedapay", "lemonsqueezy"] as const;

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  provider: z.enum(PROVIDERS).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  search: z.string().max(200).optional(),
});

export interface RevenueAggregates {
  revenueXof24h: number;
  revenueXof7d: number;
  revenueXof30d: number;
  revenueUsdCents24h: number;
  revenueUsdCents7d: number;
  revenueUsdCents30d: number;
  totalPurchases24h: number;
  totalPurchases7d: number;
  totalPurchases30d: number;
}

export interface PaymentItem {
  id: string;
  userId: string;
  userEmail: string | null;
  userBusinessName: string | null;
  packSlug: string | null;
  packDisplayName: string | null;
  amountXof: number | null;
  amountUsdCents: number | null;
  paymentProvider: string;
  paymentReference: string | null;
  status: string;
  createdAt: string;
}

export interface AdminPaymentsResponse {
  items: PaymentItem[];
  total: number;
  page: number;
  pageSize: number;
  aggregates: RevenueAggregates;
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

  const { page, pageSize, provider, from, to, search } = parsed.data;
  const admin = createAdminClient();
  const offset = (page - 1) * pageSize;

  const now = new Date();
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  // If search by email, find user IDs
  let filterUserIds: string[] | null = null;
  if (search && search.includes("@")) {
    const { data: authData } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const matchedIds = (authData?.users ?? [])
      .filter((u) => u.email?.toLowerCase().includes(search.toLowerCase()))
      .map((u) => u.id);
    filterUserIds = matchedIds.length > 0 ? matchedIds : ["__no_match__"];
  }

  // Paginated purchase transactions
  let txQuery = admin
    .from("credit_transactions")
    .select(
      "id, user_id, pack_id, payment_provider, payment_reference, metadata, created_at",
      { count: "exact" },
    )
    .eq("kind", "purchase")
    .order("created_at", { ascending: false });

  if (provider) txQuery = txQuery.eq("payment_provider", provider);
  if (from) txQuery = txQuery.gte("created_at", from);
  if (to) txQuery = txQuery.lte("created_at", to);
  if (filterUserIds) {
    txQuery = txQuery.in("user_id", filterUserIds);
  } else if (search && !search.includes("@")) {
    txQuery = txQuery.ilike("payment_reference", `%${search}%`);
  }

  txQuery = txQuery.range(offset, offset + pageSize - 1);

  // Aggregate transactions for the last 30 days (for revenue calculation)
  const aggQuery = admin
    .from("credit_transactions")
    .select("pack_id, payment_provider, created_at")
    .eq("kind", "purchase")
    .gte("created_at", ago30d);

  const [txResult, aggResult] = await Promise.all([txQuery, aggQuery]);

  if (txResult.error) {
    console.error("admin payments tx error:", txResult.error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des paiements." },
      { status: 500 },
    );
  }

  const rows = txResult.data ?? [];
  const aggRows = aggResult.data ?? [];

  // Collect unique pack IDs from both lists
  const allPackIds = [
    ...new Set([
      ...rows.map((r) => r.pack_id).filter(Boolean) as string[],
      ...aggRows.map((r) => r.pack_id).filter(Boolean) as string[],
    ]),
  ];

  const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];

  const [packsResult, userResults, publicUserResult] = await Promise.all([
    allPackIds.length > 0
      ? admin
          .from("credit_packs")
          .select("id, slug, display_name, price_xof, price_usd_cents")
          .in("id", allPackIds)
      : Promise.resolve({ data: [] }),
    uniqueUserIds.length > 0
      ? Promise.all(uniqueUserIds.map((id) => admin.auth.admin.getUserById(id)))
      : Promise.resolve([]),
    uniqueUserIds.length > 0
      ? admin.from("users").select("id, business_name").in("id", uniqueUserIds)
      : Promise.resolve({ data: [] as Array<{ id: string; business_name: string }> }),
  ]);

  type PackRow = { id: string; slug: string; display_name: string; price_xof: number; price_usd_cents: number };
  const packMap = new Map<string, PackRow>();
  for (const p of (packsResult.data ?? []) as PackRow[]) {
    packMap.set(p.id, p);
  }

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

  // Compute revenue aggregates from aggRows
  let revenueXof24h = 0;
  let revenueXof7d = 0;
  let revenueXof30d = 0;
  let revenueUsdCents24h = 0;
  let revenueUsdCents7d = 0;
  let revenueUsdCents30d = 0;
  let totalPurchases24h = 0;
  let totalPurchases7d = 0;
  let totalPurchases30d = 0;

  for (const row of aggRows) {
    const pack = row.pack_id ? packMap.get(row.pack_id) : null;
    const isFedaPay = row.payment_provider === "fedapay";
    const isLemonSqueezy = row.payment_provider === "lemonsqueezy";
    const xof = pack?.price_xof ?? 0;
    const usd = pack?.price_usd_cents ?? 0;
    const ts = row.created_at;

    totalPurchases30d += 1;
    if (isFedaPay) revenueXof30d += xof;
    if (isLemonSqueezy) revenueUsdCents30d += usd;

    if (ts >= ago7d) {
      totalPurchases7d += 1;
      if (isFedaPay) revenueXof7d += xof;
      if (isLemonSqueezy) revenueUsdCents7d += usd;
    }

    if (ts >= ago24h) {
      totalPurchases24h += 1;
      if (isFedaPay) revenueXof24h += xof;
      if (isLemonSqueezy) revenueUsdCents24h += usd;
    }
  }

  const items: PaymentItem[] = rows.map((tx) => {
    const pack = tx.pack_id ? packMap.get(tx.pack_id) : null;
    const meta = (tx.metadata as Record<string, unknown>) ?? {};
    const status = (meta.status as string | undefined) ?? "success";
    const isFedaPay = tx.payment_provider === "fedapay";

    return {
      id: tx.id,
      userId: tx.user_id,
      userEmail: emailMap.get(tx.user_id) ?? null,
      userBusinessName: businessMap.get(tx.user_id) ?? null,
      packSlug: pack?.slug ?? null,
      packDisplayName: pack?.display_name ?? null,
      amountXof: isFedaPay ? (pack?.price_xof ?? null) : null,
      amountUsdCents: !isFedaPay ? (pack?.price_usd_cents ?? null) : null,
      paymentProvider: tx.payment_provider ?? "",
      paymentReference: tx.payment_reference ?? null,
      status,
      createdAt: tx.created_at,
    };
  });

  const response: AdminPaymentsResponse = {
    items,
    total: txResult.count ?? 0,
    page,
    pageSize,
    aggregates: {
      revenueXof24h,
      revenueXof7d,
      revenueXof30d,
      revenueUsdCents24h,
      revenueUsdCents7d,
      revenueUsdCents30d,
      totalPurchases24h,
      totalPurchases7d,
      totalPurchases30d,
    },
  };

  return NextResponse.json(response);
}
