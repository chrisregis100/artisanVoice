"use client";

import { useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
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

  const errorParts = errorText?.split(" — ");
  const errorTitle = errorParts?.[0] ?? "";
  const errorDetail =
    errorParts && errorParts.length > 1 ? errorParts.slice(1).join(" — ") : null;

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
    <div className="flex flex-col items-center pb-2">
      {errorText && (
        <div
          className="mb-6 w-full max-w-md px-1"
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 pl-3 pr-4 py-3 shadow-sm ring-1 ring-destructive/10 border-l-4 border-l-destructive">
            <div
              className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15"
              aria-hidden="true"
            >
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
              <p className="text-sm font-semibold text-destructive leading-snug">
                {errorTitle}
              </p>
              {errorDetail && (
                <p className="text-sm text-foreground/85 leading-snug">
                  {errorDetail}
                </p>
              )}
              {showApiKeyLink && (
                <Link
                  href="/settings"
                  className="inline-flex items-center text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm"
                >
                  Aller dans Paramètres
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

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
              : "Commencer l'enregistrement vocal"
          }
          aria-pressed={isListening}
          className={cn(
            "relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-background transition-all duration-300",
            "shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.45)]",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/45",
            isListening
              ? "scale-[1.02] bg-destructive text-destructive-foreground shadow-[0_0_36px_rgba(239,68,68,0.45)]"
              : "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_44px_-10px_hsl(var(--primary)/0.5)]",
            isProcessing && "cursor-not-allowed opacity-70"
          )}
        >
          {isProcessing ? (
            <Loader2 className="h-11 w-11 animate-spin text-primary-foreground" />
          ) : isListening ? (
            <MicOff className="h-11 w-11" />
          ) : (
            <Mic className="h-11 w-11" strokeWidth={1.75} />
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
    </div>
  );
}
