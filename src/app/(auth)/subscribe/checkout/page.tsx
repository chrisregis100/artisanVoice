"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/i18n/context";
import { useCurrency } from "@/hooks/use-currency";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  CreditCard,
  Smartphone,
} from "lucide-react";

type PlanKey =
  | "early_bird"
  | "pro_monthly"
  | "pro_annual"
  | "business_monthly"
  | "business_annual";

type PaymentProvider = "fedapay" | "lemonsqueezy";
type LemonCurrency = "EUR" | "USD";

const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  early_bird: "Early Bird",
  pro_monthly: "Pro (mensuel)",
  pro_annual: "Pro (annuel)",
  business_monthly: "Business (mensuel)",
  business_annual: "Business (annuel)",
};

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  early_bird: [
    "Factures illimitées",
    "3 templates",
    "Export PDF sans branding",
    "Historique complet",
    "Accès bêta-testeur",
  ],
  pro_monthly: [
    "Factures illimitées",
    "3 templates",
    "Export PDF sans branding",
    "Historique complet",
    "Support email 24h",
  ],
  pro_annual: [
    "Factures illimitées",
    "3 templates",
    "Export PDF sans branding",
    "Historique complet",
    "Support email 24h",
  ],
  business_monthly: [
    "Tout le plan Pro",
    "Templates illimités",
    "Branding personnalisé",
    "Multi-devises",
    "Support prioritaire 4h",
  ],
  business_annual: [
    "Tout le plan Pro",
    "Templates illimités",
    "Branding personnalisé",
    "Multi-devises",
    "Support prioritaire 4h",
  ],
};

// Raw prices from the PRICES map; EUR/USD are in cents
const PRICES: Record<PlanKey, Record<"XOF" | "EUR" | "USD", number>> = {
  early_bird: { XOF: 2500, EUR: 450, USD: 450 },
  pro_monthly: { XOF: 5000, EUR: 900, USD: 900 },
  pro_annual: { XOF: 50000, EUR: 9000, USD: 9000 },
  business_monthly: { XOF: 10000, EUR: 1900, USD: 1900 },
  business_annual: { XOF: 100000, EUR: 19000, USD: 19000 },
};

