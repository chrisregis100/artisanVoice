// Centralized configuration for Build with AFRI gateway
// https://build.lewisnote.com/documentation

export const AFRI_BASE_URL =
  process.env.AFRI_BASE_URL ?? "https://build.lewisnote.com/v1";

export const AFRI_WS_HOST = "build.lewisnote.com";

export const AFRI_AUTH_PREFIX = "Bearer";
export const AFRI_KEY_PATTERN = /^sk-afri-/;

export const AFRI_MODELS = {
  chat: {
    nano: "gpt-5.4-nano",
    mini: "gpt-5.4-mini",
    standard: "gpt-5.4",
    pro: "gpt-5.4-pro",
    next: "gpt-5.5",
    codex: "gpt-5.3-codex",
    longContext: "kimi-k2.5",
    multilingual: "glm-5.1",
    claudeOpus: "claude-opus-4.7",
    claudeSonnet: "claude-sonnet-4.7",
  },
  realtime: "gpt-realtime-1.5",
  images: {
    standard: "gpt-image-1.5",
    next: "gpt-image-2",
    fast: "flux-2-klein",
  },
  audio: { enhance: "audio-enhance" },
} as const;

export const AFRI_ENDPOINTS = {
  chatCompletions: "/chat/completions",
  realtimeConfig: "/realtime/config",
  imagesGenerations: "/images/generations",
  imagesEdits: "/images/edits",
  imagesFlux: "/images/flux",
  audioEnhance: "/audio/enhance",
} as const;

export const AFRI_PRICING_USD_PER_M_TOKENS = {
  "gpt-5.4-nano": { input: 0.2, output: 1.25 },
  "gpt-5.4-mini": { input: 0.75, output: 4.5 },
  "gpt-5.4": { input: 2.5, output: 15.0 },
  "gpt-5.4-pro": { input: 30.0, output: 180.0 },
  "gpt-5.5": { input: 5.0, output: 30.0 },
  "gpt-5.3-codex": { input: 1.75, output: 14.0 },
  "kimi-k2.5": { input: 0.6, output: 3.0 },
  "glm-5.1": { input: 0.95, output: 3.15 },
  "claude-opus-4.7": { input: 15.0, output: 75.0 },
  "claude-sonnet-4.7": { input: 3.0, output: 15.0 },
} as const;

export const AFRI_RULES = {
  defaultChatModel: AFRI_MODELS.chat.mini,
  defaultImageModel: AFRI_MODELS.images.next,
  defaultImageSize: "1536x1024" as const,
  defaultImageQuality: "medium" as const,
  defaultReasoningEffort: "medium" as const,
  streamChatByDefault: true,
  realtimeVoice: "alloy" as const,
  realtimeSampleRateHz: 24_000,
  audioEnhanceMaxFileSizeMB: 25,
  audioEnhanceAllowedMime: ["audio/wav", "audio/mpeg", "audio/webm"] as const,
  rateLimit: {
    realtimeSessionPerMinute: 10,
    imagesPerMinute: 6,
    chatPerMinute: 30,
  },
} as const;

export type AfriChatModel = keyof typeof AFRI_PRICING_USD_PER_M_TOKENS;
export type AfriImageModel =
  (typeof AFRI_MODELS.images)[keyof typeof AFRI_MODELS.images];
