import type { Metadata } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';
import { UsersClient } from './_components/users-client';

export const metadata: Metadata = {
  title: 'Utilisateurs',
};

export default async function AdminUsersPage() {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-1 text-muted-foreground">Gestion des comptes inscrits sur la plateforme.</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">
            Erreur lors du chargement des utilisateurs : {error.message}
          </p>
        </div>
      </div>
    );
  }

  const { users } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Utilisateurs</h1>
        <p className="mt-1 text-muted-foreground">
          {users.length} utilisateur{users.length !== 1 ? 's' : ''} inscrit
          {users.length !== 1 ? 's' : ''} sur la plateforme.
        </p>
      </div>
      <UsersClient users={users} />
    </div>
  );
}
