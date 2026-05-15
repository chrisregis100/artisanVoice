"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { useCurrency } from "@/hooks/use-currency";
import { CheckCircle2, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CreditPack {
  id: string;
  slug: string;
  displayName: string;
  creditsAmount: number;
  bonusCredits: number;
  priceUsdCents: number;
  priceXof: number;
  isActive: boolean;
  sortOrder: number;
}

function formatXof(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const FALLBACK_PACKS: CreditPack[] = [
  {
    id: "fallback-starter",
    slug: "starter",
    displayName: "Starter",
    creditsAmount: 10,
    bonusCredits: 0,
    priceUsdCents: 400,
    priceXof: 2400,
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "fallback-populaire",
    slug: "populaire",
    displayName: "Populaire",
    creditsAmount: 30,
    bonusCredits: 0,
    priceUsdCents: 900,
    priceXof: 5400,
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "fallback-pro",
    slug: "pro",
    displayName: "Pro",
    creditsAmount: 100,
    bonusCredits: 10,
    priceUsdCents: 2400,
    priceXof: 14400,
    isActive: true,
    sortOrder: 3,
  },
];

export function PricingSection() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPacks = async () => {
      try {
        const res = await fetch("/api/credits/packs");
        if (!res.ok) throw new Error("fetch failed");
        const data: { packs: CreditPack[] } = await res.json();
        if (data.packs.length === 0) {
          setPacks(FALLBACK_PACKS);
        } else {
          setPacks(data.packs);
        }
      } catch {
        setPacks(FALLBACK_PACKS);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchPacks();
  }, []);

  const formatPackPrice = (pack: CreditPack): string => {
    if (currency === "XOF") return formatXof(pack.priceXof);
    return formatUsd(pack.priceUsdCents);
  };

  const formatPricePerInvoice = (pack: CreditPack): string => {
    const totalCredits = pack.creditsAmount + pack.bonusCredits;
    if (currency === "XOF") {
      const perCredit = Math.round(pack.priceXof / totalCredits);
      return `${perCredit.toLocaleString("fr-FR")} FCFA / facture`;
    }
    const perCreditUsd = pack.priceUsdCents / 100 / totalCredits;
    return `$${perCreditUsd.toFixed(2)} / facture`;
  };

  const isPopular = (pack: CreditPack) => pack.slug === "populaire";
  const isPro = (pack: CreditPack) => pack.slug === "pro";

  const getPackDescShort = (slug: string): string => {
    const map: Record<string, string> = {
      starter: t("pricing.starter.descShort"),
      populaire: t("pricing.populaire.descShort"),
      pro: t("pricing.pro.descShort"),
    };
    return map[slug] ?? "";
  };

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const reassurances = [
    {
      title: t("pricing.universal.noExpiry.title"),
      desc: t("pricing.universal.noExpiry.desc"),
    },
    {
      title: t("pricing.universal.stackable.title"),
      desc: t("pricing.universal.stackable.desc"),
    },
    {
      title: t("pricing.universal.regional.title"),
      desc: t("pricing.universal.regional.desc"),
    },
    {
      title: t("pricing.universal.noSubscription.title"),
      desc: t("pricing.universal.noSubscription.desc"),
    },
  ];

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-background py-24 lg:py-32"
    >
      <div className="absolute inset-0 top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[500px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand/10 via-transparent to-transparent pointer-events-none blur-3xl opacity-60" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-muted px-4 py-1.5 text-sm font-semibold text-brand shadow-sm">
            {t("pricing.badge")}
          </span>
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
            {t("pricing.hero.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm text-muted-foreground md:text-base lg:text-lg">
            {t("pricing.hero.subtitle")}
          </p>
        </motion.div>

        {/* Cards grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch"
        >
          {/* Free card */}
          <motion.div
            variants={cardVariants}
            className="relative flex flex-col rounded-[2rem] p-1 group z-0 hover:shadow-xl hover:shadow-muted transition-all duration-500 h-full"
          >
            <div className="absolute inset-0 rounded-[2rem] border border-border/60 transition-colors group-hover:border-border" />
            <div className="relative h-full flex flex-col rounded-[1.9rem] p-7 sm:p-9 bg-card/80 backdrop-blur-xl text-center items-center">
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("pricing.free.subtitle")}
              </div>
              <h3 className="font-display mt-1 text-lg font-bold text-foreground md:text-xl">
                {t("pricing.free.name")}
              </h3>
              <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                <span className="font-display text-3xl font-black tracking-tight text-foreground md:text-4xl">
                  $0
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-muted-foreground">
                {t("pricing.free.credits")}
              </p>

              <div className="my-5 h-px w-full bg-border" />

              <p className="mb-5 text-sm leading-relaxed text-foreground/80">
                {t("pricing.free.descShort")}
              </p>

              <Button
                asChild
                size="sm"
                className="mt-auto h-12 w-full rounded-xl font-bold text-sm transition-all active:scale-95 bg-foreground text-background hover:bg-foreground/90 shadow-md"
              >
                <Link href="/register">{t("pricing.free.cta")}</Link>
              </Button>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                {t("pricing.free.footer")}
              </p>
            </div>
          </motion.div>

          {/* Dynamic pack cards — skeleton while loading */}
          {isLoading
            ? [1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  variants={cardVariants}
                  className="relative flex flex-col rounded-[2rem] p-1 h-full"
                >
                  <div className="absolute inset-0 rounded-[2rem] border border-border/60" />
                  <div className="relative h-full flex flex-col rounded-[1.9rem] p-6 sm:p-8 bg-card/80 animate-pulse text-center items-center">
                    <div className="h-3 w-24 rounded bg-muted mb-2" />
                    <div className="h-5 w-28 rounded bg-muted mb-3" />
                    <div className="h-10 w-32 rounded bg-muted mb-2" />
                    <div className="h-3 w-40 rounded bg-muted mb-6" />
                    <div className="h-px w-full bg-muted mb-4" />
                    <div className="h-8 w-full rounded bg-muted mb-4" />
                    <div className="h-11 w-full rounded-xl bg-muted" />
                  </div>
                </motion.div>
              ))
            : packs.map((pack) => {
                const popular = isPopular(pack);
                const pro = isPro(pack);
                const totalCredits = pack.creditsAmount + pack.bonusCredits;

                return (
                  <motion.div
                    key={pack.id}
                    variants={cardVariants}
                    className={cn(
                      "relative flex flex-col rounded-[2rem] p-1 transition-all duration-500 group h-full",
                      popular
                        ? "shadow-2xl shadow-brand/20 z-10 ring-2 ring-primary/50"
                        : "z-0 hover:shadow-xl hover:shadow-muted",
                    )}
                  >
                    {popular && (
                      <div className="absolute inset-0 rounded-[2rem] bg-[conic-gradient(from_0deg_at_50%_50%,rgba(16,185,129,0.5)_0deg,transparent_60deg,transparent_300deg,rgba(16,185,129,0.5)_360deg)] animate-[spin_4s_linear_infinite]" />
                    )}
                    {popular && (
                      <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-brand/20 to-primary/20 blur-sm -z-10" />
                    )}
                    {!popular && (
                      <div className="absolute inset-0 rounded-[2rem] border border-border/60 transition-colors group-hover:border-border" />
                    )}

                    <div
                      className={cn(
                        "relative h-full flex flex-col rounded-[1.9rem] p-7 sm:p-9 backdrop-blur-xl text-center items-center",
                        popular ? "bg-foreground text-background" : "bg-card/80",
                      )}
                    >
                      {popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-foreground shadow-lg shadow-primary/30">
                            <StarIcon className="h-3.5 w-3.5" />
                            {t("pricing.populaire.badge")}
                          </span>
                        </div>
                      )}

                      <div
                        className={cn(
                          "mb-1 text-xs font-semibold uppercase tracking-wider",
                          popular ? "opacity-60" : "text-muted-foreground",
                        )}
                      >
                        {pro
                          ? t("pricing.pro.subtitle")
                          : pack.slug === "starter"
                            ? t("pricing.starter.subtitle")
                            : t("pricing.populaire.subtitle")}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        <h3
                          className={cn(
                            "font-display text-lg font-bold md:text-xl",
                            popular ? "" : "text-foreground",
                          )}
                        >
                          {pack.displayName}
                        </h3>
                        {pro && pack.bonusCredits > 0 && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300/40 dark:ring-amber-600/40">
                            <Zap className="h-3 w-3" aria-hidden />
                            +{pack.bonusCredits} {t("landing.pricing.bonus")}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
                        <motion.span
                          key={formatPackPrice(pack)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            "font-display text-3xl font-black tracking-tight md:text-4xl",
                            popular ? "" : "text-foreground",
                          )}
                        >
                          {formatPackPrice(pack)}
                        </motion.span>
                      </div>

                      <p
                        className={cn(
                          "mt-1 text-sm font-semibold",
                          popular ? "opacity-60" : "text-muted-foreground",
                        )}
                      >
                        {totalCredits} {t("landing.pricing.credits")} ·{" "}
                        {formatPricePerInvoice(pack)}
                      </p>

                      <div
                        className={cn(
                          "my-5 h-px w-full",
                          popular ? "bg-background/15" : "bg-border",
                        )}
                      />

                      <p
                        className={cn(
                          "mb-5 text-sm leading-relaxed",
                          popular ? "opacity-80" : "text-foreground/80",
                        )}
                      >
                        {getPackDescShort(pack.slug)}
                      </p>

                      <Button
                        asChild
                        size="sm"
                        className={cn(
                          "mt-auto h-12 w-full rounded-xl font-bold text-sm transition-all active:scale-95",
                          popular
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_-3px_rgba(16,185,129,0.5)]"
                            : "bg-foreground text-background hover:bg-foreground/90 shadow-md",
                        )}
                      >
                        <Link href={`/credits/buy/${pack.slug}`}>
                          {t("landing.pricing.buy")}
                          <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                        </Link>
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
        </motion.div>

        {/* Reassurances */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {reassurances.map(({ title, desc }) => (
            <div key={title} className="flex items-start gap-2.5">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* View full details link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 text-center"
        >
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:text-brand/80 transition-colors underline-offset-4 hover:underline"
          >
            {t("pricing.cta.viewDetails")}
          </Link>
        </motion.div>
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
