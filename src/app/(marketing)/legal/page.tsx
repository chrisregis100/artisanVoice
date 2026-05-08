import { Metadata } from "next";
import { LegalContent } from "./legal-content";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales et conditions générales d'utilisation de Billo, l'assistant vocal de facturation pour artisans.",
  robots: { index: true, follow: true },
};

export default function LegalPage() {
  return <LegalContent />;
}
