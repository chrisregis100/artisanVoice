import {
  GEMINI_LIVE_MODEL,
  GEMINI_LIVE_WS_BASE_URL,
} from "@/lib/gemini/config";
import {
  systemPrompt as geminiSystemPrompt,
  geminiVoiceFunctions,
} from "@/lib/gemini/functions";
import {
  systemPrompt as openaiSystemPrompt,
  voiceFunctions,
} from "@/lib/openai/functions";
import { createAdminClient } from "@/lib/supabase/admin";

export interface AIRealtimeProvider {
  name: "openai" | "gemini";
  createSession(
    apiKey: string,
  ): Promise<{ url: string; token: string; model: string }>;
  getSystemPrompt(): string;
  getTools(): unknown[];
}

class OpenAIProvider implements AIRealtimeProvider {
  readonly name = "openai" as const;

  async createSession(
    apiKey: string,
  ): Promise<{ url: string; token: string; model: string }> {
    const baseUrl = "wss://api.openai.com/v1/realtime";
    const model = "gpt-realtime-2";
    const url = `${baseUrl}?model=${encodeURIComponent(model)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(
        "https://api.openai.com/v1/realtime/client_secrets",
        {
          signal: controller.signal,
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            session: {
              type: "realtime",
              model,
              instructions: openaiSystemPrompt,
              output_modalities: ["audio"],
              audio: {
                input: {
                  format: { type: "audio/pcm", rate: 24000 },
                  turn_detection: {
                    type: "server_vad",
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500,
                  },
                  transcription: { model: "whisper-1" },
                },
                output: {
                  format: { type: "audio/pcm", rate: 24000 },
                  voice: "alloy",
                },
              },
              tools: voiceFunctions.map((fn) => ({
                type: "function" as const,
                ...fn,
              })),
            },
          }),
        },
      );
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout connecting to OpenAI API (30s)");
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      let openaiMessage = "";
      try {
        const errorBody = (await response.json()) as {
          error?: { message?: string };
        };
        openaiMessage = errorBody?.error?.message ?? "";
      } catch {
        openaiMessage = await response.text().catch(() => "");
      }
      console.error(
        `OpenAI Realtime client_secrets error: HTTP ${status}`,
        openaiMessage,
      );
      if (status === 401) throw new Error("INVALID_API_KEY");
      if (status === 429) throw new Error("QUOTA_EXCEEDED");
      throw new Error(`SESSION_ERROR:${status}:${openaiMessage}`);
    }

    // POST /v1/realtime/client_secrets returns { value, expires_at, session }
    // (not the old /v1/realtime/sessions format which had client_secret.value)
    const data = (await response.json()) as {
      value?: string;
      expires_at?: number;
      session?: { model?: string };
    };

    const token = data.value ?? "";
    if (!token) {
      throw new Error(
        "SESSION_ERROR:200:empty ephemeral token returned by OpenAI",
      );
    }

    return {
      url,
      token,
      model: data.session?.model ?? model,
    };
  }

  getSystemPrompt(): string {
    return openaiSystemPrompt;
  }

  getTools(): unknown[] {
    return voiceFunctions;
  }
}

class GeminiProvider implements AIRealtimeProvider {
  readonly name = "gemini" as const;

  async createSession(
    apiKey: string,
  ): Promise<{ url: string; token: string; model: string }> {
    const model = GEMINI_LIVE_MODEL;
    const url = `${GEMINI_LIVE_WS_BASE_URL}?key=${apiKey}`;
    return { url, token: "", model };
  }

  getSystemPrompt(): string {
    return geminiSystemPrompt;
  }

  getTools(): unknown[] {
    return geminiVoiceFunctions;
  }
}

export function getAIProvider(providerName?: string): AIRealtimeProvider {
  if (providerName === "gemini") return new GeminiProvider();
  return new OpenAIProvider();
}

export async function getActiveProvider(): Promise<AIRealtimeProvider> {
  try {
    // Admin client is intentional: `admin_settings` is a system-level config table that
    // has no user session context here (called from cookie-less server utility functions).
    // Regular server client requires cookies; this path is invoked before any user context exists.
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "ai_provider")
      .single();

    if (
      data?.value &&
      typeof data.value === "object" &&
      !Array.isArray(data.value) &&
      "provider" in data.value
    ) {
      const providerValue = (data.value as { provider: string }).provider;
      return getAIProvider(providerValue);
    }
  } catch (error) {
    console.error(
      "Failed to load AI provider from database, falling back to default:",
      error,
    );
  }

  return new OpenAIProvider();
}
