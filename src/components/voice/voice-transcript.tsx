"use client";

import { cn } from "@/lib/utils";

interface VoiceTranscriptProps {
  transcript: string;
  isListening: boolean;
}

export function VoiceTranscript({ transcript, isListening }: VoiceTranscriptProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl min-h-[100px] transition-all border-4 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative",
        isListening ? "bg-primary/10 border-primary" : "bg-white"
      )}
    >
      {/* Decorative dots for a terminal/chat bubble look */}
      <div className="absolute top-3 left-3 flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-foreground"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-foreground"></div>
        <div className="w-2.5 h-2.5 rounded-full bg-foreground"></div>
      </div>

      <div className="mt-6">
        {transcript ? (
          <p className="text-lg font-bold text-foreground leading-relaxed">{transcript}</p>
        ) : isListening ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            <p className="text-base font-bold text-primary ml-2">
              En écoute...
            </p>
          </div>
        ) : (
          <p className="text-base font-medium text-muted-foreground italic">
            Votre message apparaîtra ici...
          </p>
        )}
      </div>
    </div>
  );
}
