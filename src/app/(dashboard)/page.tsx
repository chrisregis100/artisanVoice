"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { ShareDialog } from "@/components/invoice/share-dialog";
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
import {
  ChevronDown,
  LogOut,
  Mic,
  RotateCcw,
  Send,
  WifiOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("assistant");
  const [itemIdToFocus, setItemIdToFocus] = useState<string | null>(null);
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

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

  const handleManualEntryClick = () => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      setMobileTab("document");
      requestAnimationFrame(() => {
        document
          .getElementById("document-preview-mobile")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      document
        .getElementById("document-preview")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Assistant vocal
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Parler ou saisir → vérifier le document → partager
        </p>
        <p className="text-xs text-muted-foreground mt-3 max-w-md">
          Le PDF est généré sur votre appareil avant l’envoi ; le contenu du
          document reste sous votre contrôle.
        </p>
      </div>

      <button
        type="button"
        onClick={handleManualEntryClick}
        className="text-sm text-primary font-medium underline underline-offset-4 hover:text-primary/80 text-left mb-4"
      >
        Préférez-vous tout saisir à la main ?
      </button>

      <div className="flex-1 flex flex-col min-h-0 gap-4">
        <VoiceConversation
          messages={conversationMessages}
          isListening={isListening}
          isProcessing={isProcessing}
        />

        <div className="flex justify-center py-2">
          <VoiceButton />
        </div>

        <Collapsible className="group border border-border/80 rounded-lg bg-muted/30 px-3 py-2">
          <CollapsibleTrigger className="flex w-full items-center justify-between text-sm font-medium text-foreground py-2">
            Voir des exemples de phrases
            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pb-3">
            {[
              "« Ajoute 3 tables à 15000 francs »",
              "« C'est pour Monsieur Kossi »",
              "« Envoie la facture sur WhatsApp »",
            ].map((example) => (
              <div
                key={example}
                className="text-sm p-3 bg-background border border-border rounded-lg text-foreground"
              >
                {example}
              </div>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {hasContent && (
        <div className="max-w-md mx-auto w-full mt-auto pt-6 border-t border-border">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setResetDialogOpen(true)}
              className="flex-1"
              disabled={isListening || isProcessing}
            >
              <RotateCcw className="h-5 w-5 mr-2" />
              Tout effacer
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleSend}
              disabled={
                isListening || isProcessing || items.length === 0
              }
            >
              <Send className="h-5 w-5 mr-2" />
              Partager le document
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const desktopNav = (
    <div className="hidden md:flex items-center justify-between p-6 border-b border-border/80 bg-muted/20">
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
          <Mic className="w-4 h-4" />
        </div>
        <span className="font-semibold text-lg">ArtisanVoice</span>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <Link
          href="/"
          className="text-sm font-medium text-foreground hover:underline"
        >
          Nouveau devis
        </Link>
        <Link
          href="/invoices"
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Mes documents
        </Link>
        <Link
          href="/settings"
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
        >
          Paramètres
        </Link>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-medium text-muted-foreground hover:text-destructive flex items-center gap-1.5 transition-colors"
          aria-label="Se déconnecter"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:inline">Se déconnecter</span>
        </button>
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

      <div className="hidden md:flex flex-row flex-1 overflow-hidden bg-background">
        <div className="w-1/2 border-r border-border/80 flex flex-col bg-muted/10 min-h-0">
          {desktopNav}
          <div className="flex-1 flex flex-col overflow-y-auto p-6 md:p-8">
            {assistantInner}
          </div>
        </div>
        <div
          id="document-preview"
          className="w-1/2 flex-1 overflow-auto p-4 md:p-8 bg-muted/20"
        >
          <div className="max-w-2xl mx-auto">{invoicePreview}</div>
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
            <div id="document-preview-mobile">
              {invoicePreview}
            </div>
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
