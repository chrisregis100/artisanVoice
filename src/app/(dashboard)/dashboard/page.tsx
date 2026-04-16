"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { PreviewModal } from "@/components/invoice/preview-modal";
import { ShareDialog } from "@/components/invoice/share-dialog";
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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceButton } from "@/components/voice/voice-button";
import { VoiceConversation } from "@/components/voice/voice-conversation";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { InvoiceItem } from "@/types";
import { WifiOff, Mic, Eye } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/i18n/context";

export default function DashboardPage() {
  const { t } = useLanguage();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("assistant");
  const [itemIdToFocus, setItemIdToFocus] = useState<string | null>(null);

  const {
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
    reset,
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

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const handleFinalize = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.sendVia === "whatsapp") {
        setIsShareOpen(true);
      }
    };

    window.addEventListener("finalize-document", handleFinalize);
    return () => {
      window.removeEventListener("finalize-document", handleFinalize);
    };
  }, []);

  const handleResetConfirm = () => {
    reset();
    setResetDialogOpen(false);
  };

  const handleSend = () => {
    setIsShareOpen(true);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomer(name, customerPhone);
  };

  const handleItemUpdate = (id: string, updates: Partial<InvoiceItem>) => {
    updateItem(id, updates);
  };

  const handleItemRemove = (index: number) => {
    removeItem(index);
  };

  const handleAddArticle = () => {
    const id = addItem("Article", 1, 0);
    setItemIdToFocus(id);
  };

  const handleItemFocusConsumed = () => {
    setItemIdToFocus(null);
  };

  const hasContent = items.length > 0 || Boolean(customerName);

  const sharedDocumentProps = {
    customerName,
    customerPhone,
    customerAddress,
    documentDate,
    items,
    total,
    type,
    businessName: businessName || "Mon Entreprise",
    businessAddress,
    businessPhone,
    quotePrefix: quotePrefix || "DV-",
    invoicePrefix: invoicePrefix || "FAC-",
    vatRatePercent: vatRatePercent ?? 20,
  };

  const invoicePreview = (
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
      itemIdToFocus={itemIdToFocus}
      onItemFocusConsumed={handleItemFocusConsumed}
    />
  );

  const assistantInner = (
    <div className="flex min-h-full flex-1 flex-col justify-between">
      <div className="mb-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#2e3165] py-8 text-white shadow-sm">
          <Mic className="h-6 w-6" />
          <h2 className="text-xl font-bold tracking-wide">ArtisanVoice</h2>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <VoiceConversation
          messages={conversationMessages}
          isListening={isListening}
          isProcessing={isProcessing}
        />

        <div className="flex flex-col gap-3 mt-4 px-2">
          <div className="flex flex-col gap-2 mx-auto w-full max-w-md mb-2">
           <div className="flex justify-center gap-2 flex-wrap">
            {[
              t("dashboard.main.example1"),
              t("dashboard.main.example2"),
              t("dashboard.main.example3"),
            ].map((example) => (
              <button
                key={example}
                className="rounded-full border border-border/80 bg-gray-50 px-4 py-1.5 text-xs text-gray-600 hover:bg-gray-100 transition-colors shadow-sm"
              >
                {example}
              </button>
            ))}
           </div>
          </div>
          
          <div className="flex justify-center w-full">
            <VoiceButton />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-full">
      {!isOnline && (
        <div className="bg-amber-100 text-amber-900 px-4 py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
          {t("dashboard.main.offline")}
        </div>
      )}

      <div className="hidden flex-1 flex-row overflow-hidden bg-[#f4f4f5] md:flex">
        <div className="flex min-h-0 w-1/2 min-w-0 flex-col bg-white">
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6 lg:p-8">
            {assistantInner}
          </div>
        </div>
        <div
          id="document-preview"
          className="min-h-0 w-1/2 min-w-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 border-l border-border/40"
        >
          <div className="mx-auto max-w-4xl flex flex-col h-full">
             <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{t("dashboard.main.documentPreview")}</h2>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setResetDialogOpen(true)}
                    className="rounded-lg border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isListening || isProcessing || !hasContent}
                  >
                    {t("dashboard.main.clearAll")}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={!hasContent}
                    aria-label={t("dashboard.main.previewAria")}
                    className="gap-2 rounded-lg border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Eye className="h-4 w-4" aria-hidden />
                    {t("dashboard.main.preview")}
                  </Button>
                  <Button
                    className="rounded-lg bg-[#2e3165] text-white hover:bg-[#1f2144] shadow-sm"
                    onClick={handleSend}
                    disabled={isListening || isProcessing || items.length === 0}
                  >
                    {t("dashboard.main.share")}
                  </Button>
                </div>
             </div>
            
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
               {invoicePreview}
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden flex flex-col flex-1 min-h-0 bg-background">
        <Tabs
          value={mobileTab}
          onValueChange={setMobileTab}
          className="flex flex-col flex-1 min-h-0 px-3 pt-2"
        >
          <TabsList className="w-full grid grid-cols-2 h-11 shrink-0">
            <TabsTrigger value="assistant">{t("dashboard.main.assistant")}</TabsTrigger>
            <TabsTrigger value="document" className="relative">
              {t("dashboard.main.viewDocument")}
              {hasContent && (
                <span
                  className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-primary"
                  aria-hidden
                />
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="assistant"
            className="flex-1 flex flex-col min-h-0 overflow-y-auto mt-3 pb-4 data-[state=inactive]:hidden"
          >
            {assistantInner}
          </TabsContent>
          <TabsContent
            value="document"
            className="flex-1 overflow-y-auto mt-3 pb-4 data-[state=inactive]:hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-muted-foreground">
                {t("dashboard.main.currentDocument")}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!hasContent}
                aria-label={t("dashboard.main.previewAria")}
                className="gap-1.5"
              >
                <Eye className="h-3.5 w-3.5" aria-hidden />
                {t("dashboard.main.preview")}
              </Button>
            </div>
            <div id="document-preview-mobile">{invoicePreview}</div>
          </TabsContent>
        </Tabs>
      </div>

      <PreviewModal
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        onShare={handleSend}
        {...sharedDocumentProps}
      />

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
        items={items}
        total={total}
        type={type}
        businessName={businessName}
        businessPhone={businessPhone}
        businessAddress={businessAddress}
        documentDate={documentDate}
        quotePrefix={quotePrefix || "DV-"}
        invoicePrefix={invoicePrefix || "FAC-"}
        vatRatePercent={vatRatePercent ?? 20}
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dashboard.main.confirmClearTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dashboard.main.confirmClearDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("dashboard.main.cancelBtn")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("dashboard.main.confirmBtn")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