function formatXOF(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatLemon(amount: number, cur: LemonCurrency): string {
  const display = amount / 100;
  const symbol = cur === "EUR" ? "€" : "$";
  return cur === "EUR"
    ? `${symbol}${display.toLocaleString("fr-FR")}`
    : `${symbol}${display.toLocaleString("en-US")}`;
}

function isValidPlanKey(value: string | null): value is PlanKey {
  return [
    "early_bird",
    "pro_monthly",
    "pro_annual",
    "business_monthly",
    "business_annual",
  ].includes(value ?? "");
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const { currency } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const rawPlan = searchParams.get("plan");
  const planKey: PlanKey = isValidPlanKey(rawPlan) ? rawPlan : "pro_monthly";
  const planDisplayName = PLAN_DISPLAY_NAMES[planKey];
  const features = PLAN_FEATURES[planKey];
  const isAnnual = planKey.includes("annual");

  // Selected provider state
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider>("fedapay");

  // EUR/USD toggle — default based on geo currency
  const [lemonCurrency, setLemonCurrency] = useState<LemonCurrency>("EUR");

  // Once the cookie-based currency is resolved, default Lemon currency
  useEffect(() => {
    if (currency === "EUR") setLemonCurrency("EUR");
    else if (currency === "USD") setLemonCurrency("USD");
    // XOF users default to EUR for the Lemon card
  }, [currency]);

  const prices = PRICES[planKey];

  const selectedPrice =
    selectedProvider === "fedapay"
      ? formatXOF(prices.XOF)
      : formatLemon(prices[lemonCurrency], lemonCurrency);

  const handlePay = async () => {
    setIsLoading(true);
    try {
      let planName: string;
      let provider: PaymentProvider;

      if (selectedProvider === "fedapay") {
        planName = `${planKey}_xof`;
        provider = "fedapay";
      } else {
        planName = `${planKey}_${lemonCurrency.toLowerCase()}`;
        provider = "lemonsqueezy";
      }

      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName, provider, currency: lemonCurrency }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ?? t("auth.checkout.paymentInitError"),
        );
      }

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : t("auth.checkout.unexpectedError");
      toast.error(message);
      setIsLoading(false);
    }
  };

  const payLabel =
    locale === "en"
      ? `Pay ${selectedPrice}`
      : `Payer ${selectedPrice}`;

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
              href="/subscribe"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
              aria-label={t("auth.checkout.backAria")}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t("auth.checkout.backBtn")}
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {t("auth.checkout.securePayment")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Provider selection */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("auth.checkout.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Choisissez votre mode de paiement préféré
              </p>

              {/* Provider cards grid */}
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* FedaPay card */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider("fedapay")}
                  aria-pressed={selectedProvider === "fedapay"}
                  className={cn(
                    "group flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    selectedProvider === "fedapay"
                      ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                      : "border-border bg-card hover:border-brand/50 hover:bg-muted/50",
                  )}
                >
                  {/* Radio indicator + icon row */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-sm">
                      <Smartphone className="h-5 w-5" aria-hidden />
                    </div>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        selectedProvider === "fedapay"
                          ? "border-brand bg-brand"
                          : "border-border bg-background",
                      )}
                      aria-hidden
                    >
                      {selectedProvider === "fedapay" && (
                        <span className="h-2 w-2 rounded-full bg-brand-foreground" />
                      )}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-foreground">
                      Mobile Money &amp; Carte
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                      Afrique · FedaPay
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {["MTN Mobile Money", "Moov Money", "Carte Visa/MC locale"].map(
                      (method) => (
                        <li
                          key={method}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" aria-hidden />
                          {method}
                        </li>
                      ),
                    )}
                  </ul>

                  <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">Prix</p>
                    <p className="mt-0.5 text-lg font-black tabular-nums text-foreground">
                      {formatXOF(prices.XOF)}
                    </p>
                  </div>
                </button>

                {/* Lemon Squeezy card */}
                <button
                  type="button"
                  onClick={() => setSelectedProvider("lemonsqueezy")}
                  aria-pressed={selectedProvider === "lemonsqueezy"}
                  className={cn(
                    "group flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    selectedProvider === "lemonsqueezy"
                      ? "border-brand bg-brand/5 ring-2 ring-brand/30"
                      : "border-border bg-card hover:border-brand/50 hover:bg-muted/50",
                  )}
                >
                  {/* Radio indicator + icon row */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-yellow-400 text-yellow-900 shadow-sm">
                      <CreditCard className="h-5 w-5" aria-hidden />
                    </div>
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                        selectedProvider === "lemonsqueezy"
                          ? "border-brand bg-brand"
                          : "border-border bg-background",
                      )}
                      aria-hidden
                    >
                      {selectedProvider === "lemonsqueezy" && (
                        <span className="h-2 w-2 rounded-full bg-brand-foreground" />
                      )}
                    </span>
                  </div>

                  <div className="mt-3">
                    <p className="font-semibold text-foreground">
                      Carte internationale
                    </p>
                    <p className="mt-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-400">
                      International · Lemon Squeezy
                    </p>
                  </div>

                  <ul className="mt-3 space-y-1">
                    {["Visa / Mastercard", "Apple Pay", "Google Pay"].map(
                      (method) => (
                        <li
                          key={method}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground"
                        >
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-yellow-500" aria-hidden />
                          {method}
                        </li>
                      ),
                    )}
                  </ul>

                  {/* EUR / USD toggle */}
                  <div className="mt-4 rounded-lg bg-muted px-3 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Prix</p>
                        <p className="mt-0.5 text-lg font-black tabular-nums text-foreground">
                          {formatLemon(prices[lemonCurrency], lemonCurrency)}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {(["EUR", "USD"] as LemonCurrency[]).map((cur) => (
                          <button
                            key={cur}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setLemonCurrency(cur);
                              setSelectedProvider("lemonsqueezy");
                            }}
                            aria-pressed={lemonCurrency === cur}
                            className={cn(
                              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
                              lemonCurrency === cur
                                ? "bg-brand text-brand-foreground"
                                : "bg-background text-muted-foreground hover:bg-border",
                            )}
                          >
                            {cur}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              {/* Pay button */}
              <Button
                onClick={handlePay}
                disabled={isLoading}
                size="lg"
                className="mt-8 h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
                aria-label={payLabel}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("auth.checkout.payLoading")}
                  </>
                ) : (
                  payLabel
                )}
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/60">
                {t("auth.checkout.paymentNote")}
              </p>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="min-w-0 lg:col-span-5">
            <Card className="rounded-2xl border-border/90 p-6 shadow-md shadow-border/30 sm:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t("auth.checkout.orderSummary")}
              </h2>

              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-5">
                <span className="text-lg font-bold text-foreground">
                  {planDisplayName}
                </span>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {selectedPrice}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                  {selectedProvider === "fedapay" ? (
                    <>
                      <Smartphone className="h-3 w-3" aria-hidden />
                      FedaPay · XOF
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-3 w-3" aria-hidden />
                      Lemon Squeezy · {lemonCurrency}
                    </>
                  )}
                </span>
                <p className="text-xs text-muted-foreground">
                  {isAnnual
                    ? t("auth.checkout.annualBilling")
                    : t("auth.checkout.monthlyBilling")}
                </p>
              </div>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("auth.checkout.includedLabel")}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {features.map((feature) => (
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
                <span className="font-semibold text-foreground/80">
                  {isAnnual
                    ? t("auth.checkout.totalPerYear")
                    : t("auth.checkout.totalPerMonth")}
                </span>
                <span className="text-xl font-black tabular-nums text-foreground">
                  {selectedPrice}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted">
          <Loader2
            className="h-8 w-8 animate-spin text-brand"
            aria-label="Loading"
          />
        </div>
      }
    >
      <CheckoutForm />
    </Suspense>
  );
}
