import { PricingContent } from "./_components/pricing-content";
import { JsonLd } from "@/components/seo/JsonLd";
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
    alternates: {
      canonical: "/pricing",
    },
  };
}

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Billo Pro",
  description:
    "Assistant vocal de facturation pour artisans — plan professionnel",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "0",
    highPrice: "29",
    offerCount: "2",
  },
};

export default function PricingPage() {
  return (
    <>
      <JsonLd data={pricingJsonLd} />
      <PricingContent />
    </>
  );
}
