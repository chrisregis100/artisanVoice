"use client";

import { useCallback, useMemo } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useVoice } from "@/hooks/use-voice";

function getErrorDescription(error: string): string {
  if (
    error.includes("microphone") ||
    error.includes("Microphone") ||
    error.includes("micro") ||
    error.includes("Micro")
  ) {
    return `${error} — Dans les paramètres du navigateur, autorisez l’accès au microphone pour ce site.`;
  }
  if (error.includes("connexion") || error.includes("WebSocket")) {
    return `${error} — Vérifiez votre connexion internet, puis réessayez.`;
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
            isListening ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"
          }
          aria-pressed={isListening}
          className={cn(
            "relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 border-2 border-primary/30 shadow-md",
            "focus:outline-none focus:ring-4 focus:ring-primary/40",
            isListening
              ? "bg-destructive text-destructive-foreground scale-105"
              : "bg-primary hover:bg-primary/90 text-primary-foreground",
            isProcessing && "opacity-70 cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
          ) : isListening ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
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
        <p
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[20rem] text-center text-xs text-destructive px-2"
          role="alert"
        >
          {errorText}
        </p>
      )}
    </div>
  );
}
