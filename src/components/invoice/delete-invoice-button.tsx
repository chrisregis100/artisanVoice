"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { deleteInvoiceAction } from "@/actions/invoice-actions";
import { cn } from "@/lib/utils";

interface DeleteInvoiceButtonProps {
  invoiceId: string;
  invoiceStatus: "draft" | "sent" | "paid";
  documentType: "quote" | "invoice";
  customerName?: string | null;
  redirectAfterDelete?: boolean;
  variant?: "icon" | "default";
  className?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Vous n'êtes pas autorisé à effectuer cette action",
  NOT_FOUND: "Document introuvable",
  DOCUMENT_PAID: "Un document payé ne peut pas être supprimé",
  SERVER_ERROR: "Une erreur est survenue, veuillez réessayer",
  VALIDATION_ERROR: "Données invalides",
};

export function DeleteInvoiceButton({
  invoiceId,
  invoiceStatus,
  documentType,
  customerName,
  redirectAfterDelete = false,
  variant = "icon",
  className,
}: DeleteInvoiceButtonProps) {
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (invoiceStatus === "paid") return null;

  const docLabel = documentType === "quote" ? "devis" : "facture";
  const docLabelCapitalized = documentType === "quote" ? "Devis" : "Facture";

  const dialogDescription =
    invoiceStatus === "sent"
      ? `Ce ${docLabel} a été envoyé au client. Êtes-vous sûr de vouloir le supprimer ? Cette action est irréversible.`
      : `Êtes-vous sûr de vouloir supprimer ce ${docLabel} ? Cette action est irréversible.`;

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteInvoiceAction({ invoiceId });

      if ("success" in result) {
        toast.success(`${docLabelCapitalized} supprimé avec succès`);
        setIsDialogOpen(false);
        if (redirectAfterDelete) {
          router.push("/invoices");
        }
      } else {
        toast.error(ERROR_MESSAGES[result.error] ?? "Une erreur est survenue");
        setIsDialogOpen(false);
      }
    });
  };

  const dialogTitle = customerName
    ? `Supprimer ce ${docLabel} — ${customerName}`
    : `Supprimer ce ${docLabel}`;

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={isPending}
          aria-label={`Supprimer ce ${docLabel}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setIsDialogOpen(true);
            }
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50",
            className,
          )}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTriggerClick}
          disabled={isPending}
          className={cn(
            "gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
            className,
          )}
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Supprimer</span>
        </Button>
      )}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dialogDescription}</AlertDialogDescription>
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
              {isPending ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
