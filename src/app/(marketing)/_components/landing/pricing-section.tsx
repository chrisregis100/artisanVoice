"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { usePublicPlans } from "@/hooks/use-public-plans";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

export function PricingSection() {
  const { t, locale } = useLanguage();
  const { proMonthlyAmount } = usePublicPlans();
  const [isAnnual, setIsAnnual] = useState(false);

  const { monthlyStr, annualStr } = useMemo(() => {
    const loc = locale === "en" ? "en-US" : "fr-FR";
    const monthly = proMonthlyAmount.toLocaleString(loc);
    const annual = Math.round(proMonthlyAmount * 0.8).toLocaleString(loc);
    return { monthlyStr: monthly, annualStr: annual };
  }, [locale, proMonthlyAmount]);

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
      price: isAnnual ? annualStr : monthlyStr,
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
    <section id="pricing" className="relative overflow-hidden bg-background py-24 lg:py-32">
      <div className="absolute inset-0 top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none blur-3xl opacity-60" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-4 py-1.5 text-sm font-semibold text-brand shadow-sm">
            {t("landing.pricing.badge")}
          </span>
          <h2 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t("landing.pricing.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            {t("landing.pricing.subtitle")}
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-16 flex justify-center"
        >
          <div className="relative flex items-center rounded-full bg-muted p-1.5 shadow-inner">
            <button
              onClick={() => setIsAnnual(false)}
              className={`relative z-10 w-36 rounded-full py-2.5 text-sm font-bold transition-all duration-300 ${
                !isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 w-36 rounded-full py-2.5 text-sm font-bold transition-all duration-300 ${
                isAnnual ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {t("landing.pricing.annual")}
            </button>
            <div
              className={`absolute left-1.5 h-[calc(100%-12px)] w-36 rounded-full bg-background shadow-md transition-transform duration-300 cubic-bezier(0.34, 1.56, 0.64, 1) ${
                isAnnual ? "translate-x-36" : "translate-x-0"
              }`}
            />
            <motion.div 
               animate={isAnnual ? { scale: [1, 1.1, 1] } : { scale: 1 }}
               className="absolute -right-6 -top-4 z-20 rotate-12 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground shadow-lg shadow-primary/30"
            >
              {t("landing.pricing.annualDiscount")}
            </motion.div>
          </div>
        </motion.div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2 items-center">
          {plans.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.2 }}
              key={plan.name}
              className={`relative flex flex-col rounded-[2.5rem] p-1 transition-all duration-500 group ${
                plan.featured ? "md:-my-6 shadow-2xl shadow-brand/20 z-10" : "z-0 hover:shadow-xl hover:shadow-muted"
              }`}
            >
              {plan.featured && (
                <div className="absolute inset-0 rounded-[2.5rem] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(16,185,129,0.5)_0deg,transparent_60deg,transparent_300deg,rgba(16,185,129,0.5)_360deg)] animate-[spin_4s_linear_infinite]" />
              )}
              {plan.featured && (
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-brand/20 to-primary/20 blur-sm -z-10" />
              )}
              {!plan.featured && (
                <div className="absolute inset-0 rounded-[2.5rem] border border-border/60 transition-colors group-hover:border-border" />
              )}

              <div className={`relative h-full flex flex-col rounded-[2.4rem] p-8 sm:p-10 backdrop-blur-xl ${
                plan.featured ? "bg-foreground text-background" : "bg-card/80"
              }`}>
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
                      <StarIcon className="h-3.5 w-3.5" />
                      {t("common.recommended")}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`font-display text-2xl font-bold ${plan.featured ? "" : "text-foreground"}`}>
                    {plan.name}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <motion.span
                      key={plan.price}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-display text-6xl font-black tracking-tight ${plan.featured ? "" : "text-foreground"}`}
                    >
                      {plan.price}
                    </motion.span>
                    <span className={`text-base font-medium ${plan.featured ? "opacity-60" : "text-muted-foreground"}`}>
                      {plan.period}
                    </span>
                  </div>
                  <p className={`mt-4 text-sm leading-relaxed ${plan.featured ? "opacity-70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                </div>

                <div className={`mb-8 h-px w-full ${plan.featured ? "bg-background/15" : "bg-border"}`} />

                <ul className="mb-8 flex flex-col gap-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${plan.featured ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      </div>
                      <span className={`text-sm leading-relaxed font-medium ${plan.featured ? "opacity-85" : "text-foreground/80"}`}>
                        {f}
                      </span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-3 opacity-60">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </div>
                      <span className="text-sm leading-relaxed font-medium text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="lg"
                  className={`mt-auto h-14 w-full rounded-2xl font-bold text-base transition-all active:scale-95 ${
                    plan.featured
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]"
                      : "bg-foreground text-background hover:bg-foreground/90 shadow-md"
                  }`}
                >
                  <Link href={plan.ctaHref}>{plan.cta}</Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 text-center text-sm font-medium text-muted-foreground"
        >
          {t("landing.pricing.footer")}
        </motion.p>
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
