import { JsonLd } from "@/components/seo/JsonLd";
import { LandingContent } from "./_components/landing";

export const metadata = {
  title: "Billo — Créez vos factures par la voix",
  description:
    "Assistant vocal de facturation pour artisans. Dictez, la facture se crée automatiquement. Partagez via WhatsApp en quelques secondes.",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Billo",
  url: "https://billo.regiskiki.me",
  logo: "https://billo.regiskiki.me/icon-512.svg",
  description: "Assistant vocal de facturation pour artisans",
  sameAs: [],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Billo",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Assistant vocal intelligent pour créer des devis et factures en parlant. Conçu pour les artisans et indépendants.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Essai gratuit disponible",
  },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <JsonLd data={softwareJsonLd} />
      <LandingContent />
    </>
  );
}
