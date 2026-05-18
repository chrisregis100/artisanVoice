import "server-only";

import { z } from "zod";
import {
  AFRI_BASE_URL,
  AFRI_ENDPOINTS,
  AFRI_RULES,
  type AfriChatModel,
} from "./config";

const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

const ChatRequestSchema = z.object({
  model: z.string().default(AFRI_RULES.defaultChatModel),
  messages: z.array(ChatMessageSchema).min(1),
  stream: z.boolean().default(AFRI_RULES.streamChatByDefault),
  reasoning_effort: z
    .enum(["low", "medium", "high"])
    .default(AFRI_RULES.defaultReasoningEffort),
});

export type ChatRequest = z.input<typeof ChatRequestSchema>;

export async function afriChat(
  input: ChatRequest,
  apiKey: string,
): Promise<Response> {
  const body = ChatRequestSchema.parse(input);
  return fetch(`${AFRI_BASE_URL}${AFRI_ENDPOINTS.chatCompletions}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
