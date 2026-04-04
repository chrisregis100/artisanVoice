import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let apiKey: string | undefined;

  try {
    const body = await request.json();
    apiKey = typeof body?.apiKey === "string" ? body.apiKey.trim() : undefined;
  } catch {
    // Malformed JSON body — treat as missing key
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        code: "MISSING_API_KEY",
        error:
          "Clé API OpenAI manquante. Configurez-la dans Paramètres → Clé API.",
      },
      { status: 400 }
    );
  }

  try {
    // Create an ephemeral token for the Realtime API
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "alloy",
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", errorText);

      if (response.status === 401) {
        return NextResponse.json(
          {
            code: "INVALID_API_KEY",
            error:
              "Clé API OpenAI invalide. Vérifiez votre clé dans Paramètres → Clé API.",
          },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            code: "QUOTA_EXCEEDED",
            error:
              "Quota OpenAI dépassé. Vérifiez votre compte OpenAI puis réessayez.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          code: "SESSION_ERROR",
          error: "Impossible de créer la session vocale. Réessayez.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Return the WebSocket URL with the ephemeral token
    return NextResponse.json({
      url: `wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17`,
      token: data.client_secret?.value,
      expiresAt: data.client_secret?.expires_at,
    });
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", error: "Erreur interne du serveur. Réessayez." },
      { status: 500 }
    );
  }
}
