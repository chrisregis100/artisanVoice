"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  ArrowRight,
  Mic,
  FileText,
  Share2,
  WifiOff,
  Users,
  Clock,
  Shield,
  Headphones,
} from "lucide-react";
import { useLanguage } from "@/i18n/context";

interface PlanFeature {
  labelKey: string;
  free: boolean | string;
  pro: boolean | string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PricingContent() {
  const { t } = useLanguage();

  const planFeatures: PlanFeature[] = [
    {
      labelKey: "pricingPage.docsPerMonth",
      free: "3",
      pro: t("pricingPage.unlimited"),
      icon: FileText,
    },
    { labelKey: "pricingPage.voiceBilling", free: true, pro: true, icon: Mic },
    {
      labelKey: "pricingPage.pdfExport",
      free: true,
      pro: true,
      icon: FileText,
    },
    {
      labelKey: "pricingPage.whatsapp",
      free: true,
      pro: true,
      icon: Share2,
    },
    {
      labelKey: "pricingPage.offline",
      free: true,
      pro: true,
      icon: WifiOff,
    },
    {
      labelKey: "pricingPage.clientManagement",
      free: t("pricingPage.oneClient"),
      pro: t("pricingPage.unlimited"),
      icon: Users,
    },
    {
      labelKey: "pricingPage.history",
      free: t("pricingPage.sevenDays"),
      pro: t("pricingPage.unlimited"),
      icon: Clock,
    },
    {
      labelKey: "pricingPage.businessProfiles",
      free: "1",
      pro: "3",
      icon: Shield,
    },
    {
      labelKey: "pricingPage.prioritySupport",
      free: false,
      pro: true,
      icon: Headphones,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-brand-foreground/70">
            {t("pricingPage.badge")}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-brand-foreground sm:text-5xl">
            {t("pricingPage.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-brand-foreground/60">
            {t("pricingPage.subtitle")}
          </p>
        </div>
      </section>

      {/* Plans */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:gap-8">
            {/* Free plan */}
            <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                  {t("pricingPage.freeName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-slate-900">0</span>
                  <span className="text-base font-medium text-slate-500">
                    FCFA / {t("common.perMonth").replace("/ ", "")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {t("pricingPage.freeDesc")}
                </p>
              </div>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="mb-8 h-11 w-full rounded-xl border-brand text-brand font-semibold hover:bg-brand/5"
              >
                <Link href="/register">{t("pricingPage.freeCta")}</Link>
              </Button>

              <ul className="flex flex-col gap-3">
                {planFeatures.map((feature) => {
                  const isMissing = feature.free === false;
                  const isText =
                    typeof feature.free === "string" &&
                    feature.free !== "true" &&
                    feature.free !== "false";

                  return (
                    <li
                      key={feature.labelKey}
                      className={`flex items-center gap-3 ${isMissing ? "opacity-40" : ""}`}
                    >
                      {isMissing ? (
                        <div className="h-4 w-4 shrink-0 rounded-full border-2 border-slate-300" />
                      ) : (
                        <CheckCircle2
                          className="h-4 w-4 shrink-0 text-primary"
                          aria-hidden
                        />
                      )}
                      <span className="text-sm text-slate-700">
                        {t(feature.labelKey)}
                        {isText && (
                          <span className="ml-1 text-xs font-semibold text-slate-500">
                            ({feature.free})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Pro plan */}
            <div className="relative flex flex-col rounded-2xl bg-brand p-8 shadow-xl">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-primary px-5 py-1 text-xs font-bold text-primary-foreground">
                  {t("pricingPage.recommended")}
                </span>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {t("pricingPage.proName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white">5 000</span>
                  <span className="text-base font-medium text-white/70">
                    {t("common.fcfaMonth")}
                  </span>
                </div>
                <p className="mt-2 text-sm text-white/70">
                  {t("pricingPage.proDesc")}
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="mb-8 h-11 w-full rounded-xl bg-white font-semibold text-brand shadow-sm hover:bg-white/90"
              >
                <Link href="/register?plan=pro">
                  {t("pricingPage.proCta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <ul className="flex flex-col gap-3">
                {planFeatures.map((feature) => {
                  const isText =
                    typeof feature.pro === "string" &&
                    feature.pro !== "true" &&
                    feature.pro !== "false";

                  return (
                    <li key={feature.labelKey} className="flex items-center gap-3">
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <span className="text-sm text-white/90">
                        {t(feature.labelKey)}
                        {isText && (
                          <span className="ml-1 text-xs font-semibold text-white/60">
                            ({feature.pro})
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-slate-400">
            {t("pricingPage.footer")}
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-slate-900">
            {t("pricingPage.comparison")}
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-600">
                    {t("pricingPage.featureLabel")}
                  </th>
                  <th className="px-6 py-4 text-center font-semibold text-slate-600">
                    {t("pricingPage.freeName")}
                  </th>
                  <th className="bg-slate-100 px-6 py-4 text-center font-semibold text-slate-900">
                    {t("pricingPage.proName")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, index) => (
                  <tr
                    key={feature.labelKey}
                    className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <feature.icon
                          className="h-4 w-4 text-slate-400"
                          aria-hidden
                        />
                        <span className="font-medium text-slate-700">
                          {t(feature.labelKey)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.free}
                        notIncluded={t("pricingPage.notIncluded")}
                        included={t("pricingPage.included")}
                      />
                    </td>
                    <td className="bg-slate-50 px-6 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.pro}
                        isPro
                        notIncluded={t("pricingPage.notIncluded")}
                        included={t("pricingPage.included")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ teaser */}
      <section className="border-t border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {t("pricingPage.questionsTitle")}
          </h2>
          <p className="mt-3 text-slate-500">
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
              <Link href="mailto:contact@artisanvoice.app">
                {t("pricingPage.contactBtn")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link
              href="/"
              className="flex items-center gap-2"
              aria-label="ArtisanVoice - Accueil"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Mic className="h-4 w-4 text-brand-foreground" aria-hidden />
              </div>
              <span className="font-bold text-brand">ArtisanVoice</span>
            </Link>
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} ArtisanVoice ·{" "}
              {t("pricingPage.footerRights")}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ComparisonCell({
  value,
  isPro = false,
  notIncluded,
  included,
}: {
  value: boolean | string;
  isPro?: boolean;
  notIncluded: string;
  included: string;
}) {
  if (value === false)
    return (
      <span className="text-slate-300" aria-label={notIncluded}>
        —
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
      className={`font-semibold ${isPro ? "text-slate-900" : "text-slate-700"}`}
    >
      {value}
    </span>
  );
}
