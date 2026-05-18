import "server-only";

import { AFRI_BASE_URL, AFRI_ENDPOINTS, AFRI_RULES } from "./config";

const MAX_SIZE_BYTES = AFRI_RULES.audioEnhanceMaxFileSizeMB * 1024 * 1024;
const ALLOWED_TYPES = new Set<string>(AFRI_RULES.audioEnhanceAllowedMime);

export class AudioEnhanceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AudioEnhanceError";
  }
}

export async function afriAudioEnhance(
  audioBlob: Blob,
  apiKey: string,
): Promise<Response> {
  if (!ALLOWED_TYPES.has(audioBlob.type)) {
    throw new AudioEnhanceError(
      `Type MIME non supporté: ${audioBlob.type}. Acceptés: ${[...ALLOWED_TYPES].join(", ")}`,
      "INVALID_MIME_TYPE",
    );
  }

  if (audioBlob.size > MAX_SIZE_BYTES) {
    throw new AudioEnhanceError(
      `Fichier trop volumineux (${(audioBlob.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${AFRI_RULES.audioEnhanceMaxFileSizeMB} MB`,
      "FILE_TOO_LARGE",
    );
  }

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");

  return fetch(`${AFRI_BASE_URL}${AFRI_ENDPOINTS.audioEnhance}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });
}
