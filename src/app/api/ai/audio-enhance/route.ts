import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { rateLimit } from "@/lib/utils/rate-limit";
import { getServerApiKeyForProvider } from "@/lib/admin/provider-keys";
import {
  afriAudioEnhance,
  AudioEnhanceError,
} from "@/lib/ai/afri/audio-enhance";

const limiter = rateLimit({ interval: 60_000, maxRequests: 20 });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { success } = limiter(auth.user.id);
  if (!success) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { code: "MISSING_FILE", error: "Aucun fichier audio fourni." },
        { status: 400 },
      );
    }

    const apiKey = await getServerApiKeyForProvider("afri");
    if (!apiKey) {
      return NextResponse.json(
        {
          code: "MISSING_API_KEY",
          error: "Clé API AFRI non configurée. Contactez l'administrateur.",
        },
        { status: 500 },
      );
    }

    const response = await afriAudioEnhance(file, apiKey);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          code: "ENHANCE_FAILED",
          error: (errorData as Record<string, unknown>).error ?? "Échec du traitement audio.",
        },
        { status: response.status },
      );
    }

    const enhancedAudio = await response.arrayBuffer();
    return new NextResponse(enhancedAudio, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("Content-Type") ?? "audio/wav",
      },
    });
  } catch (error) {
    if (error instanceof AudioEnhanceError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: 400 },
      );
    }
    console.error("Audio enhance error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", error: "Erreur interne du serveur." },
      { status: 500 },
    );
  }
}
