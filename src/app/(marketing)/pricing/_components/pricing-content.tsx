"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Shield, Zap, Globe, CreditCard, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

interface PackDef {
  id: string;
  slug: string;
  priceUsd: string;
  priceXof: string;
  totalCredits: number;
  bonusCredits: number;
  perInvoiceUsd: string;
  perInvoiceXof: string;
  href: string;
  isPopular: boolean;
  isFree: boolean;
}

const PACKS: PackDef[] = [
  {
    id: "free",
    slug: "free",
    priceUsd: "$0",
    priceXof: "0 FCFA",
    totalCredits: 3,
    bonusCredits: 0,
    perInvoiceUsd: "—",
    perInvoiceXof: "—",
    href: "/register",
    isPopular: false,
    isFree: true,
  },
  {
    id: "starter",
    slug: "starter",
    priceUsd: "$4",
    priceXof: "2 400 FCFA",
    totalCredits: 10,
    bonusCredits: 0,
    perInvoiceUsd: "$0.40",
    perInvoiceXof: "240 FCFA",
    href: "/credits/buy/starter",
    isPopular: false,
    isFree: false,
  },
  {
    id: "populaire",
    slug: "populaire",
    priceUsd: "$9",
    priceXof: "5 400 FCFA",
    totalCredits: 30,
    bonusCredits: 0,
    perInvoiceUsd: "$0.30",
    perInvoiceXof: "180 FCFA",
    href: "/credits/buy/populaire",
    isPopular: true,
    isFree: false,
  },
  {
    id: "pro",
    slug: "pro",
    priceUsd: "$24",
    priceXof: "14 400 FCFA",
    totalCredits: 110,
    bonusCredits: 10,
    perInvoiceUsd: "$0.22",
    perInvoiceXof: "131 FCFA",
    href: "/credits/buy/pro",
    isPopular: false,
    isFree: false,
  },
];

const TABLE_ROWS = [
  { slug: "free",      credits: "3",   priceUsd: "$0",  priceXof: "—",          perInvoice: "—",     fcfa: "—",      isPopular: false },
  { slug: "starter",   credits: "10",  priceUsd: "$4",  priceXof: "2 400 FCFA", perInvoice: "$0.40", fcfa: "2 400",  isPopular: false },
  { slug: "populaire", credits: "30",  priceUsd: "$9",  priceXof: "5 400 FCFA", perInvoice: "$0.30", fcfa: "5 400",  isPopular: true  },
  { slug: "pro",       credits: "110", priceUsd: "$24", priceXof: "14 400 FCFA",perInvoice: "$0.22", fcfa: "14 400", isPopular: false },
];

