"use client";

import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { ShareDialog } from "@/components/invoice/share-dialog";
import { Button } from "@/components/ui/button";
import { VoiceButton } from "@/components/voice/voice-button";
import { VoiceTranscript } from "@/components/voice/voice-transcript";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import type { InvoiceItem } from "@/types";
import { RotateCcw, Send, WifiOff, Mic, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
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
        <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r bg-background flex flex-col overflow-y-auto">
          {/* Top Navigation Bar */}
          <div className="hidden md:flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <Mic className="w-4 h-4 text-background" />
              </div>
              <span className="font-black text-lg tracking-tight uppercase">
                ArtisanVoice
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm font-bold text-foreground hover:underline">Nouveau devis</Link>
              <Link href="/invoices" className="text-sm font-bold text-muted-foreground hover:text-foreground hover:underline">Mes documents</Link>
              <Link href="/settings" className="text-sm font-bold text-muted-foreground hover:text-foreground hover:underline">Paramètres</Link>
              <div className="w-px h-4 bg-border mx-2"></div>
              <button onClick={handleSignOut} className="text-sm font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col p-4 md:p-8">
            <div className="md:hidden mb-8">
              <h1 className="text-3xl font-black tracking-tight mb-2">
                Assistant Vocal
              </h1>
              <p className="text-muted-foreground font-medium">
                Dictez votre devis ou facture, l&apos;assistant s&apos;occupe du
                reste.
              </p>
            </div>

            <div className={cn(
              "max-w-md mx-auto w-full flex-1 flex flex-col",
              (!hasContent && !isListening) ? "justify-center items-center" : "justify-start mt-8"
            )}>
              {(!hasContent && !isListening) ? (
                // Centered state before conversation starts
                <div className="flex flex-col items-center justify-center space-y-8 w-full">
                  <div className="text-center space-y-2 mb-4">
                    <h2 className="text-2xl font-bold">Prêt à commencer ?</h2>
                    <p className="text-muted-foreground">Appuyez sur le micro et dictez votre devis</p>
                  </div>

                  <div className="transform scale-125 my-8">
                    <VoiceButton />
                  </div>

                  <div className="space-y-4 w-full max-w-sm mt-8">
                    <p className="text-xs font-bold text-center text-muted-foreground uppercase tracking-wider">
                      Essayez de dire :
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        "« Ajoute 3 tables à 15000 francs »",
                        "« C'est pour Monsieur Kossi »",
                        "« Envoie la facture sur WhatsApp »",
                      ].map((example) => (
                        <div
                          key={example}
                          className="text-sm p-3 bg-muted/50 border border-border rounded-lg text-center text-foreground font-medium"
                        >
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                // Active conversation state
                <div className="space-y-8 w-full">
                  <VoiceTranscript
                    transcript={transcript}
                    isListening={isListening}
                  />

                  <div className="flex justify-center py-4">
                    <VoiceButton />
                  </div>
                </div>
              )}
            </div>

            {hasContent && (
              <div className="max-w-md mx-auto w-full mt-auto pt-6 border-t-2 border-muted">
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
        </div>

        {/* Right Column: Invoice Preview Section */}
        <div className="w-full md:w-1/2 flex-1 overflow-auto p-4 md:p-8 bg-muted/30">
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
