import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateFlutterwavePayment } from "@/lib/payment/flutterwave";
import { initiateFedaPayPayment } from "@/lib/payment/fedapay";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";

const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });

interface CreateSubscriptionBody {
  planName: "free" | "pro";
  provider?: "flutterwave" | "fedapay";
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success } = limiter(ip);
  if (!success) {
    return NextResponse.json(
      { error: "Trop de requêtes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 },
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

  let body: CreateSubscriptionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 },
    );
  }

  const { planName, provider } = body;

  if (!planName || !["free", "pro"].includes(planName)) {
    return NextResponse.json(
      { error: "Nom de plan invalide" },
      { status: 400 },
    );
  }

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

  if (planName === "free") {
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

  if (planName === "pro") {
    if (!provider || !["flutterwave", "fedapay"].includes(provider)) {
      return NextResponse.json(
        { error: "Fournisseur de paiement requis pour le plan Pro" },
        { status: 400 },
      );
    }

    const email = user.email ?? "";
    const name =
      user.user_metadata?.business_name ||
      user.user_metadata?.name ||
      email;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const redirectUrl = `${baseUrl}/subscribe/checkout/callback?provider=${provider}&userId=${user.id}&planId=${plan.id}`;

    try {
      let paymentUrl: string;

      if (provider === "flutterwave") {
        const result = await initiateFlutterwavePayment({
          amount: plan.price_amount,
          currency: plan.currency,
          email,
          name,
          userId: user.id,
          planId: plan.id,
          redirectUrl,
        });
        paymentUrl = result.paymentUrl;
      } else {
        const result = await initiateFedaPayPayment({
          amount: plan.price_amount,
          currency: plan.currency,
          email,
          name,
          userId: user.id,
          planId: plan.id,
          redirectUrl,
        });
        paymentUrl = result.paymentUrl;
      }

      return NextResponse.json({ success: true, paymentUrl });
    } catch (err) {
      console.error("Payment initiation error:", err);
      return NextResponse.json(
        { error: "Impossible d'initier le paiement. Réessayez." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
}
