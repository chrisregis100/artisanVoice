'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

const DeleteUserSchema = z.object({
  userId: z.string().uuid('ID utilisateur invalide'),
});

export type DeleteUserResult = { success: true } | { error: string };

export async function deleteUserAction(
  formData: FormData,
): Promise<DeleteUserResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== env.ADMIN_EMAIL) {
    return { error: 'Accès non autorisé' };
  }

  const parsed = DeleteUserSchema.safeParse({
    userId: formData.get('userId'),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.flatten().fieldErrors.userId?.[0] ?? 'Données invalides',
    };
  }

  const { userId } = parsed.data;

  if (userId === user.id) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte' };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