export function PricingContent() {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  const isXof = currency === "XOF";

  const getPackBadge = (slug: string): string => {
    const map: Record<string, string> = {
      free: t("pricing.free.subtitle") || "Pour découvrir",
      starter: t("pricing.starter.subtitle") || "Petits volumes",
      populaire: t("pricing.populaire.badge") || "LE PLUS POPULAIRE",
      pro: t("pricing.pro.subtitle") || "Volumes élevés",
    };
    return map[slug] ?? "";
  };

  const getPackName = (slug: string): string => {
    const map: Record<string, string> = {
      free: "Gratuit",
      starter: "Starter",
      populaire: "Populaire",
      pro: "Pro",
    };
    return map[slug] ?? slug;
  };

  const getPackDesc = (slug: string): string => {
    const map: Record<string, string> = {
      free: t("pricing.free.descShort") || "Dès que tu crées ton compte Billo, tu reçois 3 crédits. Pas de carte bancaire requise.",
      starter: t("pricing.starter.descShort") || "Tu factures occasionnellement — deux ou trois clients par mois, pas plus.",
      populaire: t("pricing.populaire.descShort") || "Le pack que choisissent la majorité des freelances qui facturent régulièrement.",
      pro: t("pricing.pro.descShort") || "Pour les consultants, agences et indépendants qui gèrent plusieurs clients simultanément.",
    };
    return map[slug] ?? "";
  };

  const universalItems = [
    {
      icon: Shield,
      title: t("pricing.universal.noExpiry.title") || "Les crédits n'expirent jamais.",
      desc: t("pricing.universal.noExpiry.desc") || "Un crédit acheté aujourd'hui est toujours valide dans 6 mois ou dans 2 ans.",
    },
    {
      icon: Zap,
      title: t("pricing.universal.stackable.title") || "Les crédits se cumulent.",
      desc: t("pricing.universal.stackable.desc") || "Tes crédits restants s'ajoutent à chaque nouvel achat. Simple.",
    },
    {
      icon: Globe,
      title: t("pricing.universal.regional.title") || "Le prix s'adapte à ta région.",
      desc: t("pricing.universal.regional.desc") || "Les packs sont affichés en devise locale avec un tarif ajusté à la parité de pouvoir d'achat.",
    },
    {
      icon: CreditCard,
      title: t("pricing.universal.noSubscription.title") || "Pas d'abonnement caché.",
      desc: t("pricing.universal.noSubscription.desc") || "Tu achètes un pack, tu utilises tes crédits, tu rachètes quand tu veux.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="bg-brand pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <span className="mb-4 inline-block rounded-full bg-brand-foreground/10 px-4 py-1.5 text-sm font-semibold text-brand-foreground/70">
            {t("pricing.badge") || "Tarifs"}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand-foreground sm:text-4xl leading-tight">
            Tu paies uniquement quand tu factures.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-brand-foreground/70">
            Pas d&apos;abonnement. Pas de renouvellement automatique. Jamais de crédits qui expirent.
          </p>
        </div>
      </section>

      {/* ── Pack cards ──────────────────────────────────────────────── */}
      <section className="bg-muted py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:items-start">
            {PACKS.map((pack) => {
              const price = isXof ? pack.priceXof : pack.priceUsd;
              const perInvoice = isXof ? pack.perInvoiceXof : pack.perInvoiceUsd;
              const creditsLine =
                pack.isFree
                  ? t("pricing.free.credits") || "3 crédits offerts à l'inscription — une seule fois"
                  : `${pack.totalCredits} crédits — ${perInvoice}/facture`;

              return (
                <div
                  key={pack.id}
                  className={cn(
                    "relative flex flex-col rounded-2xl p-7 transition-transform duration-200",
                    pack.isPopular
                      ? "border-2 border-brand bg-card shadow-2xl shadow-brand/20 lg:scale-[1.06] z-10"
                      : "border border-border bg-card shadow-sm hover:shadow-md",
                  )}
                >
                  {/* Popular badge */}
                  {pack.isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      <span className="rounded-full bg-brand px-4 py-1 text-xs font-bold text-brand-foreground">
                        {getPackBadge(pack.slug)}
                      </span>
                    </div>
                  )}

                  {/* Category badge */}
                  {!pack.isPopular && (
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {getPackBadge(pack.slug)}
                    </div>
                  )}
                  {pack.isPopular && (
                    <div className="mb-1 mt-2 text-xs font-semibold uppercase tracking-wider text-brand">
                      Pour les freelances actifs
                    </div>
                  )}

                  {/* Name + bonus chip */}
                  <div className="mt-1 flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-foreground">
                      {getPackName(pack.slug)}
                    </h2>
                    {pack.bonusCredits > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 ring-1 ring-amber-300/40 dark:ring-amber-600/40">
                        <Zap className="h-3 w-3" aria-hidden />
                        +{pack.bonusCredits} bonus
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black text-foreground">{price}</span>
                  </div>

                  {/* Credits line */}
                  <p className="mt-1 text-sm font-semibold text-muted-foreground">{creditsLine}</p>

                  <div className="my-5 h-px w-full bg-border" />

                  {/* Description */}
                  <p className="mb-5 text-sm leading-relaxed text-foreground/80 flex-1">
                    {getPackDesc(pack.slug)}
                  </p>

                  {/* CTA */}
                  {pack.isFree ? (
                    <>
                      <Button
                        asChild
                        size="sm"
                        variant="outline"
                        className="h-11 w-full rounded-xl border-brand text-brand font-semibold hover:bg-brand/5 mb-4"
                      >
                        <Link href={pack.href}>
                          {t("pricing.free.cta") || "Commencer gratuitement"}
                        </Link>
                      </Button>
                      <p className="text-center text-xs italic text-muted-foreground">
                        {t("pricing.free.footer") || "Aucune carte bancaire. Aucune date d'expiration."}
                      </p>
                    </>
                  ) : (
                    <Button
                      asChild
                      size="sm"
                      className={cn(
                        "mt-auto h-11 w-full rounded-xl font-semibold shadow-sm",
                        pack.isPopular
                          ? "bg-brand text-brand-foreground hover:bg-brand/90 shadow-brand/30"
                          : "bg-foreground text-background hover:bg-foreground/90",
                      )}
                    >
                      <Link href={pack.href}>
                        {t("pricing.cta.buy") || "Acheter"}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Universal guarantees ────────────────────────────────────── */}
      <section className="bg-background py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className="mb-12 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("pricing.universal.title") || "Ce qui s'applique à tous les packs"}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            {universalItems.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Summary table ───────────────────────────────────────────── */}
      <section className="bg-muted py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("pricing.table.title") || "Récapitulatif"}
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-foreground">
                    {t("pricing.table.pack") || "Pack"}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    {t("pricing.table.credits") || "Crédits"}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    {t("pricing.table.price") || "Prix"}
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">
                    {t("pricing.table.perInvoice") || "Prix / facture"}
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-foreground sm:table-cell">
                    {t("pricing.table.fcfa") || "FCFA approx."}
                  </th>
                </tr>
              </thead>
              <tbody>
                {TABLE_ROWS.map((row) => (
                  <tr
                    key={row.slug}
                    className={cn(
                      "border-b border-border last:border-0",
                      row.isPopular && "bg-primary/5",
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground capitalize">
                      {getPackName(row.slug)}
                      {row.isPopular && (
                        <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
                          ★
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground/80">{row.credits}</td>
                    <td className="px-4 py-3 text-center font-semibold text-foreground">
                      {isXof && row.slug !== "free" ? row.priceXof : row.priceUsd}
                    </td>
                    <td className="px-4 py-3 text-center text-foreground/80">{row.perInvoice}</td>
                    <td className="hidden px-4 py-3 text-center text-muted-foreground sm:table-cell">
                      {row.fcfa !== "—" ? `${row.fcfa} FCFA` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ teaser ──────────────────────────────────────────────── */}
      <section className="border-t border-border bg-muted py-16">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-foreground">
            {t("pricingPage.questionsTitle") || "Des questions sur nos tarifs ?"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {t("pricingPage.questionsSubtitle") || "Consultez notre FAQ ou contactez-nous directement."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              className="rounded-xl bg-brand px-6 font-semibold text-brand-foreground hover:bg-brand/90"
            >
              <Link href="/#faq">{t("pricingPage.faqBtn") || "Voir la FAQ"}</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl px-6 font-semibold">
              <Link href="mailto:contact@billo.regiskiki.me">
                {t("pricingPage.contactBtn") || "Nous contacter"}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Link href="/" className="flex items-center gap-2" aria-label="Billo - Accueil">
              <BilloLogoMark className="h-8 w-8" size={32} />
              <span className="font-bold text-brand">Billo</span>
            </Link>
            <p className="text-sm text-muted-foreground/60">
              &copy; {new Date().getFullYear()} Billo &middot;{" "}
              {t("pricingPage.footerRights") || "Tous droits réservés"}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
