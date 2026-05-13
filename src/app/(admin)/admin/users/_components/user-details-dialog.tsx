'use client';

import type { User } from '@supabase/supabase-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '../_lib/format-date';

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
