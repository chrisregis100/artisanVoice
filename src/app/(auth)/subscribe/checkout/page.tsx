"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { useCurrency } from "@/hooks/use-currency";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type PlanKey =
  | "early_bird"
  | "pro_monthly"
  | "pro_annual"
  | "business_monthly"
  | "business_annual";

type PaymentProvider = "fedapay" | "lemonsqueezy";

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

const PROVIDER_INFO: Record<
  PaymentProvider,
  { name: string; logo: string; desc: string }
> = {
  fedapay: {
    name: "FedaPay",
    logo: "FDP",
    desc: "Paiement Mobile Money & carte bancaire (Afrique de l'Ouest)",
  },
  lemonsqueezy: {
    name: "Lemon Squeezy",
    logo: "LS",
    desc: "Paiement par carte bancaire (Stripe)",
  },
};

function isValidPlanKey(value: string | null): value is PlanKey {
  return [
    "early_bird",
    "pro_monthly",
    "pro_annual",
    "business_monthly",
    "business_annual",
  ].includes(value ?? "");
}

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [callbackStatus, setCallbackStatus] = useState<
    "verifying" | "success" | "failed"
  >("verifying");

  useEffect(() => {
    const status = searchParams.get("status");
    const transactionId =
      searchParams.get("transaction_id") ||
      searchParams.get("transaction-id");

    if (status === "cancelled" || status === "failed") {
      setCallbackStatus("failed");
      toast.error(t("auth.checkout.failedToast"));
      return;
    }

    if (status === "successful" || status === "approved" || transactionId) {
      toast.loading(t("auth.checkout.verifyingToast"), { id: "verify" });

      const timer = setTimeout(() => {
        toast.dismiss("verify");
        setCallbackStatus("success");
        toast.success(t("auth.checkout.successToast"));
        router.push("/dashboard");
        router.refresh();
      }, 2500);

      return () => clearTimeout(timer);
    }

    setCallbackStatus("failed");
  }, [searchParams, router, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {callbackStatus === "verifying" && (
          <>
            <Loader2
              className="mx-auto mb-4 h-12 w-12 animate-spin text-brand"
              aria-hidden
            />
            <h2 className="text-xl font-bold text-foreground">
              {t("auth.checkout.verifyingTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.checkout.verifyingSubtitle")}
            </p>
          </>
        )}
        {callbackStatus === "success" && (
          <>
            <CheckCircle2
              className="mx-auto mb-4 h-12 w-12 text-primary"
              aria-hidden
            />
            <h2 className="text-xl font-bold text-foreground">
              {t("auth.checkout.successTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.checkout.successSubtitle")}
            </p>
          </>
        )}
        {callbackStatus === "failed" && (
          <>
            <AlertCircle
                  className="mx-auto mb-4 h-12 w-12 text-red-500 dark:text-red-400"
              aria-hidden
            />
            <h2 className="text-xl font-bold text-foreground">
              {t("auth.checkout.failedTitle")}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.checkout.failedSubtitle")}
            </p>
            <Button
              onClick={() => router.push("/subscribe/checkout")}
              className="mt-6 w-full rounded-xl bg-brand text-brand-foreground hover:bg-brand/90"
            >
              {t("auth.checkout.retryBtn")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function CheckoutForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, locale } = useLanguage();
  const { currency, formatWithSymbol } = useCurrency();
  const [isLoading, setIsLoading] = useState(false);

  const rawPlan = searchParams.get("plan");
  const planKey: PlanKey = isValidPlanKey(rawPlan) ? rawPlan : "pro_monthly";

  const provider: PaymentProvider =
    currency === "XOF" ? "fedapay" : "lemonsqueezy";

  // XOF plans use no currency suffix; EUR/USD plans append _eur / _usd
  const planName =
    currency === "XOF" ? planKey : `${planKey}_${currency.toLowerCase()}`;

  const priceFormatted = formatWithSymbol(planKey);
  const planDisplayName = PLAN_DISPLAY_NAMES[planKey];
  const features = PLAN_FEATURES[planKey];
  const isAnnual = planKey.includes("annual");
  const providerInfo = PROVIDER_INFO[provider];

  const payButtonLabel =
    locale === "en"
      ? `Pay ${priceFormatted}`
      : `Payer ${priceFormatted}`;

  const handlePay = async () => {
    setIsLoading(true);
    try {
      const body: { planName: string; provider?: PaymentProvider } = {
        planName,
      };
      if (provider === "fedapay") {
        body.provider = "fedapay";
      }

      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
        err instanceof Error ? err.message : t("auth.checkout.unexpectedError");
      toast.error(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
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
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
              aria-label={t("auth.checkout.backAria")}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.back();
              }}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              {t("auth.checkout.backBtn")}
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {t("auth.checkout.securePayment")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Payment form */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {t("auth.checkout.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("auth.checkout.subtitle")}
              </p>

              <div className="mt-8">
                <p className="mb-4 text-sm font-semibold text-foreground">
                  {t("auth.checkout.paymentMethodLabel")}
                </p>
                <div className="flex w-full min-w-0 items-start gap-3 rounded-xl border-2 border-brand bg-brand/5 p-4 ring-1 ring-brand/20">
                  <span
                    className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-brand bg-brand"
                    aria-hidden
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-foreground" />
                  </span>
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand text-[0.65rem] font-black leading-none text-brand-foreground"
                    aria-hidden
                  >
                    {providerInfo.logo}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground">
                      {providerInfo.name}
                    </div>
                    <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                      {providerInfo.desc}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handlePay}
                disabled={isLoading}
                size="lg"
                className="mt-8 h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
                aria-label={payButtonLabel}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("auth.checkout.payLoading")}
                  </>
                ) : (
                  payButtonLabel
                )}
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-muted-foreground/60">
                {t("auth.checkout.paymentNote")}
              </p>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t("auth.checkout.orderSummary")}
              </h2>

              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-5">
                <span className="text-lg font-bold text-foreground">
                  {planDisplayName}
                </span>
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {priceFormatted}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {isAnnual
                  ? t("auth.checkout.annualBilling")
                  : t("auth.checkout.monthlyBilling")}
              </p>

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
                  {priceFormatted}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();

  const isCallback =
    searchParams.get("provider") !== null &&
    (searchParams.get("transaction_id") !== null ||
      searchParams.get("status") !== null);

  if (isCallback) return <CallbackHandler />;
  return <CheckoutForm />;
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
      <CheckoutPageContent />
    </Suspense>
  );
}
