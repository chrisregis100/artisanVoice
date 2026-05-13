import { NextRequest, NextResponse } from "next/server";
import { initiateFedaPayPayment } from "@/lib/payment/fedapay";
import { rateLimit } from "@/lib/utils/rate-limit";
import { requireAuth } from "@/lib/api/auth";
import { clientEnv, env } from "@/lib/env";
import { subscriptionCreateSchema } from "@/lib/api/schemas";

const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  const { success } = limiter(user.id);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  const businessName =
    typeof user.user_metadata?.business_name === "string"
      ? user.user_metadata.business_name
      : "";

  const { error: ensureUserError } = await supabase
    .from("users")
    .upsert(
      { id: user.id, business_name: businessName },
      { onConflict: "id" },
    );

  if (ensureUserError) {
    console.error("Failed to ensure public.users row:", ensureUserError);
    return NextResponse.json(
      { error: "Impossible de synchroniser le profil" },
      { status: 500 },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const bodyResult = subscriptionCreateSchema.safeParse(rawBody);
  if (!bodyResult.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: bodyResult.error.flatten() },
      { status: 400 },
    );
  }

  const { planName, provider, currency } = bodyResult.data;

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id, name, price_amount, currency")
    .eq("name", planName)
    .eq("is_active", true)
    .single();

  if (planError || !plan) {
    return NextResponse.json(
      { error: "Plan introuvable" },
      { status: 404 },
    );
  }

  if (planName === "free" || planName.startsWith("free_")) {
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { success: true, redirect: "/dashboard" },
      );
    }

    const { error: insertError } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        payment_provider: null,
        payment_reference: null,
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      });

    if (insertError) {
      console.error("Failed to create free subscription:", insertError);
      return NextResponse.json(
        { error: "Impossible de créer l'abonnement" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, redirect: "/dashboard" });
  }

  // Block re-subscription to the exact same active plan; allow plan changes
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("id, plan_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (existingSub?.plan_id === plan.id) {
    return NextResponse.json(
      { error: "Vous avez déjà cet abonnement actif" },
      { status: 409 },
    );
  }

  // Determine effective provider: explicit from request, or inferred from plan currency (backward compat)
  const planCurrency = plan.currency?.toUpperCase() ?? "XOF";
  const effectiveProvider =
    provider ??
    (planCurrency === "EUR" || planCurrency === "USD" ? "lemonsqueezy" : "fedapay");

  if (effectiveProvider === "lemonsqueezy") {
    return handleLemonSqueezyCheckout(request, user, plan, planName, currency);
  }

  // FedaPay — XOF plans
  const email = user.email ?? "";
  const name =
    user.user_metadata?.business_name ||
    user.user_metadata?.name ||
    email;

  const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUrl = `${baseUrl}/subscribe/checkout/callback?provider=fedapay&planId=${plan.id}`;

  try {
    const result = await initiateFedaPayPayment({
      amount: plan.price_amount,
      currency: plan.currency,
      email,
      name,
      userId: user.id,
      planId: plan.id,
      redirectUrl,
    });

    return NextResponse.json({ success: true, paymentUrl: result.paymentUrl });
  } catch (err) {
    console.error("Payment initiation error:", err);
    return NextResponse.json(
      { error: "Impossible d'initier le paiement. Réessayez." },
      { status: 502 },
    );
  }
}

const LEMONSQUEEZY_VARIANT_MAP: Record<string, string> = {
  early_bird_eur: "LEMONSQUEEZY_VARIANT_EARLY_BIRD_EUR",
  early_bird_usd: "LEMONSQUEEZY_VARIANT_EARLY_BIRD_USD",
  pro_monthly_eur: "LEMONSQUEEZY_VARIANT_PRO_MONTHLY_EUR",
  pro_monthly_usd: "LEMONSQUEEZY_VARIANT_PRO_MONTHLY_USD",
  pro_annual_eur: "LEMONSQUEEZY_VARIANT_PRO_ANNUAL_EUR",
  pro_annual_usd: "LEMONSQUEEZY_VARIANT_PRO_ANNUAL_USD",
  business_monthly_eur: "LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY_EUR",
  business_monthly_usd: "LEMONSQUEEZY_VARIANT_BUSINESS_MONTHLY_USD",
  business_annual_eur: "LEMONSQUEEZY_VARIANT_BUSINESS_ANNUAL_EUR",
  business_annual_usd: "LEMONSQUEEZY_VARIANT_BUSINESS_ANNUAL_USD",
};

async function handleLemonSqueezyCheckout(
  request: NextRequest,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> },
  plan: { id: string; name: string; price_amount: number; currency: string },
  planName: string,
  currency?: string,
): Promise<NextResponse> {
  const apiKey = env.LEMONSQUEEZY_API_KEY;
  const storeId = env.LEMONSQUEEZY_STORE_ID;

  if (!apiKey || !storeId) {
    console.error("Lemon Squeezy credentials not configured");
    return NextResponse.json(
      { error: "Paiement international non configuré." },
      { status: 503 },
    );
  }

  // Build variant lookup key: strip any existing currency suffix, then append the request currency
  let variantKey = planName.toLowerCase();
  if (currency) {
    variantKey =
      variantKey.replace(/_(?:eur|usd|xof)$/, "") + `_${currency.toLowerCase()}`;
  }

  const variantEnvKey = LEMONSQUEEZY_VARIANT_MAP[variantKey];
  const variantId = variantEnvKey
    ? (env[variantEnvKey as keyof typeof env] as string | undefined)
    : undefined;

  if (!variantId) {
    console.error(`No Lemon Squeezy variant configured for plan: ${variantKey}`);
    return NextResponse.json(
      { error: "Variante du plan introuvable." },
      { status: 404 },
    );
  }

  const baseUrl = clientEnv.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const redirectUrl = `${baseUrl}/subscribe/checkout/callback?provider=lemonsqueezy&planId=${plan.id}`;

  const email = user.email ?? "";

  const checkoutBody = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email,
          custom: {
            user_id: user.id,
            plan_name: planName,
          },
        },
        product_options: {
          redirect_url: redirectUrl,
        },
      },
      relationships: {
        store: {
          data: { type: "stores", id: String(storeId) },
        },
        variant: {
          data: { type: "variants", id: String(variantId) },
        },
      },
    },
  };

  try {
    const lsResponse = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify(checkoutBody),
    });

    if (!lsResponse.ok) {
      const errText = await lsResponse.text();
      console.error("Lemon Squeezy checkout creation failed:", errText);
      return NextResponse.json(
        { error: "Impossible de créer le paiement. Réessayez." },
        { status: 502 },
      );
    }

    const lsData = (await lsResponse.json()) as {
      data?: { attributes?: { url?: string } };
    };
    const checkoutUrl = lsData.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("Lemon Squeezy returned no checkout URL", lsData);
      return NextResponse.json(
        { error: "URL de paiement manquante." },
        { status: 502 },
      );
    }

    return NextResponse.json({ success: true, paymentUrl: checkoutUrl });
  } catch (err) {
    console.error("Lemon Squeezy request error:", err);
    return NextResponse.json(
      { error: "Impossible d'initier le paiement. Réessayez." },
      { status: 502 },
    );
  }
}
