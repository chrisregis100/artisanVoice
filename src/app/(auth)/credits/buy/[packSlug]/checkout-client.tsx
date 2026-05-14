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
  const [loadingProvider, setLoadingProvider] = useState<"fedapay" | "lemonsqueezy" | null>(null);
  const totalCredits = pack.creditsAmount + pack.bonusCredits;

  const handleFedaPay = async () => {
    setLoadingProvider("fedapay");
    try {
      const result = await initiateFedaPayPurchase(pack.slug);
      if (result?.error) {
        toast.error("Erreur de paiement", { description: result.error });
        setLoadingProvider(null);
      }
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setLoadingProvider(null);
    }
  };

  const handleLemonSqueezy = async () => {
    setLoadingProvider("lemonsqueezy");
    try {
      const result = await getLemonSqueezyUrl(pack.slug, userId);
      if ("error" in result) {
        toast.error("Erreur", { description: result.error });
        setLoadingProvider(null);
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setLoadingProvider(null);
    }
  };

  const isLoading = loadingProvider !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      {/* Header */}
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Billo — Accueil"
            >
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
          {/* Left: payment providers */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Choisir un mode de paiement
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sélectionnez votre méthode de paiement préférée.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* FedaPay */}
                <button
                  type="button"
                  onClick={() => void handleFedaPay()}
                  disabled={isLoading}
                  aria-label="Payer avec Mobile Money ou carte locale via FedaPay"
                  className={cn(
                    "group flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60",
                    "border-border bg-card hover:border-brand/50 hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                      <Smartphone className="h-5 w-5" aria-hidden />
                    </div>
                    {loadingProvider === "fedapay" && (
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-500" aria-hidden />
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-foreground">Mobile Money &amp; Carte locale</p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Afrique · FedaPay
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {["MTN Mobile Money", "Moov Money", "Carte Visa/MC locale"].map((method) => (
                      <li
                        key={method}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
                        {method}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">Prix</p>
                    <p className="mt-0.5 text-lg font-black tabular-nums text-foreground">
                      {formatXof(pack.priceXof)}
                    </p>
                  </div>
                </button>

                {/* LemonSqueezy */}
                <button
                  type="button"
                  onClick={() => void handleLemonSqueezy()}
                  disabled={isLoading}
                  aria-label="Payer avec carte internationale via Lemon Squeezy"
                  className={cn(
                    "group flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60",
                    "border-border bg-card hover:border-brand/50 hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-400 text-yellow-900 shadow-sm">
                      <CreditCard className="h-5 w-5" aria-hidden />
                    </div>
                    {loadingProvider === "lemonsqueezy" && (
                      <Loader2 className="h-5 w-5 animate-spin text-yellow-500" aria-hidden />
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-foreground">Carte internationale</p>
                    <p className="mt-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      International · Lemon Squeezy
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {["Visa / Mastercard", "Apple Pay", "Google Pay"].map((method) => (
                      <li
                        key={method}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                      >
                        <CheckCircle2 className="h-3 w-3 shrink-0 text-yellow-500" aria-hidden />
                        {method}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">Prix</p>
                    <p className="mt-0.5 text-lg font-black tabular-nums text-foreground">
                      {formatUsd(pack.priceUsdCents)}
                    </p>
                  </div>
                </button>
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
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-lg font-bold text-foreground">
                    Pack {pack.displayName}
                  </span>
                </div>
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
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm leading-snug text-foreground/80"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3">
                <span className="font-semibold text-foreground/80">Total (paiement unique)</span>
                <div className="text-right">
                  <p className="text-xl font-black tabular-nums text-foreground">
                    {formatXof(pack.priceXof)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ou {formatUsd(pack.priceUsdCents)}
                  </p>
                </div>
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
