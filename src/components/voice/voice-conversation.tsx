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
    <div className="flex flex-col gap-3 min-h-[12rem] max-h-[min(50vh,28rem)] w-full">
      {statusLabel && (
        <p
          className="text-sm font-medium text-muted-foreground px-1"
          aria-live="polite"
        >
          {statusLabel}
        </p>
      )}

      <div
        className="flex-1 overflow-y-auto rounded-xl border border-border/80 bg-muted/40 px-3 py-3 space-y-3"
        role="log"
        aria-label="Conversation avec l’assistant"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {messages.length === 0 && !isListening && !isProcessing && (
          <p className="text-sm text-muted-foreground text-center py-8 px-2">
            Votre échange avec l’assistant apparaîtra ici.
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col gap-1 max-w-[92%]",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <span className="text-xs font-medium text-muted-foreground px-1">
              {msg.role === "user" ? "Vous" : "Assistant"}
            </span>
            <div
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-background border border-border text-foreground rounded-bl-md"
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
