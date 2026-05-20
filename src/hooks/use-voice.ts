"use client";

import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useInvoiceStore } from "@/stores/invoice-store";
import { RealtimeClient } from "@/lib/openai/realtime-client";
import { GeminiRealtimeClient } from "@/lib/gemini/realtime-client";

// ---------------------------------------------------------------------------
// Zod schemas — validate every function-call payload before touching the store
// ---------------------------------------------------------------------------

const AddItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
});

const RemoveItemSchema = z.object({
  item_index: z.number().int(),
});

const SetCustomerSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
});

const FinalizeDocumentSchema = z.object({
  send_via: z.enum(["whatsapp", "sms", "email"]).optional(),
});

const UpdateItemSchema = z.object({
  item_index: z.number().int(),
  description: z.string().optional(),
  quantity: z.number().positive().optional(),
  unit_price: z.number().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Input sample rate per provider (output playback is always 24 kHz). */
const PROVIDER_SAMPLE_RATE: Record<"openai" | "gemini", number> = {
  openai: 24000,
  gemini: 16000,
};

/** Path to the AudioWorklet module (served from /public). */
const WORKLET_PATH = "/audio-processor.js";

/**
 * Fallback delay before clearing the "processing" spinner when the AI
 * response-done event never fires (e.g. network loss). Kept deliberately
 * short so the UI doesn't feel stuck.
 */
const PROCESSING_FALLBACK_MS = 5000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VoiceClient {
  sendAudio(audioData: ArrayBuffer): void;
  commitAudio(): void;
  cancelResponse(): void;
  disconnect(): void;
  readonly isConnected: boolean;
}

interface UseVoiceReturn {
  startListening: () => void;
  stopListening: () => void;
  interruptAssistant: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoice(): UseVoiceReturn {
  const clientRef = useRef<VoiceClient | null>(null);

  // Two separate AudioContexts: one for recording, one for playback.
  // Keeping them separate prevents closing one from disrupting the other.
  const recordCtxRef = useRef<AudioContext | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);

  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const isInterruptedRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const inputSampleRateRef = useRef<number>(24000);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Set to true when finalize_document fires so onResponseDone can disconnect cleanly. */
  const stopAfterFinalizeRef = useRef(false);

  const {
    setListening,
    setProcessing,
    setConnected,
    pushUserMessage,
    appendAssistantDelta,
    setError,
    addItem,
    removeItem,
    setCustomer,
    updateItem,
    reset,
    requestFinalize,
  } = useInvoiceStore();

  // -------------------------------------------------------------------------
  // Audio playback
  // -------------------------------------------------------------------------

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    isInterruptedRef.current = false;

    while (audioQueueRef.current.length > 0) {
      if (isInterruptedRef.current) break;

      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      try {
        if (
          !playbackCtxRef.current ||
          playbackCtxRef.current.state === "closed"
        ) {
          playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
        }

        if (playbackCtxRef.current.state === "suspended") {
          await playbackCtxRef.current.resume();
        }

        const int16Array = new Int16Array(audioData);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768;
        }

        const audioBuffer = playbackCtxRef.current.createBuffer(
          1,
          float32Array.length,
          24000,
        );
        audioBuffer.copyToChannel(float32Array, 0);

        const source = playbackCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackCtxRef.current.destination);
        currentSourceRef.current = source;
        source.start();

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
        });

        if (currentSourceRef.current === source) {
          currentSourceRef.current = null;
        }
      } catch (err) {
        console.error("Audio playback error:", err);
      }
    }

    currentSourceRef.current = null;
    isPlayingRef.current = false;
  }, []);

  const interruptAssistant = useCallback(() => {
    isInterruptedRef.current = true;
    audioQueueRef.current = [];

    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // already stopped
      }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;

    clientRef.current?.cancelResponse();

    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
    setProcessing(false);
  }, [setProcessing]);

  // -------------------------------------------------------------------------
  // Cleanup helpers
  // -------------------------------------------------------------------------

  /** Tears down the microphone capture pipeline (worklet + stream + context). */
  const cleanupRecording = useCallback(async () => {
    if (workletNodeRef.current) {
      workletNodeRef.current.port.close();
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (
      recordCtxRef.current &&
      recordCtxRef.current.state !== "closed"
    ) {
      await recordCtxRef.current.close();
      recordCtxRef.current = null;
    }
  }, []);

  // -------------------------------------------------------------------------
  // Function-call handler (Zod-validated)
  // -------------------------------------------------------------------------

  const handleFunctionCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      switch (name) {
        case "add_item": {
          const parsed = AddItemSchema.safeParse(args);
          if (!parsed.success) {
            console.error("add_item: invalid args", parsed.error.flatten());
            toast.error("Erreur", {
              description: "Arguments invalides pour ajouter un article",
            });
            return;
          }
          addItem(
            parsed.data.description,
            parsed.data.quantity,
            parsed.data.unit_price,
          );
          break;
        }

        case "remove_item": {
          const parsed = RemoveItemSchema.safeParse(args);
          if (!parsed.success) {
            console.error("remove_item: invalid args", parsed.error.flatten());
            return;
          }
          removeItem(parsed.data.item_index);
          break;
        }

        case "set_customer": {
          const parsed = SetCustomerSchema.safeParse(args);
          if (!parsed.success) {
            console.error("set_customer: invalid args", parsed.error.flatten());
            return;
          }
          setCustomer(parsed.data.name, parsed.data.phone);
          break;
        }

        case "clear_document":
          reset();
          break;

        case "update_item": {
          const parsed = UpdateItemSchema.safeParse(args);
          if (!parsed.success) {
            console.error("update_item: invalid args", parsed.error.flatten());
            return;
          }
          const { item_index, description, quantity, unit_price } = parsed.data;
          const items = useInvoiceStore.getState().items;
          const actualIndex =
            item_index < 0 ? items.length + item_index : item_index;
          const target = items[actualIndex];
          if (!target) {
            console.warn("update_item: no item at index", item_index);
            return;
          }
          updateItem(target.id, {
            ...(description !== undefined && { description }),
            ...(quantity !== undefined && { quantity }),
            ...(unit_price !== undefined && { unitPrice: unit_price }),
          });
          break;
        }

        case "finalize_document": {
          const parsed = FinalizeDocumentSchema.safeParse(args);
          requestFinalize(parsed.success ? parsed.data.send_via : undefined);
          // Stop the mic immediately and wait for the AI's final utterance before
          // fully disconnecting. onResponseDone will close the WS connection.
          stopAfterFinalizeRef.current = true;
          setListening(false);
          setProcessing(true);
          void cleanupRecording();
          // Fallback: if onResponseDone never fires (network loss), auto-disconnect
          if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
          processingTimerRef.current = setTimeout(() => {
            processingTimerRef.current = null;
            setProcessing(false);
            if (stopAfterFinalizeRef.current) {
              stopAfterFinalizeRef.current = false;
              clientRef.current?.disconnect();
              clientRef.current = null;
            }
          }, PROCESSING_FALLBACK_MS);
          break;
        }

        default:
          console.warn("useVoice: unknown function call:", name);
      }
    },
    [addItem, removeItem, setCustomer, updateItem, reset, requestFinalize, cleanupRecording, setListening, setProcessing],
  );

  // -------------------------------------------------------------------------
  // Client initialisation
  // -------------------------------------------------------------------------

  const initializeClient = useCallback(async (): Promise<VoiceClient> => {
    const body: Record<string, string> = {};

    const response = await fetch("/api/realtime/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error ?? "Impossible de créer la session vocale");
    }

    const { provider, url, token } = (await response.json()) as {
      provider: "openai" | "gemini";
      url: string;
      token: string;
      model: string;
    };

    // Remember sample rate so the recording context uses the right rate
    inputSampleRateRef.current = PROVIDER_SAMPLE_RATE[provider] ?? 24000;

    const clientConfig = {
      onUserTranscript: pushUserMessage,
      onAssistantTranscriptDelta: appendAssistantDelta,
      onFunctionCall: handleFunctionCall,
      onAudioResponse: (audio: ArrayBuffer) => {
        audioQueueRef.current.push(audio);
        playAudioQueue();
      },
      onError: (error: string) => {
        setError(error);
        setProcessing(false);
      },
      onConnectionChange: (connected: boolean) => {
        setConnected(connected);
        if (!connected) {
          setListening(false);
          setProcessing(false);
        }
      },
      onResponseDone: () => {
        // AI finished responding — clear the processing spinner immediately
        if (processingTimerRef.current) {
          clearTimeout(processingTimerRef.current);
          processingTimerRef.current = null;
        }
        setProcessing(false);

        // finalize_document was called earlier — fully disconnect now that the
        // AI has finished its closing utterance, so the button returns to idle.
        if (stopAfterFinalizeRef.current) {
          stopAfterFinalizeRef.current = false;
          clientRef.current?.disconnect();
          clientRef.current = null;
        }
      },
      onSpeechStarted: () => {
        // Server-VAD detected the user speaking again — barge in by stopping
        // the assistant's playback and discarding any queued audio.
        if (isPlayingRef.current || audioQueueRef.current.length > 0) {
          interruptAssistant();
        }
      },
    };

    let client: VoiceClient;

    if (provider === "gemini") {
      const geminiClient = new GeminiRealtimeClient(clientConfig);
      await geminiClient.connect(url);
      client = geminiClient;
    } else {
      const openaiClient = new RealtimeClient(clientConfig);
      await openaiClient.connect(token, url);
      client = openaiClient;
    }

    clientRef.current = client;
    return client;
  }, [
    appendAssistantDelta,
    handleFunctionCall,
    interruptAssistant,
    playAudioQueue,
    pushUserMessage,
    setConnected,
    setError,
    setListening,
    setProcessing,
  ]);

  // -------------------------------------------------------------------------
  // startListening / stopListening
  // -------------------------------------------------------------------------

  const startListening = useCallback(async () => {
    try {
      setError(null);

      // If the assistant is still talking (or queued to talk), barge in so the
      // new user turn replaces the current one cleanly.
      if (
        isPlayingRef.current ||
        audioQueueRef.current.length > 0 ||
        useInvoiceStore.getState().isProcessing
      ) {
        interruptAssistant();
      }

      // Connect to the AI provider first so we know the required sample rate
      if (!clientRef.current?.isConnected) {
        await initializeClient();
      }

      const sampleRate = inputSampleRateRef.current;

      // Stop any previous recording context before creating a new one
      await cleanupRecording();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate,
          channelCount: 1,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate });
      recordCtxRef.current = ctx;

      // Load the AudioWorklet module (browser caches after first load).
      // Use the local `ctx` reference throughout — after the await, a
      // concurrent startListening call may have replaced recordCtxRef.current
      // with a different (or null) context, causing either a null-deref or a
      // "pcm16-processor not defined" error on the wrong AudioContext.
      await ctx.audioWorklet.addModule(WORKLET_PATH);

      // If a concurrent call already superseded us, bail out cleanly.
      if (recordCtxRef.current !== ctx) {
        if (ctx.state !== "closed") await ctx.close();
        return;
      }

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "pcm16-processor");
      workletNodeRef.current = workletNode;

      workletNode.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
        if (clientRef.current?.isConnected) {
          clientRef.current.sendAudio(event.data);
        }
      };

      // Connect source → worklet (NOT to destination — avoids mic echo)
      source.connect(workletNode);

      setListening(true);
      toast.success("Connexion établie", {
        description: "Le serveur vocal est prêt.",
      });
    } catch (error) {
      setListening(false);
      await cleanupRecording();

      let errorMessage = "Erreur lors du démarrage de l'enregistrement";
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        errorMessage = "Accès au microphone refusé";
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast.error("Erreur", { description: errorMessage });
      console.error("startListening error:", error);
    }
  }, [
    initializeClient,
    interruptAssistant,
    setError,
    setListening,
    cleanupRecording,
  ]);

  const stopListening = useCallback(async () => {
    setListening(false);
    setProcessing(true);

    // Explicitly commit buffered audio so the provider processes it immediately
    // rather than waiting for server-side VAD to detect sufficient silence.
    // Wrapped in try/catch so a disconnected client never throws here.
    try {
      clientRef.current?.commitAudio();
    } catch {
      // client already disconnected — safe to ignore
    }

    // Disconnect microphone pipeline synchronously-ish
    await cleanupRecording();

    // Fallback: clear spinner if onResponseDone never fires (e.g. network loss)
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
    }
    processingTimerRef.current = setTimeout(() => {
      setProcessing(false);
      processingTimerRef.current = null;
    }, PROCESSING_FALLBACK_MS);
  }, [setListening, setProcessing, cleanupRecording]);

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      void cleanupRecording();

      clientRef.current?.disconnect();

      if (
        playbackCtxRef.current &&
        playbackCtxRef.current.state !== "closed"
      ) {
        playbackCtxRef.current.close();
      }

      if (processingTimerRef.current) {
        clearTimeout(processingTimerRef.current);
      }
    };
  }, [cleanupRecording]);

  return { startListening, stopListening, interruptAssistant };
}
