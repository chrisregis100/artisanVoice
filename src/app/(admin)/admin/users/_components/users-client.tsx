'use client';

import { useState, useMemo } from 'react';
import type { User } from '@supabase/supabase-js';
import { Eye, Search, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatDate } from '../_lib/format-date';
import { UserDetailsDialog } from './user-details-dialog';
import { DeleteUserDialog } from './delete-user-dialog';

interface UsersClientProps {
  users: User[];
}

function ProviderBadge({ provider }: { provider: string }) {
  const label = provider === 'email' ? 'Email' : provider;
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize">
      {label}
    </span>
  );
}

function EmailBadge({ confirmed }: { confirmed: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        confirmed
          ? 'bg-green-500/10 text-green-700 dark:text-green-400'
          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          confirmed ? 'bg-green-500' : 'bg-amber-500',
        )}
      />
      {confirmed ? 'Confirmé' : 'Non confirmé'}
    </span>
  );
}

export function UsersClient({ users: initialUsers }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.email?.toLowerCase().includes(q) ||
        (u.user_metadata?.full_name as string | undefined)
          ?.toLowerCase()
          .includes(q) ||
        (u.user_metadata?.name as string | undefined)
          ?.toLowerCase()
          .includes(q),
    );
  }, [users, search]);

  const handleOpenDetails = (user: User) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleOpenDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const handleUserDeleted = () => {
    if (userToDelete) {
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
    }
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <Users className="mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden />
        <p className="font-medium text-muted-foreground">Aucun utilisateur</p>
        <p className="mt-1 text-sm text-muted-foreground/70">
          Aucun compte n&apos;est encore inscrit sur la plateforme.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Rechercher par email ou nom…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Rechercher un utilisateur"
          />
        </div>

        {/* Table header — desktop only */}
        <div className="hidden rounded-lg border md:block">
          <div className="grid grid-cols-[1fr_140px_140px_130px_130px_80px] items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <span>Utilisateur</span>
            <span>Provider</span>
            <span>Email</span>
            <span>Inscrit le</span>
            <span>Dernière connexion</span>
            <span className="text-right">Actions</span>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Aucun résultat pour &quot;{search}&quot;
            </div>
          ) : (
            <ul role="list">
              {filteredUsers.map((user, idx) => {
                const displayName =
                  (user.user_metadata?.full_name as string | undefined) ??
                  (user.user_metadata?.name as string | undefined);
                const provider =
                  user.app_metadata?.provider as string | undefined;
                const isEmailConfirmed = Boolean(user.email_confirmed_at);

                return (
                  <li
                    key={user.id}
                    className={cn(
                      'grid grid-cols-[1fr_140px_140px_130px_130px_80px] items-center gap-2 px-4 py-3 text-sm',
                      idx !== filteredUsers.length - 1 && 'border-b',
                    )}
                  >
                    <div className="min-w-0">
                      {displayName ? (
                        <p className="truncate font-medium">{displayName}</p>
                      ) : null}
                      <p
                        className={cn(
                          'truncate text-muted-foreground',
                          !displayName && 'font-medium text-foreground',
                        )}
                      >
                        {user.email ?? <span className="italic">Sans email</span>}
                      </p>
                    </div>
                    <div>
                      <ProviderBadge provider={provider ?? 'email'} />
                    </div>
                    <div>
                      <EmailBadge confirmed={isEmailConfirmed} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(user.created_at)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : '—'}
                    </span>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDetails(user)}
                        aria-label={`Voir les détails de ${user.email ?? 'cet utilisateur'}`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleOpenDelete(user)}
                        aria-label={`Supprimer ${user.email ?? 'cet utilisateur'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Cards — mobile only */}
        <div className="space-y-3 md:hidden">
          {filteredUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucun résultat pour &quot;{search}&quot;
            </p>
          ) : (
            filteredUsers.map((user) => {
              const displayName =
                (user.user_metadata?.full_name as string | undefined) ??
                (user.user_metadata?.name as string | undefined);
              const provider =
                user.app_metadata?.provider as string | undefined;
              const isEmailConfirmed = Boolean(user.email_confirmed_at);

              return (
                <div
                  key={user.id}
                  className="rounded-lg border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {displayName ? (
                        <p className="truncate font-medium">{displayName}</p>
                      ) : null}
                      <p
                        className={cn(
                          'truncate text-sm text-muted-foreground',
                          !displayName && 'font-medium text-foreground',
                        )}
                      >
                        {user.email ?? (
                          <span className="italic">Sans email</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleOpenDetails(user)}
                        aria-label={`Voir les détails de ${user.email ?? 'cet utilisateur'}`}
                      >
                        <Eye className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleOpenDelete(user)}
                        aria-label={`Supprimer ${user.email ?? 'cet utilisateur'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <ProviderBadge provider={provider ?? 'email'} />
                    <EmailBadge confirmed={isEmailConfirmed} />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>
                      <span className="block font-medium text-foreground/70">
                        Inscrit le
                      </span>
                      {formatDate(user.created_at)}
                    </div>
                    <div>
                      <span className="block font-medium text-foreground/70">
                        Dernière connexion
                      </span>
                      {user.last_sign_in_at
                        ? formatDate(user.last_sign_in_at)
                        : '—'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {filteredUsers.length > 0 ? (
          <p className="text-right text-xs text-muted-foreground">
            {filteredUsers.length} utilisateur
            {filteredUsers.length !== 1 ? 's' : ''}
            {search ? ` trouvé${filteredUsers.length !== 1 ? 's' : ''}` : ''}
          </p>
        ) : null}
      </div>

      <UserDetailsDialog
        user={selectedUser}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      {userToDelete ? (
        <DeleteUserDialog
          userId={userToDelete.id}
          userEmail={userToDelete.email}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onDeleted={handleUserDeleted}
        />
      ) : null}
    </>
  );
}
