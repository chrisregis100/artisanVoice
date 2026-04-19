import { PricingContent } from "./_components/pricing-content";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  let proPrice = 5000;
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("plans")
      .select("price_amount")
      .eq("name", "pro")
      .eq("is_active", true)
      .maybeSingle();
    if (data?.price_amount != null) proPrice = data.price_amount;
  } catch {
    /* fallback */
  }

  return {
    title: "Tarifs — Billo",
    description: `Plans simples et transparents pour artisans. Gratuit jusqu'à 3 factures par mois, Pro illimité à ${proPrice.toLocaleString("fr-FR")} FCFA/mois.`,
  };
}

export default function PricingPage() {
  return <PricingContent />;
}
