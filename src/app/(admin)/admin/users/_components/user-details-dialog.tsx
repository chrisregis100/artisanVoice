'use client';

import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '../_lib/format-date';
import type { AdminUserWalletResponse, AdminUserTransaction } from '@/app/api/admin/users/wallet/route';

interface UserDetailsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 border-b border-border/50 py-2 last:border-0">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 break-all text-xs text-foreground">{value ?? '—'}</span>
    </div>
  );
}

function JsonBlock({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) return <span className="text-xs text-muted-foreground">Aucune donnée</span>;
  return (
    <div className="space-y-1 rounded-md bg-muted/50 p-3">
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[140px_1fr] gap-2">
          <span className="text-xs font-medium text-muted-foreground">{k}</span>
          <span className="min-w-0 break-all text-xs">
            {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '—')}
          </span>
        </div>
      ))}
    </div>
  );
}

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
  refund: 'bg-muted text-muted-foreground border-border',
  admin_adjust: 'border-border text-foreground',
};

function TxKindBadge({ kind }: { kind: string }) {
  const label = TX_KIND_LABELS[kind] ?? kind;
  const cls = TX_KIND_CLASSES[kind] ?? 'border-border text-foreground';
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

function CreditSection({ userId }: { userId: string }) {
  const [data, setData] = useState<AdminUserWalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/admin/users/wallet?userId=${encodeURIComponent(userId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? `Erreur ${res.status}`);
        }
        return res.json() as Promise<AdminUserWalletResponse>;
      })
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <span className="text-xs text-muted-foreground">Chargement des crédits…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-xs text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <MetaRow
          label="Solde actuel"
          value={
            <span className="font-semibold">
              {data.balance} crédit{data.balance !== 1 ? 's' : ''}
            </span>
          }
        />
        <MetaRow
          label="A acheté"
          value={
            data.hasPurchased ? (
              <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                Oui
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Non
              </span>
            )
          }
        />
        <MetaRow
          label="Total acheté (vie)"
          value={
            data.lifetimePurchased > 0
              ? `${data.lifetimePurchased} crédit${data.lifetimePurchased !== 1 ? 's' : ''}`
              : '—'
          }
        />
        <MetaRow
          label="Dernier achat"
          value={data.lastPurchaseAt ? formatDate(data.lastPurchaseAt) : '—'}
        />
      </div>

      {data.transactions.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Dernières transactions ({data.transactions.length})
          </p>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Δ</th>
                  <th className="px-3 py-2 text-right font-medium text-muted-foreground">Solde après</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Date</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx: AdminUserTransaction, idx: number) => (
                  <tr
                    key={tx.id}
                    className={idx !== data.transactions.length - 1 ? 'border-b' : ''}
                  >
                    <td className="px-3 py-2">
                      <TxKindBadge kind={tx.kind} />
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      <span className={tx.delta > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {tx.delta > 0 ? '+' : ''}{tx.delta}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                      {tx.balanceAfter}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="py-4 text-center text-xs text-muted-foreground">
          Aucune transaction enregistrée.
        </p>
      )}
    </div>
  );
}

export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  if (!user) return null;

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            {displayName ?? user.email ?? 'Utilisateur inconnu'}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">{user.id}</p>
        </DialogHeader>

        <div className="space-y-4">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Informations générales
            </h3>
            <div className="rounded-md border">
              <MetaRow label="ID" value={user.id} />
              <MetaRow label="Email" value={user.email} />
              <MetaRow label="Téléphone" value={user.phone ?? null} />
              <MetaRow
                label="Email confirmé"
                value={
                  user.email_confirmed_at ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {formatDate(user.email_confirmed_at)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Non confirmé
                    </span>
                  )
                }
              />
              <MetaRow label="Rôle" value={user.role ?? 'authenticated'} />
              <MetaRow label="Inscrit le" value={formatDate(user.created_at)} />
              <MetaRow
                label="Dernière connexion"
                value={user.last_sign_in_at ? formatDate(user.last_sign_in_at) : null}
              />
              <MetaRow
                label="Modifié le"
                value={user.updated_at ? formatDate(user.updated_at) : null}
              />
            </div>
          </section>

          {open ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Crédits
              </h3>
              <CreditSection userId={user.id} />
            </section>
          ) : null}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Métadonnées utilisateur
            </h3>
            <JsonBlock data={user.user_metadata ?? {}} />
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Métadonnées application
            </h3>
            <JsonBlock data={user.app_metadata ?? {}} />
          </section>

          {user.identities && user.identities.length > 0 ? (
            <section>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Identités ({user.identities.length})
              </h3>
              <div className="space-y-2">
                {user.identities.map((identity) => (
                    <div
                    key={identity.id}
                    className="rounded-md border p-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">
                        {identity.provider}
                      </span>
                      <span className="text-muted-foreground">
                        {identity.created_at ? formatDate(identity.created_at) : '—'}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-muted-foreground">
                      {identity.identity_id ?? identity.id}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
