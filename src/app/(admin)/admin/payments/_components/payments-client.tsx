'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { ArrowLeft, ArrowRight, Search, TrendingUp, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useRealtimeTransactions } from '@/hooks/use-realtime-transactions';
import type { AdminPaymentsResponse, PaymentItem, RevenueAggregates } from '@/app/api/admin/payments/route';

function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(dateString),
    );
  } catch {
    return dateString;
  }
}

function formatXof(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

function formatUsd(cents: number): string {
  return '$' + (cents / 100).toFixed(2);
}

const DATE_PRESETS = [
  { label: 'Tout', value: '' },
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours', value: '7d' },
  { label: '30 jours', value: '30d' },
];

function getDateRange(preset: string): { from?: string } {
  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  if (preset === '7d') return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString() };
  if (preset === '30d') return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString() };
  return {};
}

function ProviderBadge({ provider }: { provider: string }) {
  const label = provider === 'fedapay' ? 'FedaPay' : provider === 'lemonsqueezy' ? 'LemonSqueezy' : provider;
  const cls =
    provider === 'fedapay'
      ? 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400'
      : 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400';
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', cls)}>
      {label}
    </span>
  );
}

function RevenueCards({ aggregates }: { aggregates: RevenueAggregates }) {
  const cards = [
    {
      label: 'Revenus 24h (XOF)',
      value: formatXof(aggregates.revenueXof24h),
      sub: `${aggregates.totalPurchases24h} achat${aggregates.totalPurchases24h !== 1 ? 's' : ''}`,
      color: 'bg-blue-500/10',
      textColor: 'text-blue-500 dark:text-blue-400',
    },
    {
      label: 'Revenus 24h (USD)',
      value: formatUsd(aggregates.revenueUsdCents24h),
      sub: ' ',
      color: 'bg-yellow-500/10',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      label: 'Revenus 7j (XOF)',
      value: formatXof(aggregates.revenueXof7d),
      sub: `${aggregates.totalPurchases7d} achat${aggregates.totalPurchases7d !== 1 ? 's' : ''}`,
      color: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Revenus 7j (USD)',
      value: formatUsd(aggregates.revenueUsdCents7d),
      sub: ' ',
      color: 'bg-emerald-500/10',
      textColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Revenus 30j (XOF)',
      value: formatXof(aggregates.revenueXof30d),
      sub: `${aggregates.totalPurchases30d} achat${aggregates.totalPurchases30d !== 1 ? 's' : ''}`,
      color: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      label: 'Revenus 30j (USD)',
      value: formatUsd(aggregates.revenueUsdCents30d),
      sub: ' ',
      color: 'bg-pink-500/10',
      textColor: 'text-pink-600 dark:text-pink-400',
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-center gap-3 pt-4 pb-4">
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', card.color)}>
              <TrendingUp className={cn('h-4 w-4', card.textColor)} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              <p className="text-lg font-bold leading-tight">{card.value}</p>
              {card.sub.trim() ? (
                <p className="text-xs text-muted-foreground">{card.sub}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface Filters {
  provider: string;
  datePreset: string;
  search: string;
}

interface PaymentsClientProps {
  initialData: AdminPaymentsResponse;
}

export function PaymentsClient({ initialData }: PaymentsClientProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<Filters>({ provider: '', datePreset: '', search: '' });
  const [draftSearch, setDraftSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const { newTransactions, ackTransaction } = useRealtimeTransactions({ filterKind: 'purchase' });

  useEffect(() => {
    if (newTransactions.length === 0) return;
    const latest = newTransactions[0];
    toast.info('Nouveau paiement', {
      description: `+${latest.delta} crédits · ${latest.payment_provider ?? '—'}`,
    });
    setNewIds((prev) => new Set([...prev, latest.id]));
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(latest.id);
        return next;
      });
      ackTransaction(latest.id);
    }, 4000);
  }, [newTransactions, ackTransaction]);

  const fetchData = useCallback((f: Filters, page: number) => {
    startTransition(async () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '50' });
      if (f.provider) params.set('provider', f.provider);
      if (f.search.trim()) params.set('search', f.search.trim());
      const range = getDateRange(f.datePreset);
      if (range.from) params.set('from', range.from);

      try {
        const res = await fetch(`/api/admin/payments?${params.toString()}`);
        if (!res.ok) throw new Error('Erreur lors du chargement');
        const json = (await res.json()) as AdminPaymentsResponse;
        setData(json);
      } catch {
        toast.error('Impossible de charger les paiements');
      }
    });
  }, []);

  const handleFilterChange = (partial: Partial<Filters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    fetchData(next, 1);
  };

  const handleSearch = () => handleFilterChange({ search: draftSearch });
  const handleClearSearch = () => {
    setDraftSearch('');
    handleFilterChange({ search: '' });
  };

  const handlePage = (newPage: number) => fetchData(filters, newPage);

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));

  const realtimeItems: PaymentItem[] = newTransactions.map((rt) => ({
    id: rt.id,
    userId: rt.user_id,
    userEmail: null,
    userBusinessName: null,
    packSlug: null,
    packDisplayName: null,
    amountXof: rt.payment_provider === 'fedapay' ? null : null,
    amountUsdCents: null,
    paymentProvider: rt.payment_provider ?? '',
    paymentReference: rt.payment_reference,
    status: 'success',
    createdAt: rt.created_at,
  }));

  const allRows = [...realtimeItems, ...data.items];

  return (
    <>
      <RevenueCards aggregates={data.aggregates} />

      {/* Filters */}
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Email ou réf. de paiement…"
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-9 pr-8 text-sm"
            aria-label="Rechercher par email ou référence"
          />
          {draftSearch ? (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Effacer la recherche"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <select
          value={filters.provider}
          onChange={(e) => handleFilterChange({ provider: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filtrer par fournisseur"
        >
          <option value="">Tous les fournisseurs</option>
          <option value="fedapay">FedaPay</option>
          <option value="lemonsqueezy">LemonSqueezy</option>
        </select>

        <div className="flex gap-1">
          {DATE_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => handleFilterChange({ datePreset: preset.value })}
              className={cn(
                'h-9 rounded-md border px-3 text-xs font-medium transition-colors',
                filters.datePreset === preset.value
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={cn('mt-4 overflow-hidden rounded-lg border', isPending && 'opacity-60')}>
        <div className="grid grid-cols-[1fr_90px_100px_90px_80px_90px_70px] items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Utilisateur</span>
          <span>Pack</span>
          <span>Montant XOF</span>
          <span>Montant USD</span>
          <span>Fournisseur</span>
          <span>Référence</span>
          <span>Date</span>
        </div>

        {allRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucun paiement trouvé.
          </div>
        ) : (
          <ul role="list" className="divide-y">
            {allRows.map((item) => (
              <li
                key={item.id}
                className={cn(
                  'grid grid-cols-[1fr_90px_100px_90px_80px_90px_70px] items-center gap-2 px-4 py-2.5 text-xs',
                  newIds.has(item.id) && 'animate-pulse bg-primary/5',
                )}
              >
                <div className="min-w-0">
                  {item.userBusinessName ? (
                    <p className="truncate font-medium">{item.userBusinessName}</p>
                  ) : null}
                  <p className="truncate text-muted-foreground">
                    {item.userEmail ?? <span className="italic">Sans email</span>}
                  </p>
                </div>
                <span className="text-muted-foreground">{item.packDisplayName ?? item.packSlug ?? '—'}</span>
                <span className="tabular-nums">
                  {item.amountXof != null ? formatXof(item.amountXof) : '—'}
                </span>
                <span className="tabular-nums">
                  {item.amountUsdCents != null ? formatUsd(item.amountUsdCents) : '—'}
                </span>
                <div>
                  {item.paymentProvider ? (
                    <ProviderBadge provider={item.paymentProvider} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
                <span className="truncate font-mono text-[10px] text-muted-foreground">
                  {item.paymentReference ?? '—'}
                </span>
                <span className="text-muted-foreground">{formatDate(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data.total} paiement{data.total !== 1 ? 's' : ''} au total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(data.page - 1)}
            disabled={data.page <= 1 || isPending}
            aria-label="Page précédente"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {data.page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(data.page + 1)}
            disabled={data.page >= totalPages || isPending}
            aria-label="Page suivante"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>
    </>
  );
}
