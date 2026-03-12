"use client";

import { useCallback } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useVoice } from "@/hooks/use-voice";

export function VoiceButton() {
  const { isListening, isProcessing, isConnected, error } = useInvoiceStore();
  const { startListening, stopListening } = useVoice();

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
    <div className="relative">
      {/* Pulse rings when listening */}
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
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        disabled={isProcessing}
        tabIndex={0}
        aria-label={isListening ? "Arrêter l'enregistrement" : "Commencer l'enregistrement"}
        aria-pressed={isListening}
        className={cn(
          "relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-200 border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
          "focus:outline-none focus:ring-4 focus:ring-primary/50",
          isListening
            ? "bg-destructive hover:bg-destructive/90 scale-105 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-y-[2px] translate-x-[2px]"
            : "bg-primary hover:bg-primary/90 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px]",
          isProcessing && "opacity-70 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
        ) : isListening ? (
          <MicOff className="w-8 h-8 text-destructive-foreground" />
        ) : (
          <Mic className="w-8 h-8 text-primary-foreground" />
        )}
      </button>

      {/* Status indicator */}
      {error && (
        <p className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-destructive whitespace-nowrap">
          {error}
        </p>
      )}

      {/* Connection status */}
      <div
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
          isConnected ? "bg-green-500" : "bg-muted-foreground"
        )}
        title={isConnected ? "Connecté" : "Déconnecté"}
      />
    </div>
  );
}
