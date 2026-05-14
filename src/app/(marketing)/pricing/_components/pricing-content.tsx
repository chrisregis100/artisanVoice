"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, Mic, FileText, Loader2, Zap, Star } from "lucide-react";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { useCurrency } from "@/hooks/use-currency";
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

function formatXof(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function PackCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse">
      <div className="mb-5">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="mt-3 h-10 w-32 rounded bg-muted" />
        <div className="mt-2 h-3 w-40 rounded bg-muted" />
      </div>
      <div className="mb-6 h-10 w-full rounded-xl bg-muted" />
      <div className="flex flex-col gap-2.5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-full rounded bg-muted" />
        ))}
      </div>
    </div>
  );
}

export function PricingContent() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await fetch("/api/credits/packs");
        if (!res.ok) throw new Error("Impossible de charger les packs");
        const data: { packs: CreditPack[] } = await res.json();
        setPacks(data.packs);
      } catch {
        // Silently fail — packs stay empty, skeleton disappears
      } finally {
        setIsLoading(false);
      }
    };
    void fetchPacks();
  }, []);

  const formatPackPrice = (pack: CreditPack): string => {
    if (currency === "XOF") return formatXof(pack.priceXof);
    return formatUsd(pack.priceUsdCents);
  };

  const formatPricePerCredit = (pack: CreditPack): string => {
    const totalCredits = pack.creditsAmount + pack.bonusCredits;
    if (currency === "XOF") {
      const perCredit = Math.round(pack.priceXof / totalCredits);
      return `${perCredit.toLocaleString("fr-FR")} FCFA / crédit`;
    }
    const perCreditCents = Math.round(pack.priceUsdCents / totalCredits);
    const perCreditDollars = perCreditCents / 100;
    return `$${perCreditDollars.toFixed(2)} / crédit`;
  };

  const isPopular = (pack: CreditPack) => pack.slug === "populaire";
  const isPro = (pack: CreditPack) => pack.slug === "pro";

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-4 inline-block rounded-full bg-brand-foreground/10 px-4 py-1.5 text-sm font-semibold text-brand-foreground/70">
            {t("pricingPage.badge")}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-foreground sm:text-5xl">
            Payez ce que vous utilisez
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-brand-foreground/60">
            Achetez un pack de crédits, utilisez-les quand vous voulez. Aucun abonnement, aucun renouvellement automatique.
          </p>
        </div>
      </section>

      {/* Packs */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free / Gratuit card */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground">Gratuit</h2>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-foreground">0</span>
                  <span className="text-sm font-medium text-muted-foreground">FCFA</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  3 crédits offerts à l&apos;inscription
                </p>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="mb-6 h-10 w-full rounded-xl border-brand text-brand font-semibold hover:bg-brand/5"
              >
                <Link href="/register">Commencer gratuitement</Link>
              </Button>

              <ul className="flex flex-col gap-2.5">
                {[
                  "Assistant vocal",
                  "Édition de factures",
                  "PDF professionnel",
                  "3 crédits inclus",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dynamic pack cards */}
            {isLoading
              ? [1, 2, 3].map((i) => <PackCardSkeleton key={i} />)
              : packs.map((pack) => {
                  const totalCredits = pack.creditsAmount + pack.bonusCredits;
                  const popular = isPopular(pack);
                  const pro = isPro(pack);

                  return (
                    <div
                      key={pack.id}
                      className={cn(
                        "relative flex flex-col rounded-2xl p-6 shadow-sm",
                        popular
                          ? "bg-foreground shadow-2xl shadow-brand/20 ring-2 ring-brand/40 scale-[1.02]"
                          : "border border-border bg-card",
                      )}
                    >
                      {popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <span className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                            Le plus populaire
                          </span>
                        </div>
                      )}

                      <div className="mb-5 mt-1">
                        <div className="flex items-center gap-2">
                          <h2
                            className={cn(
                              "text-lg font-bold",
                              popular ? "text-background" : "text-foreground",
                            )}
                          >
                            {pack.displayName}
                          </h2>
                          {pro && pack.bonusCredits > 0 && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                              <Zap className="h-3 w-3" aria-hidden />
                              +{pack.bonusCredits} bonus
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                          <span
                            className={cn(
                              "text-4xl font-black",
                              popular ? "text-background" : "text-foreground",
                            )}
                          >
                            {formatPackPrice(pack)}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center gap-1.5">
                          <Star
                            className={cn(
                              "h-3.5 w-3.5",
                              popular ? "text-background/60" : "text-muted-foreground",
                            )}
                            aria-hidden
                          />
                          <span
                            className={cn(
                              "text-xs font-medium",
                              popular ? "text-background/60" : "text-muted-foreground",
                            )}
                          >
                            {totalCredits} crédit{totalCredits > 1 ? "s" : ""} · {formatPricePerCredit(pack)}
                          </span>
                        </div>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "mb-6 h-10 w-full rounded-xl font-semibold shadow-sm",
                          popular
                            ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30"
                            : "bg-foreground text-background hover:bg-foreground/90",
                        )}
                      >
                        <Link href={`/credits/buy/${pack.slug}`}>
                          Acheter
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                        </Link>
                      </Button>

                      <ul className="flex flex-col gap-2.5">
                        {[
                          `${pack.creditsAmount} crédits${pack.bonusCredits > 0 ? ` + ${pack.bonusCredits} offerts` : ""}`,
                          "Assistant vocal",
                          "Édition de factures",
                          "PDF professionnel",
                        ].map((f) => (
                          <li key={f} className="flex items-center gap-2.5">
                            <CheckCircle2
                              className={cn(
                                "h-4 w-4 shrink-0",
                                popular ? "text-primary" : "text-primary",
                              )}
                              aria-hidden
                            />
                            <span
                              className={cn(
                                "text-xs",
                                popular ? "text-background/80" : "text-foreground/80",
                              )}
                            >
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
          </div>

          {/* Marketing reassurances */}
          <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-8">
            {[
              { icon: CheckCircle2, text: "Les crédits n'expirent jamais" },
              { icon: Mic, text: "Les crédits se cumulent entre les packs" },
              { icon: FileText, text: "Pas d'abonnement, pas de renouvellement automatique" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="border-t border-border bg-muted py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-foreground">
            {t("pricingPage.questionsTitle")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("pricingPage.questionsSubtitle")}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="rounded-xl bg-brand px-6 font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <Link href="/#faq">{t("pricingPage.faqBtn")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl px-6 font-semibold"
            >
              <Link href="mailto:contact@billo.regiskiki.me">
                {t("pricingPage.contactBtn")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="Billo - Accueil"
            >
              <BilloLogoMark className="h-8 w-8" size={32} />
              <span className="font-bold text-brand">Billo</span>
            </Link>
            <p className="text-sm text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Billo &middot;{" "}
              {t("pricingPage.footerRights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Keep ComparisonCell for potential reuse elsewhere
export function ComparisonCell({
  value,
  isHighlighted = false,
  notIncluded,
  included,
}: {
  value: boolean | string;
  isHighlighted?: boolean;
  notIncluded: string;
  included: string;
}) {
  if (value === false)
    return (
      <span className="text-muted-foreground/30" aria-label={notIncluded}>
        &mdash;
      </span>
    );
  if (value === true)
    return (
      <CheckCircle2
        className="mx-auto h-5 w-5 text-primary"
        aria-label={included}
      />
    );
  return (
    <span
      className={cn(
        "font-semibold",
        isHighlighted ? "text-foreground" : "text-foreground/80",
      )}
    >
      {value}
    </span>
  );
}
