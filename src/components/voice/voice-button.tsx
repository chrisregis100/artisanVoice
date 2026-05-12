"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import Link from "next/link";
import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/context";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useVoice } from "@/hooks/use-voice";
import {
  useSubscriptionStatus,
  type SubscriptionStatusPayload,
} from "@/hooks/use-subscription-status";
import { QuotaExceededModal } from "@/components/pricing/quota-exceeded-modal";

function isApiKeyError(error: string): boolean {
  const lower = error.toLowerCase();
  return lower.includes("clé api") || lower.includes("api key");
}

function getErrorDescription(error: string, t: (key: string, vars?: Record<string, string>) => string): string {
  const lower = error.toLowerCase();

  // Hide raw OpenAI race condition wording from end users in case it slips
  // through the realtime client filter.
  if (lower.includes("active response in progress")) {
    return t("dashboard.voice.busyError");
  }

  if (
    lower.includes("microphone") ||
    lower.includes("micro")
  ) {
    return t("dashboard.voice.microphoneError", { error });
  }
  if (lower.includes("connexion") || lower.includes("websocket")) {
    return t("dashboard.voice.connectionError", { error });
  }
  if (isApiKeyError(error) && !error.includes("Paramètres")) {
    return t("dashboard.voice.apiKeyError", { error });
  }
  return error;
}

export function VoiceButton() {
  const { t } = useLanguage();
  const { isListening, isProcessing, isConnected, error } = useInvoiceStore();
  const { startListening, stopListening, interruptAssistant } = useVoice();
  const { data: subscriptionData } = useSubscriptionStatus();
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  const connectionLabel = useMemo(
    () =>
      isConnected
        ? t("dashboard.voice.connectionConnected")
        : t("dashboard.voice.connectionDisconnected"),
    [isConnected, t]
  );

  const errorText = error ? getErrorDescription(error, t) : null;
  const showApiKeyLink = error ? isApiKeyError(error) : false;

  const errorParts = errorText?.split(" — ");
  const errorTitle = errorParts?.[0] ?? "";
  const errorDetail =
    errorParts && errorParts.length > 1 ? errorParts.slice(1).join(" — ") : null;

  // Show toast notification for errors (complements inline alert)
  useEffect(() => {
    if (error) {
      toast.error(t("dashboard.voice.errorTitle"), {
        description: getErrorDescription(error, t),
      });
    }
  }, [error, t]);

  // Show toast when successfully connected
  useEffect(() => {
    if (isConnected && !error) {
      toast.success(t("dashboard.voice.connectedTitle"), {
        description: t("dashboard.voice.connectedDesc"),
      });
    }
  }, [isConnected, error, t]);

  const handleClick = useCallback(async () => {
    if (isListening) {
      stopListening();
      return;
    }
    if (isProcessing) {
      // AI is still talking — clicking the mic stops it (barge-in).
      interruptAssistant();
      return;
    }

    // Layer 1: Immediate check from cached subscription data.
    // If limit is null the plan is unlimited — skip quota check entirely.
    const cachedLimit = subscriptionData?.usage.limit ?? null;
    const cachedCount = subscriptionData?.usage.count ?? 0;
    if (cachedLimit !== null && cachedCount >= cachedLimit) {
      setIsQuotaModalOpen(true);
      return;
    }

    // Layer 2: Server re-check to bypass potentially stale cached data.
    try {
      const res = await fetch("/api/subscription/status");
      if (res.ok) {
        const fresh = (await res.json()) as SubscriptionStatusPayload;
        if (
          fresh.usage.limit !== null &&
          fresh.usage.count >= fresh.usage.limit
        ) {
          setIsQuotaModalOpen(true);
          return;
        }
      }
    } catch {
      // Network error — fail open and let the voice session handle server-side limits.
    }

    startListening();
  }, [
    isListening,
    isProcessing,
    interruptAssistant,
    startListening,
    stopListening,
    subscriptionData,
  ]);

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
      <QuotaExceededModal
        open={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
      />
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
                  {t("dashboard.voice.goToSettings")}
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
          tabIndex={0}
          aria-label={
            isListening
              ? t("dashboard.voice.stopRecordingAria")
              : isProcessing
              ? t("dashboard.voice.interruptAria")
              : t("dashboard.voice.startRecordingAria")
          }
          aria-pressed={isListening}
          className={cn(
            "relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-background transition-all duration-300",
            "shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.45)]",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/45",
            isListening
              ? "scale-[1.02] bg-destructive text-destructive-foreground shadow-[0_0_36px_rgba(239,68,68,0.45)]"
              :           isProcessing
            ? "bg-amber-500 text-white dark:bg-amber-600 hover:-translate-y-0.5 hover:bg-amber-500/90 dark:hover:bg-amber-600/90 shadow-[0_0_32px_rgba(245,158,11,0.45)] animate-pulse"
            : "bg-primary text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_16px_44px_-10px_hsl(var(--primary)/0.5)]"
          )}
        >
          {isListening ? (
            <MicOff className="h-11 w-11" />
          ) : isProcessing ? (
            <Square className="h-10 w-10" fill="currentColor" strokeWidth={0} />
          ) : (
            <Mic className="h-11 w-11" strokeWidth={1.75} />
          )}
        </button>

        <div
        className={cn(
          "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
          isConnected ? "bg-green-500 dark:bg-green-400" : "bg-muted-foreground"
        )}
          aria-label={connectionLabel}
          role="status"
        />
      </div>
    </div>
  );
}
