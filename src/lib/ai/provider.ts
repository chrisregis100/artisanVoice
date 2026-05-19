import { createAdminClient } from "@/lib/supabase/admin";
import { voiceFunctions, systemPrompt as openaiSystemPrompt } from "@/lib/openai/functions";
import {
  geminiVoiceFunctions,
  systemPrompt as geminiSystemPrompt,
} from "@/lib/gemini/functions";
import { env } from "@/lib/env";
import { GEMINI_LIVE_MODEL, GEMINI_LIVE_WS_BASE_URL } from "@/lib/gemini/config";

export interface AIRealtimeProvider {
  name: "openai" | "gemini";
  createSession(apiKey: string): Promise<{ url: string; token: string; model: string }>;
  getSystemPrompt(): string;
  getTools(): unknown[];
}

class OpenAIProvider implements AIRealtimeProvider {
  readonly name = "openai" as const;

  async createSession(
    apiKey: string
  ): Promise<{ url: string; token: string; model: string }> {
    const baseUrl = env.OPENAI_REALTIME_URL ?? "wss://api.openai.com/v1/realtime";
    const model = env.OPENAI_REALTIME_MODEL ?? "gpt-realtime-2";
    const url = `${baseUrl}?model=${encodeURIComponent(model)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
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
            audio: {
              output: { voice: "alloy" },
            },
          },
        }),
      });
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
      let errorBody: unknown;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text().catch(() => "(unreadable)");
      }
      console.error(`OpenAI Realtime client_secrets error: HTTP ${status}`, JSON.stringify(errorBody));
      if (status === 401) throw new Error("INVALID_API_KEY");
      if (status === 429) throw new Error("QUOTA_EXCEEDED");
      throw new Error(`SESSION_ERROR: HTTP ${status}`);
    }

    const data = await response.json() as {
      client_secret?: { value: string; expires_at: number };
    };
    return {
      url,
      token: data.client_secret?.value ?? "",
      model,
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
    apiKey: string
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
    console.error("Failed to load AI provider from database, falling back to default:", error);
  }

  return new OpenAIProvider();
}
