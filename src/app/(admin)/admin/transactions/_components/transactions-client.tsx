'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import type { User } from '@supabase/supabase-js';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useRealtimeTransactions } from '@/hooks/use-realtime-transactions';
import { UserDetailsDialog } from '../../users/_components/user-details-dialog';
import type {
  AdminTransactionsResponse,
  TransactionWithUser,
} from '@/app/api/admin/transactions/route';

const TX_KIND_LABELS: Record<string, string> = {
  purchase: 'Achat',
  signup_bonus: 'Bonus inscription',
  debit: 'Utilisation',
  refund: 'Remboursement',
  admin_adjust: 'Ajustement admin',
  migration: 'Migration',
};

const TX_KIND_CLASSES: Record<string, string> = {
  purchase: 'bg-primary/10 text-primary border-primary/20',
  signup_bonus: 'bg-muted text-muted-foreground border-border',
  debit: 'bg-destructive/10 text-destructive border-destructive/20',
  refund: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:text-amber-400',
  admin_adjust: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:text-purple-400',
  migration: 'bg-muted text-muted-foreground border-border',
};

const PROVIDER_CLASSES: Record<string, string> = {
  fedapay: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:text-blue-400',
  lemonsqueezy: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400',
};

const DATE_PRESETS = [
  { label: 'Tout', value: '' },
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 derniers jours', value: '7d' },
  { label: '30 derniers jours', value: '30d' },
];

function KindBadge({ kind }: { kind: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        TX_KIND_CLASSES[kind] ?? 'border-border text-foreground',
      )}
    >
      {TX_KIND_LABELS[kind] ?? kind}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return <span className="text-muted-foreground">—</span>;
  const label = provider === 'fedapay' ? 'FedaPay' : provider === 'lemonsqueezy' ? 'LemonSqueezy' : provider;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
        PROVIDER_CLASSES[provider] ?? 'border-border text-foreground',
      )}
    >
      {label}
    </span>
  );
}

function DeltaCell({ delta }: { delta: number }) {
  return (
    <span
      className={cn(
        'tabular-nums font-medium',
        delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
      )}
    >
      {delta > 0 ? '+' : ''}
      {delta}
    </span>
  );
}

function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(dateString),
    );
  } catch {
    return dateString;
  }
}

function getDateRange(preset: string): { from?: string; to?: string } {
  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { from: start.toISOString() };
  }
  if (preset === '7d') {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { from: start.toISOString() };
  }
  if (preset === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { from: start.toISOString() };
  }
  return {};
}

interface Filters {
  kind: string;
  provider: string;
  datePreset: string;
  search: string;
}

interface TransactionsClientProps {
  initialData: AdminTransactionsResponse;
}

function TransactionRow({
  tx,
  isNew,
  onViewUser,
}: {
  tx: TransactionWithUser;
  isNew: boolean;
  onViewUser: (userId: string) => void;
}) {
  return (
    <li
      className={cn(
        'grid grid-cols-[1fr_90px_70px_80px_100px_80px_110px_70px] items-center gap-2 px-4 py-2.5 text-xs transition-colors',
        isNew && 'animate-pulse bg-primary/5',
      )}
    >
      <div className="min-w-0">
        {tx.user.businessName ? (
          <p className="truncate font-medium">{tx.user.businessName}</p>
        ) : null}
        <p className="truncate text-muted-foreground">
          {tx.user.email ?? <span className="italic">Sans email</span>}
        </p>
      </div>
      <div>
        <KindBadge kind={tx.kind} />
      </div>
      <div>
        <DeltaCell delta={tx.delta} />
      </div>
      <span className="tabular-nums text-muted-foreground">{tx.balanceAfter}</span>
      <span className="truncate text-muted-foreground">{tx.pack?.slug ?? '—'}</span>
      <div>
        <ProviderBadge provider={tx.paymentProvider} />
      </div>
      <span className="truncate font-mono text-[10px] text-muted-foreground">
        {tx.paymentReference ?? '—'}
      </span>
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 text-[10px]"
          onClick={() => onViewUser(tx.userId)}
          aria-label={`Voir l'utilisateur ${tx.user.email ?? tx.userId}`}
        >
          Voir
        </Button>
      </div>
    </li>
  );
}

