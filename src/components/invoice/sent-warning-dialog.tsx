"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SentWarningDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SentWarningDialog({
  open,
  onConfirm,
  onCancel,
}: SentWarningDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Document déjà envoyé</AlertDialogTitle>
          <AlertDialogDescription>
            Ce document a déjà été envoyé au client. Le modifier le repassera en
            statut Brouillon. Vous devrez le renvoyer après modification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            Confirmer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
