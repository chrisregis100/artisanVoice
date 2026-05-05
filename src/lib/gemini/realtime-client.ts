import { geminiVoiceFunctions, systemPrompt } from "./functions";

export interface GeminiRealtimeConfig {
  onUserTranscript: (text: string) => void;
  onAssistantTranscriptDelta: (delta: string) => void;
  onFunctionCall: (name: string, args: Record<string, unknown>) => void;
  onAudioResponse: (audio: ArrayBuffer) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
  onResponseDone?: () => void;
}

interface GeminiMessage {
  setupComplete?: Record<string, unknown>;
  server_content?: {
    model_turn?: {
      parts: Array<{
        text?: string;
        inline_data?: { data: string; mime_type: string };
      }>;
    };
    turn_complete?: boolean;
    interrupted?: boolean;
  };
  tool_call?: {
    function_calls: Array<{
      id: string;
      name: string;
      args: Record<string, unknown>;
    }>;
  };
  input_transcription?: {
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

        // Clear pending initial-connect promise if still waiting
        this.setupResolver = null;
        this.setupRejecter = null;

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

      this.ws.onerror = () => {
        this.config.onError("Erreur de connexion Gemini");
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
        model: "models/gemini-2.0-flash-live-001",
        generation_config: {
          response_modalities: ["AUDIO"],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: {
                voice_name: "Aoede",
              },
            },
          },
        },
        system_instruction: {
          parts: [{ text: systemPrompt }],
        },
        tools: [
          {
            function_declarations: geminiVoiceFunctions,
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

    if (message.server_content) {
      const { model_turn, turn_complete } = message.server_content;

      if (model_turn?.parts) {
        for (const part of model_turn.parts) {
          if (part.text) {
            this.config.onAssistantTranscriptDelta(part.text);
          }
          if (part.inline_data?.data) {
            const audioData = this.base64ToArrayBuffer(part.inline_data.data);
            this.config.onAudioResponse(audioData);
          }
        }
      }

      if (turn_complete) {
        this.config.onResponseDone?.();
      }
    }

    if (message.tool_call?.function_calls) {
      for (const call of message.tool_call.function_calls) {
        this.config.onFunctionCall(call.name, call.args ?? {});
        this.sendToolResponse(call.id, { success: true });
      }
    }

    if (message.input_transcription?.text) {
      this.config.onUserTranscript(message.input_transcription.text);
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN || !this.setupComplete)
      return;

    const base64Audio = this.arrayBufferToBase64(audioData);
    this.send({
      realtime_input: {
        media_chunks: [
          {
            data: base64Audio,
            mime_type: "audio/pcm;rate=16000",
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
      realtime_input: {
        audio_stream_end: true,
      },
    });
  }

  private sendToolResponse(callId: string, result: unknown): void {
    this.send({
      tool_response: {
        function_responses: [
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
