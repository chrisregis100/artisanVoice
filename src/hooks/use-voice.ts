"use client";

import { useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useInvoiceStore } from "@/stores/invoice-store";
import { useSettingsStore } from "@/stores/settings-store";
import { RealtimeClient } from "@/lib/openai/realtime-client";
import { GeminiRealtimeClient } from "@/lib/gemini/realtime-client";

interface VoiceClient {
  sendAudio(audioData: ArrayBuffer): void;
  commitAudio(): void;
  disconnect(): void;
  readonly isConnected: boolean;
}

interface UseVoiceReturn {
  startListening: () => void;
  stopListening: () => void;
}

export function useVoice(): UseVoiceReturn {
  const clientRef = useRef<VoiceClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  const { openaiApiKey } = useSettingsStore();

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
    reset,
  } = useInvoiceStore();

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return;

    isPlayingRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();
      if (!audioData) continue;

      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        }

        const int16Array = new Int16Array(audioData);
        const float32Array = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32Array[i] = int16Array[i] / 32768;
        }

        const audioBuffer = audioContextRef.current.createBuffer(
          1,
          float32Array.length,
          24000
        );
        audioBuffer.copyToChannel(float32Array, 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.start();

        await new Promise((resolve) => {
          source.onended = resolve;
        });
      } catch (error) {
        console.error("Audio playback error:", error);
      }
    }

    isPlayingRef.current = false;
  }, []);

  const handleFunctionCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      switch (name) {
        case "add_item":
          addItem(
            args.description as string,
            args.quantity as number,
            args.unit_price as number
          );
          break;
        case "remove_item":
          removeItem(args.item_index as number);
          break;
        case "set_customer":
          setCustomer(args.name as string, args.phone as string | undefined);
          break;
        case "clear_document":
          reset();
          break;
        case "finalize_document": {
          const event = new CustomEvent("finalize-document", {
            detail: { sendVia: args.send_via },
          });
          window.dispatchEvent(event);
          break;
        }
        default:
          console.warn("Unknown function:", name);
      }
    },
    [addItem, removeItem, setCustomer, reset]
  );

  const initializeClient = useCallback(async () => {
    try {
      // Build request body — include personal key only if user has set one
      const body: Record<string, string> = {};
      if (openaiApiKey) {
        body.userApiKey = openaiApiKey;
      }

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

      const clientConfig = {
        onUserTranscript: (text: string) => {
          pushUserMessage(text);
        },
        onAssistantTranscriptDelta: (delta: string) => {
          appendAssistantDelta(delta);
        },
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
      };

      let client: VoiceClient;

      if (provider === "gemini") {
        const geminiClient = new GeminiRealtimeClient(clientConfig);
        await geminiClient.connect(url);
        client = geminiClient;
      } else {
        const openaiClient = new RealtimeClient(clientConfig);
        await openaiClient.connect(token);
        client = openaiClient;
      }

      clientRef.current = client;

      toast.success("Connexion établie", {
        description: "Le serveur vocal est prêt.",
      });

      return client;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Impossible de se connecter au serveur vocal";
      toast.error("Erreur de connexion", {
        description: message,
      });
      console.error("Failed to initialize client:", error);
      throw error;
    }
  }, [
    openaiApiKey,
    appendAssistantDelta,
    handleFunctionCall,
    playAudioQueue,
    pushUserMessage,
    setConnected,
    setError,
    setListening,
    setProcessing,
  ]);

  const startListening = useCallback(async () => {
    try {
      setError(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      if (!clientRef.current?.isConnected) {
        await initializeClient();
      }

      setListening(true);

      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!clientRef.current?.isConnected) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        clientRef.current.sendAudio(int16Data.buffer);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      mediaRecorderRef.current = { stream, processor, source } as unknown as MediaRecorder;
    } catch (error) {
      setListening(false);
      let errorMessage = "Erreur lors du démarrage de l'enregistrement";
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        errorMessage = "Accès au microphone refusé";
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error("Erreur", {
        description: errorMessage,
      });
      console.error("Start listening error:", error);
    }
  }, [initializeClient, setError, setListening]);

  const stopListening = useCallback(() => {
    setListening(false);
    setProcessing(true);

    if (mediaRecorderRef.current) {
      const { stream, processor, source } = mediaRecorderRef.current as unknown as {
        stream: MediaStream;
        processor: ScriptProcessorNode;
        source: MediaStreamAudioSourceNode;
      };

      source?.disconnect();
      processor?.disconnect();
      stream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    if (clientRef.current?.isConnected) {
      clientRef.current.commitAudio();
    }

    setTimeout(() => {
      setProcessing(false);
    }, 3000);
  }, [setListening, setProcessing]);

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      audioContextRef.current?.close();
      if (mediaRecorderRef.current) {
        const { stream } = mediaRecorderRef.current as unknown as {
          stream: MediaStream;
        };
        stream?.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
  };
}
