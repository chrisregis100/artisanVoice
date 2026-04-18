"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type PaymentProvider = "flutterwave" | "fedapay";

interface ProviderOption {
  id: PaymentProvider;
  name: string;
  descKey: string;
  logo: string;
}

const PROVIDERS: ProviderOption[] = [
  {
    id: "flutterwave",
    name: "Flutterwave",
    descKey: "auth.checkout.flutterwaveDesc",
    logo: "FLW",
  },
  {
    id: "fedapay",
    name: "FedaPay",
    descKey: "auth.checkout.fedapayDesc",
    logo: "FDP",
  },
];

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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {callbackStatus === "verifying" && (
          <>
            <Loader2
              className="mx-auto mb-4 h-12 w-12 animate-spin text-brand"
              aria-hidden
            />
            <h2 className="text-xl font-bold text-slate-900">
              {t("auth.checkout.verifyingTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
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
            <h2 className="text-xl font-bold text-slate-900">
              {t("auth.checkout.successTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth.checkout.successSubtitle")}
            </p>
          </>
        )}
        {callbackStatus === "failed" && (
          <>
            <AlertCircle
              className="mx-auto mb-4 h-12 w-12 text-red-500"
              aria-hidden
            />
            <h2 className="text-xl font-bold text-slate-900">
              {t("auth.checkout.failedTitle")}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
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
  const { t } = useLanguage();
  const [selectedProvider, setSelectedProvider] =
    useState<PaymentProvider | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const proFeatures = [
    t("auth.checkout.pf1"),
    t("auth.checkout.pf2"),
    t("auth.checkout.pf3"),
    t("auth.checkout.pf4"),
    t("auth.checkout.pf5"),
  ];

  const handlePay = async () => {
    if (!selectedProvider) {
      toast.error(t("auth.checkout.noPaymentSelected"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: "pro", provider: selectedProvider }),
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
    <div className="min-h-screen bg-gradient-to-b from-slate-100/80 to-slate-50">
      <header className="border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Billo — Accueil"
            >
              <BilloLogoMark className="h-9 w-9" size={36} />
              <span className="text-lg font-bold text-brand">
                Billo
              </span>
            </Link>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-brand"
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
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {t("auth.checkout.securePayment")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: Payment form — min-w-0 évite le débordement grid qui chevauche la colonne suivante */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/50 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {t("auth.checkout.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {t("auth.checkout.subtitle")}
              </p>

              <fieldset className="mt-8">
                <legend className="mb-4 text-sm font-semibold text-slate-800">
                  {t("auth.checkout.paymentMethodLabel")}
                </legend>
                <div className="flex flex-col gap-3">
                  {PROVIDERS.map((provider) => {
                    const isSelected = selectedProvider === provider.id;
                    return (
                      <button
                        key={provider.id}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setSelectedProvider(provider.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ")
                            setSelectedProvider(provider.id);
                        }}
                        tabIndex={0}
                        className={`flex w-full min-w-0 items-start gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-brand bg-brand/5 ring-1 ring-brand/20"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/80"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-brand bg-brand"
                              : "border-slate-300 bg-white"
                          }`}
                          aria-hidden
                        >
                          {isSelected ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-white" />
                          ) : null}
                        </span>
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[0.65rem] font-black leading-none ${
                            isSelected
                              ? "bg-brand text-brand-foreground"
                              : "bg-slate-100 text-slate-600"
                          }`}
                          aria-hidden
                        >
                          {provider.logo}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900">
                            {provider.name}
                          </div>
                          <div className="mt-0.5 text-xs leading-snug text-slate-500">
                            {t(provider.descKey)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <Button
                onClick={handlePay}
                disabled={isLoading || !selectedProvider}
                size="lg"
                className="mt-8 h-12 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-60"
                aria-label={t("auth.checkout.payBtn")}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("auth.checkout.payLoading")}
                  </>
                ) : (
                  t("auth.checkout.payBtn")
                )}
              </Button>

              <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
                {t("auth.checkout.paymentNote")}
              </p>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="min-w-0 lg:col-span-5">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-md shadow-slate-200/50 sm:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {t("auth.checkout.orderSummary")}
              </h2>

              <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-5">
                <span className="text-lg font-bold text-slate-900">
                  {t("auth.checkout.proPlan")}
                </span>
                <span className="text-lg font-bold tabular-nums text-slate-900">
                  5 000 FCFA
                </span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {t("auth.checkout.monthlyBilling")}
              </p>

              <div className="mt-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t("auth.checkout.includedLabel")}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {proFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2.5 text-sm leading-snug text-slate-700"
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

              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-4 py-3">
                <span className="font-semibold text-slate-700">
                  {t("auth.checkout.totalPerMonth")}
                </span>
                <span className="text-xl font-black tabular-nums text-slate-900">
                  5 000 FCFA
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
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
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
