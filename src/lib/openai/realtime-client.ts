import { voiceFunctions, systemPrompt } from "./functions";

export interface RealtimeConfig {
  onUserTranscript: (text: string) => void;
  onAssistantTranscriptDelta: (delta: string) => void;
  onFunctionCall: (name: string, args: Record<string, unknown>) => void;
  onAudioResponse: (audio: ArrayBuffer) => void;
  onError: (error: string) => void;
  onConnectionChange: (connected: boolean) => void;
  onResponseDone?: () => void;
  /** Server-VAD detected user started speaking — useful for barge-in. */
  onSpeechStarted?: () => void;
}

/**
 * Server error codes we silently swallow because they reflect benign races
 * (e.g. server-VAD auto-creating a response while the client also tried to)
 * and only confuse end-users.
 */
const SUPPRESSED_ERROR_CODES = new Set([
  "conversation_already_has_active_response",
]);

const MAX_RETRIES = 5;
/** Cap individual backoff delay at 30 s */
const MAX_RETRY_DELAY_MS = 30_000;

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private isSessionConfigured = false;
  /** True between `response.created` and `response.done`/`response.cancelled`. */
  private isResponseActive = false;
  /**
   * Buffered function-call output waiting to be flushed after `response.done`.
   * The Realtime API requires sending `conversation.item.create` (function_call_output)
   * and then `response.create` only after the previous response has fully completed.
   */
  private pendingFunctionOutputs: Array<{ callId: string; result: unknown }> = [];

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
        type: "realtime",
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

      case "response.output_audio_transcript.delta": {
        const delta = message.delta;
        if (typeof delta === "string" && delta) {
          this.config.onAssistantTranscriptDelta(delta);
        }
        break;
      }

      case "response.output_audio.delta": {
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

        // Buffer the output — we flush it in response.done so that
        // conversation.item.create + response.create are sent only after the
        // current response has fully closed. Sending response.create while
        // isResponseActive is true would be rejected by the server.
        if (typeof callId === "string") {
          this.pendingFunctionOutputs.push({ callId, result: { success: true } });
        }
        break;
      }

      case "response.created":
        this.isResponseActive = true;
        break;

      case "response.cancelled":
        this.isResponseActive = false;
        this.config.onResponseDone?.();
        break;

      case "response.done":
        this.isResponseActive = false;
        this.config.onResponseDone?.();
        // Flush any buffered function-call outputs now that the response has
        // fully closed. sendFunctionResult will also send response.create.
        if (this.pendingFunctionOutputs.length > 0) {
          const pending = this.pendingFunctionOutputs.splice(0);
          for (const { callId, result } of pending) {
            this.sendFunctionResult(callId, result);
          }
        }
        break;

      case "input_audio_buffer.speech_started":
        this.config.onSpeechStarted?.();
        break;

      case "error": {
        const errorObj = message.error as
          | { message?: string; code?: string }
          | undefined;
        const code = errorObj?.code;

        if (code && SUPPRESSED_ERROR_CODES.has(code)) {
          console.warn("RealtimeClient: suppressed server error", code, errorObj?.message);
          break;
        }

        const errMsg = errorObj?.message ?? "Une erreur est survenue";
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
    // Server-VAD may have already auto-created a response; only ask for one
    // if none is currently in flight to avoid the
    // "conversation_already_has_active_response" race.
    if (!this.isResponseActive) {
      this.send({ type: "response.create" });
    }
  }

  /**
   * Cancel the in-flight assistant response (barge-in). Leaves the input
   * audio buffer intact so any user audio currently being captured is
   * preserved for the next turn.
   */
  cancelResponse(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    if (this.isResponseActive) {
      this.send({ type: "response.cancel" });
    }
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
    if (!this.isResponseActive) {
      this.send({ type: "response.create" });
    }
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
    this.isResponseActive = false;
    this.pendingFunctionOutputs = [];
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
