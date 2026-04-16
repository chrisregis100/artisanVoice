"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import {
  Mic,
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
              className="mx-auto mb-4 h-12 w-12 animate-spin text-[#2e3165]"
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
              className="mx-auto mb-4 h-12 w-12 text-emerald-500"
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
              className="mt-6 w-full rounded-xl bg-[#2e3165] text-white hover:bg-[#1f2144]"
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="ArtisanVoice — Accueil"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2e3165] shadow-sm">
              <Mic className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="text-lg font-bold text-[#2e3165]">
              ArtisanVoice
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="h-4 w-4 text-emerald-500" aria-hidden />
            {t("auth.checkout.securePayment")}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-slate-700"
          aria-label={t("auth.checkout.backAria")}
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && router.back()}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("auth.checkout.backBtn")}
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
          {/* Left: Payment form */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h1 className="mb-1 text-xl font-bold text-slate-900">
                {t("auth.checkout.title")}
              </h1>
              <p className="mb-6 text-sm text-slate-500">
                {t("auth.checkout.subtitle")}
              </p>

              <fieldset>
                <legend className="mb-3 text-sm font-semibold text-slate-700">
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
                        className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                          isSelected
                            ? "border-[#2e3165] bg-[#2e3165]/5"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                            isSelected
                              ? "bg-[#2e3165] text-white"
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
                          <div className="truncate text-xs text-slate-500">
                            {t(provider.descKey)}
                          </div>
                        </div>
                        <div
                          className={`h-4 w-4 shrink-0 rounded-full border-2 transition-colors ${
                            isSelected
                              ? "border-[#2e3165] bg-[#2e3165]"
                              : "border-slate-300"
                          }`}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <Button
                onClick={handlePay}
                disabled={isLoading || !selectedProvider}
                size="lg"
                className="mt-6 h-12 w-full gap-2 rounded-xl bg-emerald-500 font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 disabled:opacity-60"
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

              <p className="mt-4 text-center text-xs text-slate-400">
                {t("auth.checkout.paymentNote")}
              </p>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
                {t("auth.checkout.orderSummary")}
              </h2>

              <div className="mb-4 flex items-baseline justify-between">
                <span className="text-lg font-bold text-slate-900">
                  {t("auth.checkout.proPlan")}
                </span>
                <span className="text-lg font-bold text-slate-900">
                  5 000 FCFA
                </span>
              </div>
              <p className="mb-5 text-xs text-slate-500">
                {t("auth.checkout.monthlyBilling")}
              </p>

              <div className="border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t("auth.checkout.includedLabel")}
                </p>
                <ul className="flex flex-col gap-2">
                  {proFeatures.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-700"
                    >
                      <CheckCircle2
                        className="h-3.5 w-3.5 shrink-0 text-emerald-500"
                        aria-hidden
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="font-semibold text-slate-700">
                  {t("auth.checkout.totalPerMonth")}
                </span>
                <span className="text-xl font-black text-slate-900">
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
            className="h-8 w-8 animate-spin text-[#2e3165]"
            aria-label="Chargement"
          />
        </div>
      }
    >
      <CheckoutPageContent />
    </Suspense>
  );
}