export function TransactionsClient({ initialData }: TransactionsClientProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<Filters>({ kind: '', provider: '', datePreset: '', search: '' });
  const [draftSearch, setDraftSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  // UserDetailsDialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  const { newTransactions, ackTransaction } = useRealtimeTransactions();

  // When realtime fires a new transaction
  useEffect(() => {
    if (newTransactions.length === 0) return;
    const latest = newTransactions[0];
    toast.info('Nouvelle transaction', {
      description: `${TX_KIND_LABELS[latest.kind] ?? latest.kind} · ${latest.delta > 0 ? '+' : ''}${latest.delta} crédits`,
    });
    setNewIds((prev) => new Set([...prev, latest.id]));
    // Remove highlight after 4s
    setTimeout(() => {
      setNewIds((prev) => {
        const next = new Set(prev);
        next.delete(latest.id);
        return next;
      });
      ackTransaction(latest.id);
    }, 4000);
  }, [newTransactions, ackTransaction]);

  const fetchData = useCallback(
    (f: Filters, page: number) => {
      startTransition(async () => {
        const params = new URLSearchParams({ page: String(page), pageSize: '50' });
        if (f.kind) params.set('kind', f.kind);
        if (f.provider) params.set('provider', f.provider);
        if (f.search.trim()) params.set('search', f.search.trim());
        const range = getDateRange(f.datePreset);
        if (range.from) params.set('from', range.from);

        try {
          const res = await fetch(`/api/admin/transactions?${params.toString()}`);
          if (!res.ok) throw new Error('Erreur lors du chargement');
          const json = (await res.json()) as AdminTransactionsResponse;
          setData(json);
        } catch {
          toast.error('Impossible de charger les transactions');
        }
      });
    },
    [],
  );

  const handleFilterChange = (partial: Partial<Filters>) => {
    const next = { ...filters, ...partial };
    setFilters(next);
    fetchData(next, 1);
  };

  const handleSearch = () => {
    handleFilterChange({ search: draftSearch });
  };

  const handleClearSearch = () => {
    setDraftSearch('');
    handleFilterChange({ search: '' });
  };

  const handlePage = (newPage: number) => {
    fetchData(filters, newPage);
  };

  const handleViewUser = async (userId: string) => {
    setIsLoadingUser(true);
    try {
      const res = await fetch(`/api/admin/users/detail?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('Utilisateur introuvable');
      const user = (await res.json()) as User;
      setSelectedUser(user);
      setIsUserDialogOpen(true);
    } catch {
      toast.error("Impossible de charger l'utilisateur");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const currentPage = data.page;

  // Prepend new realtime rows (not paginated — they appear above the list)
  const realtimeRows = newTransactions.map<TransactionWithUser>((rt) => ({
    id: rt.id,
    userId: rt.user_id,
    kind: rt.kind,
    delta: rt.delta,
    balanceAfter: rt.balance_after,
    packId: rt.pack_id,
    pack: null,
    paymentProvider: rt.payment_provider,
    paymentReference: rt.payment_reference,
    metadata: rt.metadata,
    createdAt: rt.created_at,
    user: { id: rt.user_id, email: null, businessName: null },
  }));

  const allRows = [...realtimeRows, ...data.items];

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
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
            aria-label="Rechercher par email ou référence de paiement"
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

        {/* Kind filter */}
        <select
          value={filters.kind}
          onChange={(e) => handleFilterChange({ kind: e.target.value })}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filtrer par type"
        >
          <option value="">Tous les types</option>
          {Object.entries(TX_KIND_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {/* Provider filter */}
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

        {/* Date preset */}
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
        {/* Header */}
        <div className="grid grid-cols-[1fr_90px_70px_80px_100px_80px_110px_70px] items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          <span>Utilisateur</span>
          <span>Type</span>
          <span>Delta</span>
          <span>Solde après</span>
          <span>Pack</span>
          <span>Fournisseur</span>
          <span>Référence</span>
          <span className="text-right">Action</span>
        </div>

        {allRows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Aucune transaction trouvée.
          </div>
        ) : (
          <ul role="list" className="divide-y">
            {allRows.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isNew={newIds.has(tx.id)}
                onViewUser={handleViewUser}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data.total} transaction{data.total !== 1 ? 's' : ''} au total
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
            aria-label="Page précédente"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
            aria-label="Page suivante"
          >
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </div>

      {isLoadingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : null}

      <UserDetailsDialog
        user={selectedUser}
        open={isUserDialogOpen}
        onOpenChange={setIsUserDialogOpen}
      />
    </>
  );
}
