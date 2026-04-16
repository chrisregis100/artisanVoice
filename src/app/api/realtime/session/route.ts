import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getActiveProvider } from "@/lib/ai/provider";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = limiter(ip);
  if (!success) {
    return NextResponse.json(
      { code: "RATE_LIMITED", error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", error: "Authentification requise." },
      { status: 401 }
    );
  }

  let userApiKey: string | undefined;
  try {
    const body = await request.json();
    const raw = typeof body?.userApiKey === "string" ? body.userApiKey.trim() : "";
    userApiKey = raw || undefined;
  } catch {
    // Missing or malformed body — use server key
  }

  try {
    const provider = await getActiveProvider();

    const apiKey =
      userApiKey ??
      (provider.name === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.OPENAI_API_KEY);

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
