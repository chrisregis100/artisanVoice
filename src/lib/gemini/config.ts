/**
 * Gemini Live API configuration constants.
 *
 * Model history:
 *   - gemini-2.0-flash-live-001     → shut down Dec 9, 2025
 *   - gemini-live-2.5-flash-preview → shut down Dec 9, 2025
 *   - gemini-3.1-flash-live-preview → current (released Mar 26, 2026)
 *
 * Sources:
 *   https://ai.google.dev/gemini-api/docs/changelog
 *   https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-live-preview
 */

/** Model ID for Gemini Live (audio-to-audio, real-time dialogue). */
export const GEMINI_LIVE_MODEL = "models/gemini-3.1-flash-live-preview";

/**
 * WebSocket endpoint for the Live API.
 * Uses v1beta (stable channel) with API-key authentication.
 * Reference: https://ai.google.dev/api/live
 */
export const GEMINI_LIVE_WS_BASE_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";
