"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { ShareDialog } from "@/components/invoice/share-dialog";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "@/components/voice/voice-button";
import { VoiceTranscript } from "@/components/voice/voice-transcript";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { InvoiceItem } from "@/types";
import { RotateCcw, Send, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  const {
    customerName,
    customerPhone,
    items,
    total,
    type,
    highlightedItemId,
    transcript,
    isListening,
    isProcessing,
    setCustomer,
    updateItem,
    removeItem,
    reset,
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

  const handleReset = () => {
    if (items.length === 0 && !customerName) return;
    if (window.confirm("Voulez-vous effacer ce document et recommencer?")) {
      reset();
    }
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

  const hasContent = items.length > 0 || customerName;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-full">
      {!isOnline && (
        <div className="bg-amber-100 text-amber-800 px-4 py-2 text-sm flex items-center justify-center gap-2">
          <WifiOff className="h-4 w-4" />
          Mode hors-ligne - Les données seront synchronisées plus tard
        </div>
      )}

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Left Column: Navbar + Voice Interaction Section */}
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r bg-background p-4 md:p-8 flex flex-col overflow-y-auto">
          <div className="hidden md:block mb-12 max-w-md mx-auto w-full">
            <SidebarNav businessName={businessName} />
          </div>

          <div className="max-w-md mx-auto w-full space-y-8 flex-1 flex flex-col justify-center">
            <div className="md:hidden">
              <h1 className="text-3xl font-black tracking-tight mb-2">
                Assistant Vocal
              </h1>
              <p className="text-muted-foreground font-medium">
                Dictez votre devis ou facture, l&apos;assistant s&apos;occupe du
                reste.
              </p>
            </div>

            <VoiceTranscript
              transcript={transcript}
              isListening={isListening}
            />

            <div className="flex justify-center py-4">
              <VoiceButton />
            </div>

            {!hasContent && !isListening && (
              <p className="text-center font-medium text-muted-foreground">
                Appuyez sur le micro et dictez votre devis
              </p>
            )}

            {!hasContent && !isListening && (
              <div className="space-y-3">
                <p className="text-sm font-bold text-center text-muted-foreground uppercase tracking-wider">
                  Exemples
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    "3 tables à 15000",
                    "Pour Mr. Kossi",
                    "Envoie sur WhatsApp",
                  ].map((example) => (
                    <span
                      key={example}
                      className="text-sm px-3 py-1.5 bg-muted border-2 border-transparent hover:border-foreground transition-colors font-medium rounded-md text-foreground"
                    >
                      &ldquo;{example}&rdquo;
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {hasContent && (
            <div className="max-w-md mx-auto w-full mt-8 pt-6 border-t-2 border-muted">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleReset}
                  className="flex-1 border-2 font-bold"
                  disabled={isListening || isProcessing}
                >
                  <RotateCcw className="h-5 w-5 mr-2" />
                  Effacer
                </Button>
                <Button
                  size="lg"
                  className="flex-1 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                  onClick={handleSend}
                  disabled={isListening || isProcessing || items.length === 0}
                >
                  <Send className="h-5 w-5 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Invoice Preview Section */}
        <div className="w-full md:w-2/3 flex-1 overflow-auto p-4 md:p-8 bg-muted/30">
          <div className="max-w-2xl mx-auto">
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
            />
          </div>
        </div>
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
    </div>
  );
}
