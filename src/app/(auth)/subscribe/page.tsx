"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import {
  Mic,
  CheckCircle2,
  X,
  Loader2,
  Zap,
  ArrowRight,
  Shield,
} from "lucide-react";

interface PlanFeature {
  labelKey: string;
  free: boolean;
  pro: boolean;
}

export default function SubscribePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loadingPlan, setLoadingPlan] = useState<"free" | "pro" | null>(null);

  const FEATURES: PlanFeature[] = [
    { labelKey: "auth.subscribe.fVoiceBilling", free: true, pro: true },
    { labelKey: "auth.subscribe.fPdfExport", free: true, pro: true },
    { labelKey: "auth.subscribe.fWhatsapp", free: true, pro: true },
    { labelKey: "auth.subscribe.fOffline", free: true, pro: true },
    { labelKey: "auth.subscribe.fThreeDocs", free: true, pro: false },
    { labelKey: "auth.subscribe.fUnlimitedDocs", free: false, pro: true },
    { labelKey: "auth.subscribe.fUnlimitedClients", free: false, pro: true },
    { labelKey: "auth.subscribe.fFullHistory", free: false, pro: true },
    { labelKey: "auth.subscribe.fPrioritySupport", free: false, pro: true },
  ];

  const handleSelectFree = async () => {
    setLoadingPlan("free");
    try {
      const response = await fetch("/api/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planName: "free" }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error ?? t("auth.subscribe.activationError"));
      }

      toast.success(t("auth.subscribe.welcome"));
      router.push(data.redirect ?? "/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : t("auth.subscribe.activationError");
      toast.error(message);
      setLoadingPlan(null);
    }
  };

  const handleSelectPro = () => {
    router.push("/subscribe/checkout");
  };

  const isLoading = loadingPlan !== null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="ArtisanVoice — Accueil"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-sm">
              <Mic className="h-5 w-5 text-brand-foreground" aria-hidden />
            </div>
            <span className="text-lg font-bold text-brand">
              ArtisanVoice
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Shield className="h-4 w-4 text-primary" aria-hidden />
            {t("auth.subscribe.secureConnection")}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        {/* Page heading */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-4 py-1.5 text-sm font-semibold text-brand">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {t("auth.subscribe.stepBadge")}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("auth.subscribe.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-slate-500">
            {t("auth.subscribe.subtitle")}
          </p>
        </div>

        {/* Plan cards */}
        <div className="mx-auto grid max-w-3xl grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Free plan */}
          <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">
                {t("auth.subscribe.freeName")}
              </h2>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-slate-900">0</span>
                <span className="text-sm font-medium text-slate-500">
                  {t("common.fcfaMonth")}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-500">
                {t("auth.subscribe.freeDesc")}
              </p>
            </div>

            <ul className="mb-8 flex flex-col gap-2.5">
              {FEATURES.map((f) => (
                <li key={f.labelKey} className="flex items-center gap-2.5">
                  {f.free ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                  )}
                  <span
                    className={`text-sm ${f.free ? "text-slate-700" : "text-slate-400"}`}
                  >
                    {t(f.labelKey)}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSelectFree}
              disabled={isLoading}
              variant="outline"
              size="lg"
              className="mt-auto h-11 w-full rounded-xl border-brand font-semibold text-brand hover:bg-brand/5"
              aria-label={t("auth.subscribe.freeCta")}
            >
              {loadingPlan === "free" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.subscribe.freeLoading")}
                </>
              ) : (
                t("auth.subscribe.freeCta")
              )}
            </Button>
          </div>

          {/* Pro plan */}
          <div className="relative flex flex-col rounded-2xl bg-brand p-8 text-brand-foreground shadow-2xl shadow-brand/30">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground shadow-lg">
                {t("auth.subscribe.recommended")}
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-bold text-white">
                {t("auth.subscribe.proName")}
              </h2>
              <div className="mt-3 flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-white">5 000</span>
                <span className="text-sm font-medium text-white/70">
                  {t("common.fcfaMonth")}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/70">
                {t("auth.subscribe.proDesc")}
              </p>
            </div>

            <ul className="mb-8 flex flex-col gap-2.5">
              {FEATURES.map((f) => (
                <li key={f.labelKey} className="flex items-center gap-2.5">
                  {f.pro ? (
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                  ) : (
                    <X
                      className="h-4 w-4 shrink-0 text-white/30"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`text-sm ${f.pro ? "text-white/90" : "text-white/40"}`}
                  >
                    {t(f.labelKey)}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSelectPro}
              disabled={isLoading}
              size="lg"
              className="mt-auto h-11 w-full gap-2 rounded-xl bg-white font-semibold text-brand shadow-lg hover:bg-white/90"
              aria-label={t("auth.subscribe.proCta")}
            >
              {t("auth.subscribe.proCta")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-sm text-slate-400">
          {t("auth.subscribe.footer")}
        </p>

        {/* Feature comparison table */}
        <div className="mx-auto mt-16 max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-base font-bold text-slate-800">
              {t("auth.subscribe.comparisonTitle")}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th
                    scope="col"
                    className="px-6 py-3 text-left font-semibold text-slate-500"
                  >
                    {t("auth.subscribe.featureLabel")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center font-semibold text-slate-500"
                  >
                    {t("auth.subscribe.freeName")}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-center font-semibold text-brand"
                  >
                    {t("auth.subscribe.proName")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((f, i) => (
                  <tr
                    key={f.labelKey}
                    className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}
                  >
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {t(f.labelKey)}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {f.free ? (
                        <CheckCircle2
                          className="mx-auto h-4 w-4 text-primary"
                          aria-label="Inclus"
                        />
                      ) : (
                        <X
                          className="mx-auto h-4 w-4 text-slate-300"
                          aria-label="Non inclus"
                        />
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      {f.pro ? (
                        <CheckCircle2
                          className="mx-auto h-4 w-4 text-primary"
                          aria-label="Inclus"
                        />
                      ) : (
                        <X
                          className="mx-auto h-4 w-4 text-slate-300"
                          aria-label="Non inclus"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
