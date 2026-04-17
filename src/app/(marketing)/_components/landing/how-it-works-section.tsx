"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function HowItWorksSection() {
  const { t } = useLanguage();

  const steps = [
    {
      step: "01",
      title: t("landing.howItWorks.step1Title"),
      description: t("landing.howItWorks.step1Desc"),
    },
    {
      step: "02",
      title: t("landing.howItWorks.step2Title"),
      description: t("landing.howItWorks.step2Desc"),
    },
    {
      step: "03",
      title: t("landing.howItWorks.step3Title"),
      description: t("landing.howItWorks.step3Desc"),
    },
    {
      step: "04",
      title: t("landing.howItWorks.step4Title"),
      description: t("landing.howItWorks.step4Desc"),
    },
  ];

  return (
    <section id="demo" className="bg-white py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
            {t("landing.howItWorks.badge")}
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-500">
            {t("landing.howItWorks.subtitle")}
          </p>
        </div>

        <div className="relative">
          <div
            className="absolute top-8 right-0 left-0 hidden h-0 border-t-2 border-dashed border-slate-200 lg:block"
            aria-hidden
          />

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className="relative flex flex-col items-center text-center"
              >
                <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand text-2xl font-black text-brand-foreground shadow-lg">
                  {step.step}
                  {index < steps.length - 1 && (
                    <div
                      className="absolute -right-4 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block"
                      aria-hidden
                    >
                      →
                    </div>
                  )}
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-800">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl bg-brand px-8 text-base font-semibold text-brand-foreground shadow-md hover:bg-brand/90"
          >
            <Link href="/register">
              {t("landing.howItWorks.cta")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
