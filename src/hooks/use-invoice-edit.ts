"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useWallet } from "@/hooks/use-wallet";
import { updateInvoiceAction } from "@/actions/invoice-actions";
import type { InvoiceWithItems } from "@/lib/invoices/get-invoice";

interface UseInvoiceEditOptions {
  invoice: InvoiceWithItems;
}

interface UseInvoiceEditReturn {
  voiceWasUsed: boolean;
  editSessionId: string | null;
  isSaving: boolean;
  markVoiceUsed: () => void;
  handleSave: () => Promise<void>;
}

export function useInvoiceEdit({
  invoice,
}: UseInvoiceEditOptions): UseInvoiceEditReturn {
  const router = useRouter();
  const { refetch: refetchWallet } = useWallet();
  const [voiceWasUsed, setVoiceWasUsed] = useState(false);
  const [editSessionId, setEditSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const hasInitialized = useRef(false);

  const loadInvoice = useInvoiceStore((state) => state.loadInvoice);

  // Initialize store with invoice data on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    loadInvoice({
      id: invoice.id,
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone ?? undefined,
      customerAddress: invoice.customerAddress ?? "",
      documentDate: invoice.documentDate,
      items: invoice.items,
      type: invoice.type,
    });
  }, [invoice, loadInvoice]);

  const markVoiceUsed = useCallback(() => {
    if (!voiceWasUsed) {
      setVoiceWasUsed(true);
      setEditSessionId(crypto.randomUUID());
    }
  }, [voiceWasUsed]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      const state = useInvoiceStore.getState();

      // Build FormData
      const formData = new FormData();
      formData.append("invoiceId", invoice.id);
      formData.append("customerName", state.customerName);
      formData.append("customerAddress", state.customerAddress);
      formData.append("customerPhone", state.customerPhone);
      formData.append("documentDate", state.documentDate);
      formData.append("type", state.type);
      formData.append(
        "items",
        JSON.stringify(
          state.items.map((item) => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))
        )
      );

      const result = await updateInvoiceAction(formData);

      if ("error" in result) {
        if (result.error === "DOCUMENT_PAID") {
          toast.error("Ce document est déjà payé et ne peut pas être modifié");
        } else if (result.error === "VALIDATION_ERROR") {
          toast.error("Données invalides. Vérifiez les champs du formulaire.");
        } else if (result.error === "UNAUTHORIZED") {
          toast.error("Session expirée. Veuillez vous reconnecter.");
        } else {
          toast.error("Erreur lors de la sauvegarde");
        }
        return;
      }

      // Charge credits if voice was used
      if (voiceWasUsed && editSessionId) {
        try {
          const documentId = `${invoice.id}:voice-edit:${editSessionId}`;
          await fetch("/api/credits/charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ documentId, phase: "commit" }),
          });
        } catch {
          // Best-effort: ignore errors, credit system will handle idempotency
        }
      }

      await refetchWallet();
      toast.success("Document enregistré");
      router.push("/invoices");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  }, [invoice.id, voiceWasUsed, editSessionId, refetchWallet, router]);

  return {
    voiceWasUsed,
    editSessionId,
    isSaving,
    markVoiceUsed,
    handleSave,
  };
}
