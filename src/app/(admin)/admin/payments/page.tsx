import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaymentsClient } from './_components/payments-client';
import type { AdminPaymentsResponse, RevenueAggregates } from '@/app/api/admin/payments/route';

export const metadata: Metadata = {
  title: 'Paiements • Admin',
};

async function fetchInitialPayments(): Promise<AdminPaymentsResponse> {
  const admin = createAdminClient();

  const now = new Date();
  const ago24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const ago7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [txResult, aggResult] = await Promise.all([
    admin
      .from('credit_transactions')
      .select(
        'id, user_id, pack_id, payment_provider, payment_reference, metadata, created_at',
        { count: 'exact' },
      )
      .eq('kind', 'purchase')
      .order('created_at', { ascending: false })
      .range(0, 49),

    admin
      .from('credit_transactions')
      .select('pack_id, payment_provider, created_at')
      .eq('kind', 'purchase')
      .gte('created_at', ago30d),
  ]);

  const rows = txResult.data ?? [];
  const aggRows = aggResult.data ?? [];

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
          .from('credit_packs')
          .select('id, slug, display_name, price_xof, price_usd_cents')
          .in('id', allPackIds)
      : Promise.resolve({ data: [] }),
    uniqueUserIds.length > 0
      ? Promise.all(uniqueUserIds.map((id) => admin.auth.admin.getUserById(id)))
      : Promise.resolve([]),
    uniqueUserIds.length > 0
      ? admin.from('users').select('id, business_name').in('id', uniqueUserIds)
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

  // Compute revenue aggregates
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
    const isFedaPay = row.payment_provider === 'fedapay';
    const isLemon = row.payment_provider === 'lemonsqueezy';
    const xof = pack?.price_xof ?? 0;
    const usd = pack?.price_usd_cents ?? 0;
    const ts = row.created_at;

    totalPurchases30d += 1;
    if (isFedaPay) revenueXof30d += xof;
    if (isLemon) revenueUsdCents30d += usd;

    if (ts >= ago7d) {
      totalPurchases7d += 1;
      if (isFedaPay) revenueXof7d += xof;
      if (isLemon) revenueUsdCents7d += usd;
    }
    if (ts >= ago24h) {
      totalPurchases24h += 1;
      if (isFedaPay) revenueXof24h += xof;
      if (isLemon) revenueUsdCents24h += usd;
    }
  }

  const aggregates: RevenueAggregates = {
    revenueXof24h,
    revenueXof7d,
    revenueXof30d,
    revenueUsdCents24h,
    revenueUsdCents7d,
    revenueUsdCents30d,
    totalPurchases24h,
    totalPurchases7d,
    totalPurchases30d,
  };

  const items = rows.map((tx) => {
    const pack = tx.pack_id ? packMap.get(tx.pack_id) : null;
    const meta = (tx.metadata as Record<string, unknown>) ?? {};
    const status = (meta.status as string | undefined) ?? 'success';
    const isFedaPay = tx.payment_provider === 'fedapay';

    return {
      id: tx.id,
      userId: tx.user_id,
      userEmail: emailMap.get(tx.user_id) ?? null,
      userBusinessName: businessMap.get(tx.user_id) ?? null,
      packSlug: pack?.slug ?? null,
      packDisplayName: pack?.display_name ?? null,
      amountXof: isFedaPay ? (pack?.price_xof ?? null) : null,
      amountUsdCents: !isFedaPay && pack ? pack.price_usd_cents : null,
      paymentProvider: tx.payment_provider ?? '',
      paymentReference: tx.payment_reference ?? null,
      status,
      createdAt: tx.created_at,
    };
  });

  return {
    items,
    total: txResult.count ?? 0,
    page: 1,
    pageSize: 50,
    aggregates,
  };
}

function PaymentsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
      <div className="mt-6 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}

async function PaymentsContent() {
  const initialData = await fetchInitialPayments();
  return <PaymentsClient initialData={initialData} />;
}

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenus et historique des achats de crédits — temps réel activé.
        </p>
      </div>

      <Suspense fallback={<PaymentsSkeleton />}>
        <PaymentsContent />
      </Suspense>
    </div>
  );
}
