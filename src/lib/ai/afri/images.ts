import "server-only";

import { z } from "zod";
import {
  AFRI_BASE_URL,
  AFRI_ENDPOINTS,
  AFRI_RULES,
  type AfriImageModel,
} from "./config";

const ImageGenerationSchema = z.object({
  model: z.string().default(AFRI_RULES.defaultImageModel),
  prompt: z.string().min(1),
  size: z
    .enum(["1024x1024", "1536x1024", "1024x1536", "auto"])
    .default(AFRI_RULES.defaultImageSize),
  quality: z
    .enum(["low", "medium", "high"])
    .default(AFRI_RULES.defaultImageQuality),
});

const FluxImageSchema = z.object({
  prompt: z.string().min(1),
  width: z.number().int().min(256).max(2048).default(1024),
  height: z.number().int().min(256).max(2048).default(1024),
  steps: z.number().int().min(1).max(50).default(25),
});

export type ImageGenerationRequest = z.input<typeof ImageGenerationSchema>;
export type FluxImageRequest = z.input<typeof FluxImageSchema>;

export async function afriGenerateImage(
  input: ImageGenerationRequest,
  apiKey: string,
): Promise<Response> {
  const body = ImageGenerationSchema.parse(input);
  return fetch(`${AFRI_BASE_URL}${AFRI_ENDPOINTS.imagesGenerations}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function afriFluxImage(
  input: FluxImageRequest,
  apiKey: string,
): Promise<Response> {
  const body = FluxImageSchema.parse(input);
  return fetch(`${AFRI_BASE_URL}${AFRI_ENDPOINTS.imagesFlux}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}
