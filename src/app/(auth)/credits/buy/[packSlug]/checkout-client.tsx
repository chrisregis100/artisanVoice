"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Zap,
} from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { useCurrency } from "@/hooks/use-currency";
import { initiateFedaPayPurchase, getLemonSqueezyUrl } from "./actions";

interface CreditPack {
  id: string;
  slug: string;
  displayName: string;
  creditsAmount: number;
  bonusCredits: number;
  priceUsdCents: number;
  priceXof: number;
  isActive: boolean;
  sortOrder: number;
}

interface CheckoutClientProps {
  pack: CreditPack;
  userId: string;
}

function formatXof(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CheckoutClient({ pack, userId }: CheckoutClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const { currency } = useCurrency();

  const isAfrican = currency === "XOF";
  const totalCredits = pack.creditsAmount + pack.bonusCredits;

  const handleFedaPay = async () => {
    setIsLoading(true);
    try {
      const result = await initiateFedaPayPurchase(pack.slug);
      if (result?.error) {
        toast.error("Erreur de paiement", { description: result.error });
        setIsLoading(false);
      }
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setIsLoading(false);
    }
  };

  const handleLemonSqueezy = async () => {
    setIsLoading(true);
    try {
      const result = await getLemonSqueezyUrl(pack.slug, userId);
      if ("error" in result) {
        toast.error("Erreur", { description: result.error });
        setIsLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setIsLoading(false);
    }
  };

  const handlePrimaryPayment = isAfrican ? handleFedaPay : handleLemonSqueezy;
  const handleAlternativePayment = isAfrican ? handleLemonSqueezy : handleFedaPay;

  const primaryLabel = isAfrican ? "Payer avec Mobile Money" : "Payer par carte";
  const primaryIcon = isAfrican ? Smartphone : CreditCard;
  const primaryPrice = isAfrican ? formatXof(pack.priceXof) : formatUsd(pack.priceUsdCents);
  const primarySubtext = isAfrican ? "MTN Money · Moov Money · Carte locale" : "Visa · Mastercard · Apple Pay · Google Pay";
  const PrimaryIcon = primaryIcon;

  const altLabel = isAfrican ? "Payer par carte internationale" : "Payer avec Mobile Money (Afrique)";
  const altPrice = isAfrican ? formatUsd(pack.priceUsdCents) : formatXof(pack.priceXof);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Billo — Accueil">
              <BilloLogoMark className="h-9 w-9" size={36} />
              <span className="text-lg font-bold text-brand">Billo</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
              aria-label="Retour aux packs"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Retour aux packs
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Paiement sécurisé
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: payment */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Finaliser votre achat
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {primarySubtext}
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* Primary provider */}
                <Button
                  onClick={() => void handlePrimaryPayment()}
                  disabled={isLoading}
                  className="h-14 w-full gap-3 rounded-xl text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <PrimaryIcon className="h-5 w-5" aria-hidden />
                  )}
                  {primaryLabel} — {primaryPrice}
                </Button>

                {/* Alternative toggle */}
                {!showAlternative ? (
                  <button
                    type="button"
                    onClick={() => setShowAlternative(true)}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Autre méthode de paiement
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAlternativePayment()}
                    disabled={isLoading}
                    className={cn(
                      "flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all",
                      "border-border bg-card hover:border-brand/50 hover:bg-muted/50 disabled:opacity-60",
                    )}
                  >
                    <p className="font-semibold text-foreground">{altLabel}</p>
                    <p className="mt-1 text-lg font-black tabular-nums text-foreground">
                      {altPrice}
                    </p>
                  </button>
                )}
              </div>

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/60">
                Les crédits sont ajoutés immédiatement après confirmation du paiement.
              </p>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="min-w-0 lg:col-span-5">
            <Card className="rounded-2xl border-border/90 p-6 shadow-md shadow-border/30 sm:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Récapitulatif
              </h2>

              <div className="mt-5 border-b border-border pb-5">
                <span className="text-lg font-bold text-foreground">
                  Pack {pack.displayName}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
                  </span>
                  {pack.bonusCredits > 0 && (
                    <span className="text-xs text-muted-foreground">
                      dont {pack.bonusCredits} offerts
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Inclus
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    `${pack.creditsAmount} crédits${pack.bonusCredits > 0 ? ` + ${pack.bonusCredits} offerts` : ""}`,
                    "Assistant vocal pour créer vos factures",
                    "Édition et personnalisation complète",
                    "Export PDF professionnel",
                    "Crédits sans expiration",
                  ].map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm leading-snug text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3">
                <span className="font-semibold text-foreground/80">Total</span>
                <p className="text-xl font-black tabular-nums text-foreground">
                  {primaryPrice}
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground/60">
                Paiement unique · Pas d&apos;abonnement
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
