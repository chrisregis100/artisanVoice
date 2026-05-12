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
  Palette,
  Globe,
  Download,
} from "lucide-react";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { usePublicPlans } from "@/hooks/use-public-plans";
import { useCurrency } from "@/hooks/use-currency";
import { useState } from "react";

interface PlanFeature {
  labelKey: string;
  free: boolean | string;
  earlyBird: boolean | string;
  pro: boolean | string;
  business: boolean | string;
  icon: React.ComponentType<{ className?: string }>;
}

export function PricingContent() {
  const { t } = useLanguage();
  // Keep usePublicPlans for backward compat
  const { proMonthlyAmount: _proMonthlyAmount } = usePublicPlans();
  const { formatWithSymbol } = useCurrency();
  const [isAnnual, setIsAnnual] = useState(false);

  const planFeatures: PlanFeature[] = [
    {
      labelKey: "pricingPage.docsPerMonth",
      free: "3",
      earlyBird: t("pricingPage.unlimited"),
      pro: t("pricingPage.unlimited"),
      business: t("pricingPage.unlimited"),
      icon: FileText,
    },
    {
      labelKey: "pricingPage.voiceBilling",
      free: true,
      earlyBird: true,
      pro: true,
      business: true,
      icon: Mic,
    },
    {
      labelKey: "pricingPage.pdfExport",
      free: true,
      earlyBird: true,
      pro: true,
      business: true,
      icon: FileText,
    },
    {
      labelKey: "pricingPage.whatsapp",
      free: true,
      earlyBird: true,
      pro: true,
      business: true,
      icon: Share2,
    },
    {
      labelKey: "pricingPage.offline",
      free: true,
      earlyBird: true,
      pro: true,
      business: true,
      icon: WifiOff,
    },
    {
      labelKey: "pricingPage.clientManagement",
      free: t("pricingPage.oneClient"),
      earlyBird: t("pricingPage.unlimited"),
      pro: t("pricingPage.unlimited"),
      business: t("pricingPage.unlimited"),
      icon: Users,
    },
    {
      labelKey: "pricingPage.history",
      free: t("pricingPage.sevenDays"),
      earlyBird: t("pricingPage.unlimited"),
      pro: t("pricingPage.unlimited"),
      business: t("pricingPage.unlimited"),
      icon: Clock,
    },
    {
      labelKey: "pricingPage.businessProfiles",
      free: "1",
      earlyBird: "3",
      pro: "3",
      business: t("pricingPage.unlimited"),
      icon: Shield,
    },
    {
      labelKey: "pricingPage.prioritySupport",
      free: false,
      earlyBird: false,
      pro: true,
      business: true,
      icon: Headphones,
    },
    {
      labelKey: "pricingPage.customBranding",
      free: false,
      earlyBird: false,
      pro: false,
      business: true,
      icon: Palette,
    },
    {
      labelKey: "pricingPage.multiCurrency",
      free: false,
      earlyBird: false,
      pro: false,
      business: true,
      icon: Globe,
    },
    {
      labelKey: "pricingPage.csvExport",
      free: false,
      earlyBird: false,
      pro: false,
      business: true,
      icon: Download,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-brand pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-4 inline-block rounded-full bg-brand-foreground/10 px-4 py-1.5 text-sm font-semibold text-brand-foreground/70">
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
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          {/* Monthly / Annual toggle */}
          <div className="mb-10 flex justify-center">
            <div className="relative flex items-center rounded-full bg-background p-1.5 shadow-inner border border-border">
              <button
                onClick={() => setIsAnnual(false)}
                className={`relative z-10 w-32 rounded-full py-2 text-sm font-bold transition-all duration-300 ${
                  !isAnnual
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`relative z-10 w-32 rounded-full py-2 text-sm font-bold transition-all duration-300 ${
                  isAnnual
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                Annuel
              </button>
              <div
                className={`absolute left-1.5 h-[calc(100%-12px)] w-32 rounded-full bg-muted shadow-md transition-transform duration-300 ${
                  isAnnual ? "translate-x-32" : "translate-x-0"
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Free plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  {t("pricingPage.freeName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-foreground">0</span>
                  <span className="text-sm font-medium text-muted-foreground">
                    / mois
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("pricingPage.freeDesc")}
                </p>
              </div>

              <Button
                asChild
                size="sm"
                variant="outline"
                className="mb-6 h-10 w-full rounded-xl border-brand text-brand font-semibold hover:bg-brand/5"
              >
                <Link href="/register">{t("pricingPage.freeCta")}</Link>
              </Button>

              <ul className="flex flex-col gap-2.5">
                {[
                  t("pricingPage.freeF1"),
                  t("pricingPage.freeF2"),
                  t("pricingPage.freeF3"),
                  t("pricingPage.freeF4"),
                  t("pricingPage.freeF5"),
                  t("pricingPage.freeF6"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Early Bird plan */}
            <div className="relative flex flex-col rounded-2xl bg-foreground p-6 shadow-2xl shadow-brand/20 ring-2 ring-brand/40">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2">
                <span className="rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  {t("common.recommended")}
                </span>
                <span className="rounded-full bg-amber-500 dark:bg-amber-500/90 px-3 py-1 text-xs font-bold text-white">
                  {t("pricingPage.earlyBirdBadge")}
                </span>
              </div>

              <div className="mb-5 mt-2">
                <h2 className="text-lg font-bold text-background">
                  {t("pricingPage.earlyBirdName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-background">
                    {formatWithSymbol("early_bird")}
                  </span>
                  <span className="text-xs font-medium text-background/60">
                    {t("pricingPage.earlyBirdPeriod")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-background/60">
                  {t("pricingPage.earlyBirdDesc")}
                </p>
              </div>

              <Button
                asChild
                size="sm"
                className="mb-6 h-10 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 shadow-primary/30"
              >
                <Link href="/register?plan=early_bird">
                  {t("pricingPage.earlyBirdCta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <ul className="flex flex-col gap-2.5">
                {[
                  t("pricingPage.earlyBirdF1"),
                  t("pricingPage.earlyBirdF2"),
                  t("pricingPage.earlyBirdF3"),
                  t("pricingPage.earlyBirdF4"),
                  t("pricingPage.earlyBirdF5"),
                  t("pricingPage.earlyBirdF6"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-xs text-background/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pro plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  {t("pricingPage.proName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-foreground">
                    {isAnnual
                      ? formatWithSymbol("pro_annual")
                      : formatWithSymbol("pro_monthly")}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {isAnnual
                      ? t("pricingPage.proPeriod").replace("mois", "an")
                      : t("pricingPage.proPeriod")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("pricingPage.proDesc")}
                </p>
              </div>

              <Button
                asChild
                size="sm"
                className="mb-6 h-10 w-full rounded-xl bg-foreground font-semibold text-background shadow-sm hover:bg-foreground/90"
              >
                <Link href="/register?plan=pro">
                  {t("pricingPage.proCta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <ul className="flex flex-col gap-2.5">
                {[
                  t("pricingPage.proF1"),
                  t("pricingPage.proF2"),
                  t("pricingPage.proF3"),
                  t("pricingPage.proF4"),
                  t("pricingPage.proF5"),
                  t("pricingPage.proF6"),
                  t("pricingPage.proF7"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Business plan */}
            <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-foreground">
                  {t("pricingPage.businessName")}
                </h2>
                <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-foreground">
                    {isAnnual
                      ? formatWithSymbol("business_annual")
                      : formatWithSymbol("business_monthly")}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    {isAnnual
                      ? t("pricingPage.businessPeriod").replace("mois", "an")
                      : t("pricingPage.businessPeriod")}
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("pricingPage.businessDesc")}
                </p>
              </div>

              <Button
                asChild
                size="sm"
                className="mb-6 h-10 w-full rounded-xl bg-foreground font-semibold text-background shadow-sm hover:bg-foreground/90"
              >
                <Link href="/register?plan=business">
                  {t("pricingPage.businessCta")}
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <ul className="flex flex-col gap-2.5">
                {[
                  t("pricingPage.businessF1"),
                  t("pricingPage.businessF2"),
                  t("pricingPage.businessF3"),
                  t("pricingPage.businessF4"),
                  t("pricingPage.businessF5"),
                  t("pricingPage.businessF6"),
                  t("pricingPage.businessF7"),
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2.5">
                    <CheckCircle2
                      className="h-4 w-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-xs text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground/60">
            {t("pricingPage.footer")}
          </p>
        </div>
      </section>

      {/* Comparison table */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="mb-10 text-center text-2xl font-extrabold text-foreground">
            {t("pricingPage.comparison")}
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-4 text-left font-semibold text-muted-foreground">
                    {t("pricingPage.featureLabel")}
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                    {t("pricingPage.freeName")}
                  </th>
                  <th className="bg-brand/10 px-4 py-4 text-center font-semibold text-foreground">
                    {t("pricingPage.earlyBirdName")}
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                    {t("pricingPage.proName")}
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-muted-foreground">
                    {t("pricingPage.businessName")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {planFeatures.map((feature, index) => (
                  <tr
                    key={feature.labelKey}
                    className={`border-b border-border/60 ${index % 2 === 0 ? "bg-card" : "bg-muted/30"}`}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <feature.icon
                          className="h-4 w-4 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="font-medium text-foreground/80">
                          {t(feature.labelKey)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.free}
                        notIncluded={t("pricingPage.notIncluded")}
                        included={t("pricingPage.included")}
                      />
                    </td>
                    <td className="bg-brand/5 px-4 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.earlyBird}
                        isHighlighted
                        notIncluded={t("pricingPage.notIncluded")}
                        included={t("pricingPage.included")}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.pro}
                        notIncluded={t("pricingPage.notIncluded")}
                        included={t("pricingPage.included")}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <ComparisonCell
                        value={feature.business}
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

function ComparisonCell({
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
      className={`font-semibold ${isHighlighted ? "text-foreground" : "text-foreground/80"}`}
    >
      {value}
    </span>
  );
}
