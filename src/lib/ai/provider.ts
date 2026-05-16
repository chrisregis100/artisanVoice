import { createAdminClient } from "@/lib/supabase/admin";
import { voiceFunctions, systemPrompt as openaiSystemPrompt } from "@/lib/openai/functions";
import {
  geminiVoiceFunctions,
  systemPrompt as geminiSystemPrompt,
} from "@/lib/gemini/functions";
import { AFRI_BASE_URL, AFRI_ENDPOINTS, AFRI_MODELS } from "@/lib/ai/afri/config";

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
    const model = "gpt-4o-realtime-preview-2024-12-17";

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
      url: `wss://api.openai.com/v1/realtime?model=${model}`,
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
    const model = "models/gemini-2.0-flash-live-001";
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
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
    const url =
      typeof data.url === "string" && data.url
        ? data.url
        : `wss://build.lewisnote.com/v1/realtime?model=${AFRI_MODELS.realtime}`;
    const token = typeof data.token === "string" ? data.token : (data.client_secret?.value ?? "");

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
