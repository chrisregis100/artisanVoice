"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, Eye, Download, Loader2 } from "lucide-react";
import { DeleteInvoiceButton } from "@/components/invoice/delete-invoice-button";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { PaidBlockMessage } from "@/components/invoice/paid-block-message";
import { SentWarningDialog } from "@/components/invoice/sent-warning-dialog";
import { PreviewModal } from "@/components/invoice/preview-modal";
import { VoiceButton } from "@/components/voice/voice-button";
import { VoiceConversation } from "@/components/voice/voice-conversation";
import { useInvoiceEdit } from "@/hooks/use-invoice-edit";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import {
  generatePDF,
  downloadPDF,
  generateFilename,
} from "@/lib/utils/pdf";
import type { InvoiceWithItems } from "@/lib/invoices/get-invoice";
import type { InvoiceItem, GeneratePDFParams } from "@/types";

interface EditInvoiceClientProps {
  invoice: InvoiceWithItems;
}

export function EditInvoiceClient({ invoice }: EditInvoiceClientProps) {
  const {
    voiceWasUsed,
    editSessionId,
    isSaving,
    markVoiceUsed,
    handleSave,
  } = useInvoiceEdit({ invoice });

  const [sentWarningOpen, setSentWarningOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    id: documentId,
    customerName,
    customerPhone,
    customerAddress,
    documentDate,
    items,
    total,
    type,
    highlightedItemId,
    conversationMessages,
    isListening,
    isProcessing,
    setCustomer,
    setCustomerAddress,
    setDocumentDate,
    updateItem,
    removeItem,
    setType,
    addItem,
  } = useInvoiceStore();

  const {
    businessName,
    businessPhone,
    businessAddress,
    quotePrefix,
    invoicePrefix,
    vatRatePercent,
  } = useSettingsStore();

  const handleCustomerNameChange = useCallback(
    (name: string) => {
      setCustomer(name, customerPhone);
    },
    [setCustomer, customerPhone]
  );

  const handleItemUpdate = useCallback(
    (id: string, updates: Partial<InvoiceItem>) => {
      updateItem(id, updates);
    },
    [updateItem]
  );

  const handleItemRemove = useCallback(
    (index: number) => {
      removeItem(index);
    },
    [removeItem]
  );

  const handleAddArticle = useCallback(() => {
    addItem("Article", 1, 0);
  }, [addItem]);

  const handleSaveClick = useCallback(() => {
    if (invoice.status === "sent") {
      setSentWarningOpen(true);
    } else {
      void handleSave();
    }
  }, [invoice.status, handleSave]);

  const handleConfirmSave = useCallback(() => {
    setSentWarningOpen(false);
    void handleSave();
  }, [handleSave]);

  const handleDownloadPDF = useCallback(async () => {
    if (items.length === 0) return;

    setIsDownloading(true);
    try {
      const params: GeneratePDFParams = {
        customerName,
        customerPhone,
        customerAddress,
        items,
        total,
        type,
        businessName: businessName || "Mon Entreprise",
        businessPhone,
        businessAddress,
        documentDate,
        quotePrefix: quotePrefix || "DV-",
        invoicePrefix: invoicePrefix || "FAC-",
        vatRatePercent: vatRatePercent ?? 20,
      };

      const blob = await generatePDF(params);
      const filename = generateFilename(type, customerName);
      downloadPDF(blob, filename);
    } catch {
      toast.error("Erreur lors de la génération du PDF");
    } finally {
      setIsDownloading(false);
    }
  }, [
    items,
    customerName,
    customerPhone,
    customerAddress,
    total,
    type,
    businessName,
    businessPhone,
    businessAddress,
    documentDate,
    quotePrefix,
    invoicePrefix,
    vatRatePercent,
  ]);

  // Block editing if document is paid
  if (invoice.status === "paid") {
    return <PaidBlockMessage />;
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1.5 text-muted-foreground"
            >
              <Link href="/invoices">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Retour</span>
              </Link>
            </Button>
            <h1 className="text-lg font-semibold">
              Modifier {invoice.type === "quote" ? "Devis" : "Facture"}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DeleteInvoiceButton
              invoiceId={invoice.id}
              invoiceStatus={invoice.status as "draft" | "sent" | "paid"}
              documentType={invoice.type as "quote" | "invoice"}
              customerName={invoice.customer_name}
              redirectAfterDelete
              variant="default"
            />
            {voiceWasUsed && (
              <div className="hidden items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 sm:flex">
                <Sparkles className="h-3.5 w-3.5" />
                1 crédit sera déduit
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewOpen(true)}
              disabled={items.length === 0}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Aperçu</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              disabled={isDownloading || items.length === 0}
              className="gap-1.5"
            >
              {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Télécharger</span>
            </Button>
            <Button
              onClick={handleSaveClick}
              disabled={isSaving || items.length === 0}
              className="rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Voice Assistant */}
        <div className="hidden w-1/3 min-w-0 flex-col border-r border-border bg-muted/20 md:flex">
          <div className="flex min-h-0 flex-1 flex-col p-4 md:p-6">
            <div className="flex min-h-0 flex-1 flex-col justify-between gap-5">
              <VoiceConversation
                messages={conversationMessages}
                isListening={isListening}
                isProcessing={isProcessing}
              />

              <div className="flex flex-col gap-3">
                <div className="flex justify-center">
                  <VoiceButton onVoiceStart={markVoiceUsed} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Document Preview */}
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto md:w-2/3">
          <div className="mx-auto w-full max-w-4xl p-4 md:p-6 lg:p-8">
            <InvoicePreview
              customerName={customerName}
              customerPhone={customerPhone}
              customerAddress={customerAddress}
              documentDate={documentDate}
              items={items}
              total={total}
              type={type}
              businessName={businessName || "Mon Entreprise"}
              businessAddress={businessAddress}
              businessPhone={businessPhone}
              quotePrefix={quotePrefix || "DV-"}
              invoicePrefix={invoicePrefix || "FAC-"}
              vatRatePercent={vatRatePercent ?? 20}
              highlightedItemId={highlightedItemId}
              onCustomerNameChange={handleCustomerNameChange}
              onCustomerAddressChange={setCustomerAddress}
              onDocumentDateChange={setDocumentDate}
              onItemUpdate={handleItemUpdate}
              onItemRemove={handleItemRemove}
              onTypeChange={setType}
              onAddArticle={handleAddArticle}
            />
          </div>
        </div>
      </div>

      {/* Mobile: Voice Button at bottom */}
      <div className="border-t border-border bg-background p-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          {voiceWasUsed && (
            <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
              <Sparkles className="h-3.5 w-3.5" />
              1 crédit
            </div>
          )}
          <div className="flex-1" />
          <VoiceButton onVoiceStart={markVoiceUsed} />
        </div>
      </div>

      <SentWarningDialog
        open={sentWarningOpen}
        onConfirm={handleConfirmSave}
        onCancel={() => setSentWarningOpen(false)}
      />

      <PreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onShare={handleDownloadPDF}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        documentDate={documentDate}
        items={items}
        total={total}
        type={type}
        businessName={businessName || "Mon Entreprise"}
        businessPhone={businessPhone}
        businessAddress={businessAddress}
        quotePrefix={quotePrefix || "DV-"}
        invoicePrefix={invoicePrefix || "FAC-"}
        vatRatePercent={vatRatePercent ?? 20}
      />
    </div>
  );
}
