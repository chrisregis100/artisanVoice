"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PricingSection() {
  const { t } = useLanguage();
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: t("landing.pricing.freeName"),
      price: "0",
      period: t("landing.pricing.freePeriod"),
      description: t("landing.pricing.freeDesc"),
      cta: t("landing.pricing.freeCta"),
      ctaHref: "/register",
      featured: false,
      features: [
        t("landing.pricing.freeF1"),
        t("landing.pricing.freeF2"),
        t("landing.pricing.freeF3"),
        t("landing.pricing.freeF4"),
        t("landing.pricing.freeF5"),
        t("landing.pricing.freeF6"),
      ],
      missing: [
        t("landing.pricing.missingF1"),
        t("landing.pricing.missingF2"),
        t("landing.pricing.missingF3"),
      ],
    },
    {
      name: t("landing.pricing.proName"),
      price: isAnnual ? "4 000" : "5 000",
      period: t("landing.pricing.proPeriod"),
      description: t("landing.pricing.proDesc"),
      cta: t("landing.pricing.proCta"),
      ctaHref: "/register?plan=pro",
      featured: true,
      features: [
        t("landing.pricing.proF1"),
        t("landing.pricing.proF2"),
        t("landing.pricing.proF3"),
        t("landing.pricing.proF4"),
        t("landing.pricing.proF5"),
        t("landing.pricing.proF6"),
        t("landing.pricing.proF7"),
        t("landing.pricing.proF8"),
      ],
      missing: [] as string[],
    },
  ];

  return (
    <section id="pricing" className="relative overflow-hidden bg-slate-50 py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/5 via-slate-50 to-slate-50 pointer-events-none" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <div className="mb-12 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-4 py-1.5 text-sm font-semibold text-brand shadow-sm">
            {t("landing.pricing.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="mb-16 flex justify-center">
          <div className="relative flex items-center rounded-full bg-slate-200/80 p-1 backdrop-blur-sm shadow-inner">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 w-32 rounded-full py-2 text-sm font-semibold transition-all duration-300 ${
                !isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 w-32 rounded-full py-2 text-sm font-semibold transition-all duration-300 ${
                isAnnual ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t("landing.pricing.annual")}
            </button>
            <div
              className={`absolute left-1 top-1 h-[calc(100%-8px)] w-32 rounded-full bg-white shadow-sm transition-transform duration-300 ease-in-out ${
                isAnnual ? "translate-x-32" : "translate-x-0"
              }`}
            />
            {isAnnual && (
              <span className="absolute -right-8 -top-3 z-20 rotate-12 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow-sm">
                {t("landing.pricing.annualDiscount")}
              </span>
            )}
          </div>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2 items-center">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl p-8 transition-all duration-300 ${
                plan.featured
                  ? "bg-brand text-white shadow-2xl shadow-brand/20 md:-my-4 md:py-12 ring-1 ring-brand/80"
                  : "border border-slate-200 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-200/50 hover:shadow-xl hover:border-slate-300"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-primary-foreground shadow-md shadow-primary/30">
                    <StarIcon className="h-3 w-3" />
                    {t("common.recommended")}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3
                  className={`text-xl font-bold ${plan.featured ? "text-white" : "text-slate-800"}`}
                >
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-2">
                  <span
                    className={`text-5xl font-black tracking-tight ${plan.featured ? "text-white" : "text-slate-900"}`}
                  >
                    {plan.price}
                  </span>
                  <span
                    className={`text-sm font-medium ${plan.featured ? "text-white/60" : "text-slate-500"}`}
                  >
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`mt-3 text-sm leading-relaxed ${plan.featured ? "text-white/70" : "text-slate-600"}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className={`mb-8 h-px w-full ${plan.featured ? "bg-white/15" : "bg-slate-100"}`} />

              <ul className="mb-8 flex flex-col gap-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      className={`mt-0.5 h-5 w-5 shrink-0 ${plan.featured ? "text-primary/80" : "text-primary"}`}
                      aria-hidden
                    />
                    <span
                      className={`text-sm leading-tight ${plan.featured ? "text-white/90" : "text-slate-700"}`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
                {plan.missing.map((f) => (
                  <li key={f} className="flex items-start gap-3 opacity-50 grayscale">
                    <X
                      className="mt-0.5 h-5 w-5 shrink-0 text-slate-400"
                      aria-hidden
                    />
                    <span className="text-sm leading-tight text-slate-500">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className={`mt-auto h-12 w-full rounded-xl font-bold text-base transition-all ${
                  plan.featured
                    ? "bg-white text-brand shadow-md hover:bg-white/90 hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-brand text-brand-foreground hover:bg-brand/90 hover:shadow-md"
                }`}
              >
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm font-medium text-slate-500">
          {t("landing.pricing.footer")}
        </p>
      </div>
    </section>
  );
}

function StarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  );
}
