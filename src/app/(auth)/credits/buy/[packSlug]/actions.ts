"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { initiateFedaPayPackPurchase } from "@/lib/payment/fedapay";
import { env } from "@/lib/env";

const LEMONSQUEEZY_VARIANT_MAP: Record<string, string | undefined> = {
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER_USD,
  populaire: process.env.LEMONSQUEEZY_VARIANT_POPULAIRE_USD,
  pro: process.env.LEMONSQUEEZY_VARIANT_PRO_USD,
};

export async function initiateFedaPayPurchase(packSlug: string): Promise<{ error: string }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const redirectUrl = `${appUrl}/credits/buy/${packSlug}/success?provider=fedapay`;

  try {
    const { paymentUrl } = await initiateFedaPayPackPurchase({
      userId: user.id,
      packSlug,
      redirectUrl,
    });
    redirect(paymentUrl);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) throw err;
    const message = err instanceof Error ? err.message : "Erreur lors de l'initialisation du paiement";
    return { error: message };
  }
}

export async function getLemonSqueezyUrl(
  packSlug: string,
  userId: string,
): Promise<{ url: string } | { error: string }> {
  const variantId = LEMONSQUEEZY_VARIANT_MAP[packSlug];
  if (!variantId) {
    return { error: "Ce pack n'est pas disponible pour le paiement international pour l'instant." };
  }

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const successUrl = `${appUrl}/credits/buy/${packSlug}/success?provider=lemonsqueezy`;

  const params = new URLSearchParams({
    "checkout[custom][user_id]": userId,
    "checkout[custom][pack_slug]": packSlug,
    "checkout[success_url]": successUrl,
  });

  return { url: `https://store.lemonsqueezy.com/checkout/buy/${variantId}?${params.toString()}` };
}
