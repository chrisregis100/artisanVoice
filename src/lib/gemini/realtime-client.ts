import { geminiVoiceFunctions, systemPrompt } from "./functions";
import { GEMINI_LIVE_MODEL } from "./config";

export interface GeminiRealtimeConfig {
  onUserTranscript: (text: string) => void;
  onAssistantTranscriptDelta: (delta: string) => void;
  onFunctionCall: (name: string, args: Record<string, unknown>) => void;
  onAudioResponse: (audio: ArrayBuffer) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
  onResponseDone?: () => void;
  /** Server detected user started speaking — useful for barge-in. */
  onSpeechStarted?: () => void;
}

interface GeminiMessage {
  setupComplete?: Record<string, unknown>;
  serverContent?: {
    modelTurn?: {
      parts: Array<{
        text?: string;
        inlineData?: { data: string; mimeType: string };
      }>;
    };
    turnComplete?: boolean;
    interrupted?: boolean;
  };
  toolCall?: {
    functionCalls: Array<{
      id: string;
      name: string;
      args: Record<string, unknown>;
    }>;
  };
  inputTranscription?: {
    text?: string;
  };
}

const MAX_RETRIES = 5;
const MAX_RETRY_DELAY_MS = 30_000;

export class GeminiRealtimeClient {
  private ws: WebSocket | null = null;
  private config: GeminiRealtimeConfig;
  private setupComplete = false;

  private connectUrl = "";
  private retryCount = 0;
  private shouldReconnect = false;

  /** Resolvers for the initial connect() promise. */
  private setupResolver: (() => void) | null = null;
  private setupRejecter: ((err: Error) => void) | null = null;

  constructor(config: GeminiRealtimeConfig) {
    this.config = config;
  }

  async connect(url: string): Promise<void> {
    this.connectUrl = url;
    this.shouldReconnect = true;
    return this.openWebSocket(true);
  }

  private openWebSocket(initialConnect: boolean): Promise<void> {
    return new Promise((resolve, reject) => {
      if (initialConnect) {
        this.setupResolver = resolve;
        this.setupRejecter = reject;
      }

      this.ws = new WebSocket(this.connectUrl);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.sendSetup();
      };

      this.ws.onclose = (event) => {
        this.setupComplete = false;
        this.config.onConnectionChange(false);

        // If setup never completed, reject the pending connect() promise so
        // the caller (useVoice / startListening) gets a real error and can
        // show a toast instead of hanging silently.
        if (this.setupRejecter) {
          const reason = event.reason
            ? `${event.reason} (code ${event.code})`
            : `WebSocket fermé avant initialisation Gemini (code ${event.code})`;
          console.error(
            `[Gemini] WebSocket closed before setup completed: code=${event.code} reason="${event.reason}"`,
          );
          this.setupRejecter(new Error(reason));
          this.setupResolver = null;
          this.setupRejecter = null;
        }

        if (
          this.shouldReconnect &&
          !event.wasClean &&
          this.retryCount < MAX_RETRIES
        ) {
          const delay = Math.min(
            1000 * Math.pow(2, this.retryCount),
            MAX_RETRY_DELAY_MS,
          );
          this.retryCount++;
          setTimeout(() => void this.reconnect(), delay);
        }
      };

      this.ws.onerror = (event) => {
        console.error("[Gemini] WebSocket error", event);
        this.config.onError("Erreur de connexion WebSocket Gemini");
        const err = new Error("Gemini WebSocket connection failed");
        if (this.setupRejecter) {
          this.setupRejecter(err);
          this.setupResolver = null;
          this.setupRejecter = null;
        }
        reject(err);
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        this.handleMessage(event.data);
      };
    });
  }

  private async reconnect(): Promise<void> {
    try {
      await this.openWebSocket(false);
    } catch {
      // onclose handler schedules the next retry
    }
  }

  private sendSetup(): void {
    this.send({
      setup: {
        model: GEMINI_LIVE_MODEL,
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: "Aoede",
              },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [
          {
            functionDeclarations: geminiVoiceFunctions,
          },
        ],
      },
    });
  }

  private handleMessage(data: string): void {
    let message: GeminiMessage;

    try {
      message = JSON.parse(data) as GeminiMessage;
    } catch (err) {
      console.error("GeminiRealtimeClient: failed to parse server message", err);
      return;
    }

    if (message.setupComplete !== undefined) {
      this.setupComplete = true;
      this.config.onConnectionChange(true);
      this.setupResolver?.();
      this.setupResolver = null;
      this.setupRejecter = null;
      return;
    }

    if (message.serverContent) {
      const { modelTurn, turnComplete, interrupted } = message.serverContent;

      if (interrupted) {
        this.config.onSpeechStarted?.();
      }

      if (modelTurn?.parts) {
        for (const part of modelTurn.parts) {
          if (part.text) {
            this.config.onAssistantTranscriptDelta(part.text);
          }
          if (part.inlineData?.data) {
            const audioData = this.base64ToArrayBuffer(part.inlineData.data);
            this.config.onAudioResponse(audioData);
          }
        }
      }

      if (turnComplete) {
        this.config.onResponseDone?.();
      }
    }

    if (message.toolCall?.functionCalls) {
      for (const call of message.toolCall.functionCalls) {
        this.config.onFunctionCall(call.name, call.args ?? {});
        this.sendToolResponse(call.id, { success: true });
      }
    }

    if (message.inputTranscription?.text) {
      this.config.onUserTranscript(message.inputTranscription.text);
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupComplete)
      return;

    const base64Audio = this.arrayBufferToBase64(audioData);
    this.send({
      realtimeInput: {
        mediaChunks: [
          {
            data: base64Audio,
            mimeType: "audio/pcm;rate=16000",
          },
        ],
      },
    });
  }

  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupComplete)
      return;

    // Gemini uses server-side VAD; signal end of user turn
    this.send({
      realtimeInput: {
        audioStreamEnd: true,
      },
    });
  }

  /**
   * Gemini-side barge-in: there is no explicit cancel message in the v1
   * Live API, so we rely on the client clearing its audio queue. This
   * method exists for API parity with `RealtimeClient`.
   */
  cancelResponse(): void {
    // Intentionally no-op — handled client-side by clearing the audio queue.
  }

  private sendToolResponse(callId: string, result: unknown): void {
    this.send({
      toolResponse: {
        functionResponses: [
          {
            id: callId,
            response: result,
          },
        ],
      },
    });
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  disconnect(): void {
    this.shouldReconnect = false;
    this.retryCount = 0;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.setupComplete = false;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.setupComplete;
  }
}
