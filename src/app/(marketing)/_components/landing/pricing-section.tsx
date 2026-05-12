"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { usePublicPlans } from "@/hooks/use-public-plans";
import { useCurrency } from "@/hooks/use-currency";
import { CheckCircle2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";

export function PricingSection() {
  const { t } = useLanguage();
  // Keep usePublicPlans for backward compat
  const { proMonthlyAmount: _proMonthlyAmount } = usePublicPlans();
  const [isAnnual, setIsAnnual] = useState(false);
  const { formatWithSymbol } = useCurrency();

  const plans = [
    {
      id: "free",
      name: t("landing.pricing.freeName"),
      price: "0",
      priceDisplay: null as string | null,
      period: t("landing.pricing.freePeriod"),
      description: t("landing.pricing.freeDesc"),
      cta: t("landing.pricing.freeCta"),
      ctaHref: "/register",
      featured: false,
      badge: null as string | null,
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
      id: "early_bird",
      name: t("landing.pricing.earlyBirdName"),
      price: formatWithSymbol("early_bird"),
      priceDisplay: null as string | null,
      period: t("landing.pricing.earlyBirdPeriod"),
      description: t("landing.pricing.earlyBirdDesc"),
      cta: t("landing.pricing.earlyBirdCta"),
      ctaHref: "/register?plan=early_bird",
      featured: true,
      badge: t("landing.pricing.earlyBirdBadge"),
      features: [
        t("landing.pricing.earlyBirdF1"),
        t("landing.pricing.earlyBirdF2"),
        t("landing.pricing.earlyBirdF3"),
        t("landing.pricing.earlyBirdF4"),
        t("landing.pricing.earlyBirdF5"),
        t("landing.pricing.earlyBirdF6"),
      ],
      missing: [] as string[],
    },
    {
      id: "pro",
      name: t("landing.pricing.proName"),
      price: isAnnual
        ? formatWithSymbol("pro_annual")
        : formatWithSymbol("pro_monthly"),
      priceDisplay: null as string | null,
      period: isAnnual
        ? t("landing.pricing.perYear")
        : t("landing.pricing.proPeriod"),
      description: t("landing.pricing.proDesc"),
      cta: t("landing.pricing.proCta"),
      ctaHref: "/register?plan=pro",
      featured: false,
      badge: null as string | null,
      features: [
        t("landing.pricing.proF1"),
        t("landing.pricing.proF2"),
        t("landing.pricing.proF3"),
        t("landing.pricing.proF4"),
        t("landing.pricing.proF5"),
        t("landing.pricing.proF6"),
        t("landing.pricing.proF7"),
      ],
      missing: [] as string[],
    },
    {
      id: "business",
      name: t("landing.pricing.businessName"),
      price: isAnnual
        ? formatWithSymbol("business_annual")
        : formatWithSymbol("business_monthly"),
      priceDisplay: null as string | null,
      period: isAnnual
        ? t("landing.pricing.perYear")
        : t("landing.pricing.businessPeriod"),
      description: t("landing.pricing.businessDesc"),
      cta: t("landing.pricing.businessCta"),
      ctaHref: "/register?plan=business",
      featured: false,
      badge: null as string | null,
      features: [
        t("landing.pricing.businessF1"),
        t("landing.pricing.businessF2"),
        t("landing.pricing.businessF3"),
        t("landing.pricing.businessF4"),
        t("landing.pricing.businessF5"),
        t("landing.pricing.businessF6"),
        t("landing.pricing.businessF7"),
      ],
      missing: [] as string[],
    },
  ];

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-background py-24 lg:py-32"
    >
      <div className="absolute inset-0 top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none blur-3xl opacity-60" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
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
                !isAnnual
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {t("landing.pricing.monthly")}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`relative z-10 w-36 rounded-full py-2.5 text-sm font-bold transition-all duration-300 ${
                isAnnual
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground/70"
              }`}
            >
              {t("landing.pricing.annual")}
            </button>
            <div
              className={`absolute left-1.5 h-[calc(100%-12px)] w-36 rounded-full bg-background shadow-md transition-transform duration-300 ${
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

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 items-start">
          {plans.map((plan, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              key={plan.id}
              className={`relative flex flex-col rounded-[2rem] p-1 transition-all duration-500 group ${
                plan.featured
                  ? "shadow-2xl shadow-brand/20 z-10 lg:-my-4"
                  : "z-0 hover:shadow-xl hover:shadow-muted"
              }`}
            >
              {plan.featured && (
                <div className="absolute inset-0 rounded-[2rem] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(16,185,129,0.5)_0deg,transparent_60deg,transparent_300deg,rgba(16,185,129,0.5)_360deg)] animate-[spin_4s_linear_infinite]" />
              )}
              {plan.featured && (
                <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand/20 to-primary/20 blur-sm -z-10" />
              )}
              {!plan.featured && (
                <div className="absolute inset-0 rounded-[2rem] border border-border/60 transition-colors group-hover:border-border" />
              )}

              <div
                className={`relative h-full flex flex-col rounded-[1.9rem] p-6 sm:p-8 backdrop-blur-xl ${
                  plan.featured ? "bg-foreground text-background" : "bg-card/80"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
                      <StarIcon className="h-3.5 w-3.5" />
                      {t("common.recommended")}
                    </span>
                  </div>
                )}

                {plan.badge && !plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500 dark:bg-amber-500/90 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {plan.featured && plan.badge && (
                  <div className="absolute -top-4 right-4">
                    <span className="inline-flex items-center rounded-full bg-amber-500 dark:bg-amber-500/90 px-3 py-1 text-xs font-bold text-white shadow-md shadow-amber-500/20">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-5 mt-2">
                  <h3
                    className={`font-display text-xl font-bold ${plan.featured ? "" : "text-foreground"}`}
                  >
                    {plan.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                    <motion.span
                      key={plan.price}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`font-display text-4xl font-black tracking-tight ${plan.featured ? "" : "text-foreground"}`}
                    >
                      {plan.id === "free" ? "0" : plan.price}
                    </motion.span>
                    <span
                      className={`text-sm font-medium ${plan.featured ? "opacity-60" : "text-muted-foreground"}`}
                    >
                      {plan.period}
                    </span>
                  </div>
                  <p
                    className={`mt-3 text-xs leading-relaxed ${plan.featured ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    {plan.description}
                  </p>
                </div>

                <div
                  className={`mb-6 h-px w-full ${plan.featured ? "bg-background/15" : "bg-border"}`}
                />

                <ul className="mb-6 flex flex-col gap-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${plan.featured ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"}`}
                      >
                        <CheckCircle2 className="h-3 w-3" aria-hidden />
                      </div>
                      <span
                        className={`text-xs leading-relaxed font-medium ${plan.featured ? "opacity-85" : "text-foreground/80"}`}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                  {plan.missing.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-500">
                        <X className="h-3 w-3" aria-hidden />
                      </div>
                      <span className="text-xs leading-relaxed font-medium text-foreground/60 line-through decoration-red-400/50 dark:decoration-red-600/50">
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  size="sm"
                  className={`mt-auto h-11 w-full rounded-xl font-bold text-sm transition-all active:scale-95 ${
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
