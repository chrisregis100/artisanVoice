"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VoiceButton } from "@/components/voice/voice-button";
import { VoiceConversation } from "@/components/voice/voice-conversation";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { InvoiceItem } from "@/types";
import { RotateCcw, Send, WifiOff, Mic } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("assistant");
  const [itemIdToFocus, setItemIdToFocus] = useState<string | null>(null);

  const {
    customerName,
    customerPhone,
    items,
    total,
    type,
    highlightedItemId,
    conversationMessages,
    isListening,
    isProcessing,
    setCustomer,
    updateItem,
    removeItem,
    reset,
    setType,
    addItem,
  } = useInvoiceStore();

  const { businessName, businessPhone } = useSettingsStore();

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

  const invoicePreview = (
    <InvoicePreview
      customerName={customerName}
      items={items}
      total={total}
      type={type}
      businessName={businessName || "Mon Entreprise"}
      highlightedItemId={highlightedItemId}
      onCustomerNameChange={handleCustomerNameChange}
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
              "Ajouter prestation peinture...",
              "Supprimer l'article 2...",
              "Afficher les factures..."
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
          Mode hors-ligne — les données seront synchronisées lorsque la
          connexion reviendra.
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
                <h2 className="text-2xl font-bold text-gray-900">Document Preview</h2>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setResetDialogOpen(true)}
                    className="rounded-lg border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
                    disabled={isListening || isProcessing || !hasContent}
                  >
                    Tout effacer
                  </Button>
                  <Button
                    className="rounded-lg bg-[#2e3165] text-white hover:bg-[#1f2144] shadow-sm ml-2"
                    onClick={handleSend}
                    disabled={isListening || isProcessing || items.length === 0}
                  >
                    Partager le document
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
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="document" className="relative">
              Voir le document
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
            <div id="document-preview-mobile">{invoicePreview}</div>
          </TabsContent>
        </Tabs>
      </div>

      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        customerName={customerName}
        customerPhone={customerPhone}
        items={items}
        total={total}
        type={type}
        businessName={businessName}
        businessPhone={businessPhone}
      />

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tout effacer ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le document en cours, la conversation avec l’assistant et les
              articles seront supprimés. Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tout effacer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
