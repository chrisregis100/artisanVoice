import { createAdminClient } from "@/lib/supabase/admin";
import { voiceFunctions, systemPrompt as openaiSystemPrompt } from "@/lib/openai/functions";
import {
  geminiVoiceFunctions,
  systemPrompt as geminiSystemPrompt,
} from "@/lib/gemini/functions";
import { AFRI_BASE_URL, AFRI_ENDPOINTS, AFRI_MODELS } from "@/lib/ai/afri/config";
import { env } from "@/lib/env";
import { GEMINI_LIVE_MODEL, GEMINI_LIVE_WS_BASE_URL } from "@/lib/gemini/config";

export interface AIRealtimeProvider {
  name: "openai" | "gemini" | "afri";
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
    const model = env.OPENAI_REALTIME_MODEL ?? "gpt-4o-realtime-preview-2024-12-17";
    const url = `${baseUrl}?model=${encodeURIComponent(model)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        signal: controller.signal,
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model, voice: "alloy" }),
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
      if (status === 401) throw new Error("INVALID_API_KEY");
      if (status === 429) throw new Error("QUOTA_EXCEEDED");
      throw new Error("SESSION_ERROR");
    }

    const data = await response.json();
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

class AfriProvider implements AIRealtimeProvider {
  readonly name = "afri" as const;

  /**
   * NOTE: Realtime sessions are currently forced to OpenAI — this method is not called
   * from the /api/realtime/session route. It is reserved for future use (e.g. a
   * server-side WebSocket proxy that could relay traffic through the Afri gateway).
   */
  async createSession(
    apiKey: string
  ): Promise<{ url: string; token: string; model: string }> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    let response: Response;
    try {
      response = await fetch(`${AFRI_BASE_URL}${AFRI_ENDPOINTS.realtimeConfig}`, {
        signal: controller.signal,
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout connecting to Afri API (30s)");
      }
      throw error;
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      const status = response.status;
      if (status === 401) throw new Error("INVALID_API_KEY");
      if (status === 429) throw new Error("QUOTA_EXCEEDED");
      throw new Error("SESSION_ERROR");
    }

    const data = await response.json();
    // Gateway returns { wsUrl, apiKey, ... }; also accept OpenAI-shaped { url, token, client_secret }
    const url =
      (typeof data.wsUrl === "string" && data.wsUrl) ||
      (typeof data.url === "string" && data.url) ||
      `wss://build.lewisnote.com/v1/realtime?model=${AFRI_MODELS.realtime}`;
    const token =
      (typeof data.apiKey === "string" && data.apiKey) ||
      (typeof data.token === "string" && data.token) ||
      (typeof data.client_secret?.value === "string" ? data.client_secret.value : "");

    return { url, token, model: AFRI_MODELS.realtime };
  }

  getSystemPrompt(): string {
    return openaiSystemPrompt;
  }

  getTools(): unknown[] {
    return voiceFunctions;
  }
}

export function getAIProvider(providerName?: string): AIRealtimeProvider {
  if (providerName === "gemini") return new GeminiProvider();
  if (providerName === "afri") return new AfriProvider();
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
