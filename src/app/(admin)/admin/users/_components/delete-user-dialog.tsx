'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteUserAction } from '@/actions/users-actions';

interface DeleteUserDialogProps {
  userId: string;
  userEmail: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted: () => void;
}

export function DeleteUserDialog({
  userId,
  userEmail,
  open,
  onOpenChange,
  onDeleted,
}: DeleteUserDialogProps) {
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set('userId', userId);
      const result = await deleteUserAction(formData);

      if ('error' in result) {
        toast.error('Suppression impossible', { description: result.error });
        return;
      }

      toast.success('Utilisateur supprimé', {
        description: userEmail ? `${userEmail} a été supprimé.` : 'Compte supprimé.',
      });
      onDeleted();
      onOpenChange(false);
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer cet utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Cette action est <strong>irréversible</strong>. Le compte de{' '}
              <strong>{userEmail ?? 'cet utilisateur'}</strong> sera
              définitivement supprimé, ainsi que toutes les données associées.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
