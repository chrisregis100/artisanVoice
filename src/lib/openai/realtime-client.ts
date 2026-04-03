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

export class RealtimeClient {
  private ws: WebSocket | null = null;
  private config: RealtimeConfig;
  private isSessionConfigured = false;

  constructor(config: RealtimeConfig) {
    this.config = config;
  }

  async connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`;

      this.ws = new WebSocket(url, [
        "realtime",
        `openai-insecure-api-key.${token}`,
        "openai-beta.realtime-v1",
      ]);

      this.ws.onopen = () => {
        this.config.onConnectionChange(true);
        this.configureSession();
        resolve();
      };

      this.ws.onclose = () => {
        this.config.onConnectionChange(false);
        this.isSessionConfigured = false;
      };

      this.ws.onerror = () => {
        this.config.onError("Erreur de connexion WebSocket");
        reject(new Error("WebSocket connection failed"));
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    });
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
    try {
      const message = JSON.parse(data);

      switch (message.type) {
        case "session.created":
        case "session.updated":
          break;

        case "conversation.item.input_audio_transcription.completed":
          if (message.transcript) {
            this.config.onUserTranscript(message.transcript);
          }
          break;

        case "response.audio_transcript.delta":
          if (message.delta) {
            this.config.onAssistantTranscriptDelta(message.delta);
          }
          break;

        case "response.audio.delta":
          if (message.delta) {
            const audioData = this.base64ToArrayBuffer(message.delta);
            this.config.onAudioResponse(audioData);
          }
          break;

        case "response.function_call_arguments.done":
          if (message.name && message.arguments) {
            try {
              const args = JSON.parse(message.arguments);
              this.config.onFunctionCall(message.name, args);

              this.sendFunctionResult(message.call_id, { success: true });
            } catch {
              console.error("Failed to parse function arguments");
            }
          }
          break;

        case "response.done":
          this.config.onResponseDone?.();
          break;

        case "error":
          this.config.onError(message.error?.message || "Une erreur est survenue");
          break;
      }
    } catch (error) {
      console.error("Failed to parse message:", error);
    }
  }

  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    const base64Audio = this.arrayBufferToBase64(audioData);

    this.send({
      type: "input_audio_buffer.append",
      audio: base64Audio,
    });
  }

  commitAudio(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    this.send({
      type: "input_audio_buffer.commit",
    });

    this.send({
      type: "response.create",
    });
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

    this.send({
      type: "response.create",
    });
  }

  private send(message: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
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
