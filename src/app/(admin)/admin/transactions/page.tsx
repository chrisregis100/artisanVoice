import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { TransactionsClient } from './_components/transactions-client';
import type { AdminTransactionsResponse } from '@/app/api/admin/transactions/route';

export const metadata: Metadata = {
  title: 'Transactions • Admin',
};

async function fetchInitialTransactions(): Promise<AdminTransactionsResponse> {
  const admin = createAdminClient();

  const { data: txData, count, error } = await admin
    .from('credit_transactions')
    .select(
      'id, user_id, kind, delta, balance_after, pack_id, payment_provider, payment_reference, metadata, created_at',
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(0, 49);

  if (error) {
    return { items: [], total: 0, page: 1, pageSize: 50 };
  }

  const rows = txData ?? [];
  const uniqueUserIds = [...new Set(rows.map((r) => r.user_id))];
  const uniquePackIds = [...new Set(rows.map((r) => r.pack_id).filter(Boolean) as string[])];

  const [userResults, publicUserResult, packsResult] = await Promise.all([
    uniqueUserIds.length > 0
      ? Promise.all(uniqueUserIds.map((id) => admin.auth.admin.getUserById(id)))
      : Promise.resolve([]),
    uniqueUserIds.length > 0
      ? admin.from('users').select('id, business_name').in('id', uniqueUserIds)
      : Promise.resolve({ data: [] as Array<{ id: string; business_name: string }> }),
    uniquePackIds.length > 0
      ? admin
          .from('credit_packs')
          .select('id, slug, display_name, price_xof, price_usd_cents')
          .in('id', uniquePackIds)
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

  type PackRow = { id: string; slug: string; display_name: string; price_xof: number; price_usd_cents: number };
  const packMap = new Map<string, PackRow>();
  for (const p of (packsResult.data ?? []) as PackRow[]) {
    packMap.set(p.id, p);
  }

  const items = rows.map((tx) => {
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

  return { items, total: count ?? 0, page: 1, pageSize: 50 };
}

function TransactionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
      ))}
    </div>
  );
}

async function TransactionsContent() {
  const initialData = await fetchInitialTransactions();
  return <TransactionsClient initialData={initialData} />;
}

export default function AdminTransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historique de toutes les transactions de crédits — temps réel activé.
        </p>
      </div>

      <Suspense fallback={<TransactionsSkeleton />}>
        <TransactionsContent />
      </Suspense>
    </div>
  );
}
