import { PricingContent } from "./_components/pricing-content";
import { JsonLd } from "@/components/seo/JsonLd";

export async function generateMetadata() {
  return {
    title: "Tarifs — Billo",
    description:
      "Plans simples et transparents pour artisans. Achetez des crédits à la demande et exportez vos factures sans abonnement.",
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
