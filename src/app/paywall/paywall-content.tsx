"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/context";
import { useCurrency } from "@/hooks/use-currency";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { cn } from "@/lib/utils";

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

interface PaywallContentProps {
  packs: CreditPack[];
}

function formatPrice(currency: string, priceXof: number, priceUsdCents: number): string {
  if (currency === "XOF") {
    return `${priceXof.toLocaleString("fr-FR")} FCFA`;
  }
  const dollars = priceUsdCents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaywallContent({ packs }: PaywallContentProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  const activePacks = packs
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted to-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5"
        aria-label="Billo — Accueil"
      >
        <BilloLogoMark className="h-9 w-9" size={36} />
        <span className="text-lg font-bold text-brand">Billo</span>
      </Link>

      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <Zap className="h-3 w-3" aria-hidden />
          {t("paywall.badge")}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("paywall.title")}
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          {t("paywall.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {activePacks.map((pack) => {
          const totalCredits = pack.creditsAmount + pack.bonusCredits;
          const isPopular = pack.slug === "populaire";

          return (
            <div
              key={pack.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg",
                isPopular
                  ? "border-primary/50 bg-primary/5 shadow-md"
                  : "border-border bg-card",
              )}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {t("paywall.popular")}
                </span>
              )}

              <h3 className="text-lg font-bold text-foreground">
                {pack.displayName}
              </h3>

              <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
                {formatPrice(currency, pack.priceXof, pack.priceUsdCents)}
              </p>

              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
                </span>
                {pack.bonusCredits > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (dont {pack.bonusCredits} offerts)
                  </span>
                )}
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {[t("paywall.featureVoice"), t("paywall.featureExport"), t("paywall.featureNoExpiry")].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-6 w-full gap-2",
                  isPopular && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                variant={isPopular ? "default" : "outline"}
              >
                <Link href={`/credits/buy/${pack.slug}`}>
                  {t("paywall.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        {t("paywall.singlePayment")}
      </div>
    </div>
  );
}
