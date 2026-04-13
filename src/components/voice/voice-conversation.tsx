"use client";

import { useEffect, useRef } from "react";
import type { ConversationMessage } from "@/types";
import { cn } from "@/lib/utils";

interface VoiceConversationProps {
  messages: ConversationMessage[];
  isListening: boolean;
  isProcessing: boolean;
}

export function VoiceConversation({
  messages,
  isListening,
  isProcessing,
}: VoiceConversationProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isListening, isProcessing]);

  const statusLabel =
    isListening
      ? "Écoute en cours — parlez maintenant."
      : isProcessing
        ? "Traitement de votre message en cours…"
        : null;

  return (
    <div className="flex min-h-[12rem] max-h-[min(50vh,30rem)] w-full flex-col gap-3">
      {statusLabel && (
        <p
          className="px-1 text-sm font-medium text-primary"
          aria-live="polite"
        >
          {statusLabel}
        </p>
      )}

      <div
        className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border/70 bg-card/90 px-3 py-4 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:shadow-none"
        role="log"
        aria-label="Conversation avec l’assistant"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && !isListening && !isProcessing && (
          <p className="px-2 py-10 text-center text-sm text-muted-foreground">
            Votre échange avec l’assistant apparaîtra ici.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex max-w-[92%] flex-col gap-1",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <span className="px-1 text-xs font-medium text-muted-foreground">
              {msg.role === "user" ? "Vous" : "Assistant"}
            </span>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "rounded-br-md bg-primary text-primary-foreground"
                  : "rounded-bl-md border border-border/80 bg-muted/40 text-foreground"
              )}
            >
              {msg.content || (
                <span className="text-muted-foreground italic">…</span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
