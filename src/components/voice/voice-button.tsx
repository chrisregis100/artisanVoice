"use client";

import { useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useVoice } from "@/hooks/use-voice";

function isApiKeyError(error: string): boolean {
  const lower = error.toLowerCase();
  return lower.includes("clé api") || lower.includes("api key");
}

function getErrorDescription(error: string): string {
  const lower = error.toLowerCase();
  if (
    lower.includes("microphone") ||
    lower.includes("micro")
  ) {
    return `${error} — Dans les paramètres du navigateur, autorisez l'accès au microphone pour ce site.`;
  }
  if (lower.includes("connexion") || lower.includes("websocket")) {
    return `${error} — Vérifiez votre connexion internet, puis réessayez.`;
  }
  if (isApiKeyError(error) && !error.includes("Paramètres")) {
    return `${error} — Rendez-vous dans Paramètres → Clé API.`;
  }
  return error;
}

export function VoiceButton() {
  const { isListening, isProcessing, isConnected, error } = useInvoiceStore();
  const { startListening, stopListening } = useVoice();

  const connectionLabel = useMemo(
    () =>
      isConnected
        ? "Connexion au serveur vocal : connecté"
        : "Connexion au serveur vocal : déconnecté",
    [isConnected]
  );

  const errorText = error ? getErrorDescription(error) : null;
  const showApiKeyLink = error ? isApiKeyError(error) : false;

  // Show toast notification for errors (complements inline alert)
  useEffect(() => {
    if (error) {
      toast.error("Erreur", {
        description: getErrorDescription(error),
      });
    }
  }, [error]);

  // Show toast when successfully connected
  useEffect(() => {
    if (isConnected && !error) {
      toast.success("Connecté", {
        description: "Le serveur vocal est prêt.",
      });
    }
  }, [isConnected, error]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  return (
    <div className="relative flex flex-col items-center pb-10">
      <div className="relative">
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring" />
            <div
              className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}

        <button
          type="button"
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          tabIndex={0}
          aria-label={
            isListening
              ? "Arrêter l'enregistrement"
              : "Commencer l'enregistrement"
          }
          aria-pressed={isListening}
          className={cn(
            "relative flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 border border-primary/20",
            "focus:outline-none focus:ring-4 focus:ring-primary/40",
            isListening
              ? "bg-destructive text-destructive-foreground scale-[1.02] shadow-[0_0_30px_rgba(239,68,68,0.4)]"
              : "bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30 shadow-lg",
            isProcessing && "opacity-70 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" />
          ) : isListening ? (
            <MicOff className="w-10 h-10" />
          ) : (
            <Mic className="w-10 h-10" />
          )}
        </button>

        <div
          className={cn(
            "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
            isConnected ? "bg-green-500" : "bg-muted-foreground"
          )}
          aria-label={connectionLabel}
          role="status"
        />
      </div>

      {errorText && (
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[22rem] text-center px-2"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-xs text-destructive leading-snug">{errorText}</p>
          {showApiKeyLink && (
            <Link
              href="/settings"
              className="mt-1 inline-block text-xs font-medium text-primary underline underline-offset-2 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded"
            >
              Aller dans Paramètres
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
