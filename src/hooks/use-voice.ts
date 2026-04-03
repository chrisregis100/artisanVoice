"use client";

import { useCallback, useRef, useEffect } from "react";
import { useInvoiceStore } from "@/stores/invoice-store";
import { RealtimeClient } from "@/lib/openai/realtime-client";

interface UseVoiceReturn {
  startListening: () => void;
  stopListening: () => void;
}

export function useVoice(): UseVoiceReturn {
  const clientRef = useRef<RealtimeClient | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

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

  // Audio playback for AI responses
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

        // Convert PCM16 to Float32
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
        case "finalize_document":
          // Trigger share flow - will be handled by UI
          const event = new CustomEvent("finalize-document", {
            detail: { sendVia: args.send_via },
          });
          window.dispatchEvent(event);
          break;
        default:
          console.warn("Unknown function:", name);
      }
    },
    [addItem, removeItem, setCustomer, reset]
  );

  const initializeClient = useCallback(async () => {
    try {
      // Get session token from our API
      const response = await fetch("/api/realtime/session", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const { token } = await response.json();

      if (!token) {
        throw new Error("No token received");
      }

      // Create and connect the client
      const client = new RealtimeClient({
        onUserTranscript: (text) => {
          pushUserMessage(text);
        },
        onAssistantTranscriptDelta: (delta) => {
          appendAssistantDelta(delta);
        },
        onFunctionCall: handleFunctionCall,
        onAudioResponse: (audio) => {
          audioQueueRef.current.push(audio);
          playAudioQueue();
        },
        onError: (error) => {
          setError(error);
          setProcessing(false);
        },
        onConnectionChange: (connected) => {
          setConnected(connected);
          if (!connected) {
            setListening(false);
            setProcessing(false);
          }
        },
      });

      await client.connect(token);
      clientRef.current = client;

      return client;
    } catch (error) {
      console.error("Failed to initialize client:", error);
      setError("Impossible de se connecter au serveur vocal");
      throw error;
    }
  }, [
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

      // Request microphone access first
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 24000,
          channelCount: 1,
        },
      });

      // Initialize client if needed
      if (!clientRef.current?.isConnected) {
        await initializeClient();
      }

      setListening(true);

      // Set up audio processing
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        if (!clientRef.current?.isConnected) return;

        const inputData = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        clientRef.current.sendAudio(int16Data.buffer);
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // Store reference for cleanup
      mediaRecorderRef.current = { stream, processor, source } as unknown as MediaRecorder;
    } catch (error) {
      setListening(false);
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        setError("Accès au microphone refusé");
      } else {
        setError("Erreur lors du démarrage de l'enregistrement");
      }
      console.error("Start listening error:", error);
    }
  }, [initializeClient, setError, setListening]);

  const stopListening = useCallback(() => {
    setListening(false);
    setProcessing(true);

    // Stop audio processing
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

    // Commit audio and request response
    if (clientRef.current?.isConnected) {
      clientRef.current.commitAudio();
    }

    // Stop processing state after a delay
    setTimeout(() => {
      setProcessing(false);
    }, 3000);
  }, [setListening, setProcessing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      audioContextRef.current?.close();
      if (mediaRecorderRef.current) {
        const { stream } = mediaRecorderRef.current as unknown as { stream: MediaStream };
        stream?.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    startListening,
    stopListening,
  };
}
