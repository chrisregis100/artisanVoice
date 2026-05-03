import { voiceFunctions, systemPrompt } from "./functions";

export interface RealtimeConfig {
  onUserTranscript: (text: string) => void;
  onAssistantTranscriptDelta: (delta: string) => void;
  onFunctionCall: (name: string, args: Record<string, unknown>) => void;
  onAudioResponse: (audio: ArrayBuffer) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
  onResponseDone?: () => void;
}

const MAX_RETRIES = 5;
/** Cap individual backoff delay at 30 s */
const MAX_RETRY_DELAY_MS = 30_000;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private isSessionConfigured = false;

  private token = "";
  private wsUrl?: string;
  private retryCount = 0;
  private shouldReconnect = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(token: string, url?: string): Promise<void> {
    this.token = token;
    this.wsUrl = url;
    this.shouldReconnect = true;
    return this.openWebSocket();
  }

  private openWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = this.wsUrl ?? `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;

      this.ws = new WebSocket(url, [
        "realtime",
        `openai-insecure-api-key.${this.token}`,
        "openai-beta.realtime-v1",
      ]);

      this.ws.onopen = () => {
        this.retryCount = 0;
        this.config.onConnectionChange(true);
        this.configureSession();
        resolve();
      };

      this.ws.onclose = (event) => {
        this.isSessionConfigured = false;
        this.config.onConnectionChange(false);

        // Only retry on abnormal closures (not when disconnect() was called)
        if (this.shouldReconnect && !event.wasClean && this.retryCount < MAX_RETRIES) {
          const delay = Math.min(
            1000 * Math.pow(2, this.retryCount),
            MAX_RETRY_DELAY_MS,
          );
          this.retryCount++;
          setTimeout(() => void this.reconnect(), delay);
        }
      };

      this.ws.onerror = () => {
        this.config.onError("Erreur de connexion WebSocket");
        reject(new Error("WebSocket connection failed"));
      };

      this.ws.onmessage = (event: MessageEvent<string>) => {
        this.handleMessage(event.data);
      };
    });
  }

  /** Background reconnection — does not propagate errors to caller. */
  private async reconnect(): Promise<void> {
    try {
      await this.openWebSocket();
    } catch {
      // onclose handler will schedule the next retry if retryCount allows
    }
  }

  private configureSession(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.send({
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: systemPrompt,
        voice: "alloy",
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        input_audio_transcription: {
          model: "whisper-1",
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
        tools: voiceFunctions.map((fn) => ({
          type: "function",
          name: fn.name,
          description: fn.description,
          parameters: fn.parameters,
        })),
        tool_choice: "auto",
      },
    });

    this.isSessionConfigured = true;
  }

  private handleMessage(data: string): void {
    let message: Record<string, unknown>;

    try {
      message = JSON.parse(data) as Record<string, unknown>;
    } catch (err) {
      console.error("RealtimeClient: failed to parse server message", err, data);
      return;
    }

    const type = message.type as string | undefined;

    switch (type) {
      case "session.created":
      case "session.updated":
        break;

      case "conversation.item.input_audio_transcription.completed": {
        const transcript = message.transcript;
        if (typeof transcript === "string" && transcript) {
          this.config.onUserTranscript(transcript);
        }
        break;
      }

      case "response.audio_transcript.delta": {
        const delta = message.delta;
        if (typeof delta === "string" && delta) {
          this.config.onAssistantTranscriptDelta(delta);
        }
        break;
      }

      case "response.audio.delta": {
        const delta = message.delta;
        if (typeof delta === "string" && delta) {
          const audioData = this.base64ToArrayBuffer(delta);
          this.config.onAudioResponse(audioData);
        }
        break;
      }

      case "response.function_call_arguments.done": {
        const name = message.name;
        const rawArgs = message.arguments;
        const callId = message.call_id;

        if (typeof name !== "string" || typeof rawArgs !== "string") break;

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(rawArgs) as Record<string, unknown>;
        } catch (err) {
          console.error(
            `RealtimeClient: failed to parse function args for "${name}"`,
            err,
            rawArgs,
          );
          break;
        }

        this.config.onFunctionCall(name, args);

        if (typeof callId === "string") {
          this.sendFunctionResult(callId, { success: true });
        }
        break;
      }

      case "response.done":
        this.config.onResponseDone?.();
        break;

      case "error": {
        const errMsg =
          (message.error as { message?: string } | undefined)?.message ??
          "Une erreur est survenue";
        this.config.onError(errMsg);
        break;
      }

      default:
        break;
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64Audio = this.arrayBufferToBase64(audioData);
    this.send({ type: "input_audio_buffer.append", audio: base64Audio });
  }

  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.send({ type: "input_audio_buffer.commit" });
    this.send({ type: "response.create" });
  }

  private sendFunctionResult(callId: string, result: unknown): void {
    this.send({
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: callId,
        output: JSON.stringify(result),
      },
    });
    this.send({ type: "response.create" });
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
    this.isSessionConfigured = false;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
