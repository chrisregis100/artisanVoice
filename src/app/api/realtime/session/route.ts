import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { getActiveProvider } from "@/lib/ai/provider";
import { rateLimit } from "@/lib/utils/rate-limit";
import { env } from "@/lib/env";
import { realtimeSessionSchema } from "@/lib/api/schemas";

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  const { success } = limiter(auth.user.id);
  if (!success) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  let userApiKey: string | undefined;
  try {
    const rawBody = await request.json();
    const bodyResult = realtimeSessionSchema.safeParse(rawBody);
    if (bodyResult.success) {
      userApiKey = bodyResult.data.userApiKey || undefined;
    }
  } catch {
    // Body is optional — fall through to use server key
  }

  try {
    const provider = await getActiveProvider();

    const apiKey =
      userApiKey ??
      (provider.name === "gemini"
        ? env.GEMINI_API_KEY
        : env.OPENAI_API_KEY);

    if (!apiKey) {
      return NextResponse.json(
        {
          code: "MISSING_API_KEY",
          error: "Clé API non configurée sur le serveur. Contactez l'administrateur.",
        },
        { status: 500 }
      );
    }

    const session = await provider.createSession(apiKey);

    return NextResponse.json({
      provider: provider.name,
      url: session.url,
      token: session.token,
      model: session.model,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "INVALID_API_KEY") {
        return NextResponse.json(
          {
            code: "INVALID_API_KEY",
            error: "Clé API invalide. Vérifiez la configuration du serveur.",
          },
          { status: 401 }
        );
      }
      if (error.message === "QUOTA_EXCEEDED") {
        return NextResponse.json(
          {
            code: "QUOTA_EXCEEDED",
            error: "Quota API dépassé. Réessayez plus tard.",
          },
          { status: 429 }
        );
      }
    }
    console.error("Session creation error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", error: "Erreur interne du serveur. Réessayez." },
      { status: 500 }
    );
  }
}
