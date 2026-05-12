"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, CreditCard, HelpCircle, LogIn, MicOff } from "lucide-react";
import { BilloLogo } from "@/components/brand/billo-logo";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/i18n/context";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* Background gradients — matches hero pattern */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[1000px] overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 aspect-square w-[800px] rounded-full bg-gradient-to-tr from-primary/20 to-emerald-300/10 blur-[100px]" />
        <div className="absolute left-1/4 top-20 aspect-square w-[500px] -translate-x-1/4 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-[80px]" />
      </div>

      {/* Mini header */}
      <header className="flex items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" aria-label={t("nav.homeAria")}>
          <BilloLogo />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher variant="ghost" />
        </div>
      </header>

      {/* Main content */}
      <main className="relative flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-8 text-center">
        {/* Giant 404 — decorative backdrop */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden"
        >
          <span className="font-display text-[clamp(8rem,22vw,18rem)] font-black leading-none text-primary/[0.07] dark:text-primary/10">
            404
          </span>
        </span>

        {/* Foreground content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 flex flex-col items-center"
        >
          {/* Animated icon */}
          <motion.div
            variants={{
              hidden: { opacity: 0, scale: 0.7 },
              visible: {
                opacity: 1,
                scale: 1,
                transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
              },
            }}
            className="mb-7"
          >
            <div
              className={cn(
                "relative flex h-20 w-20 items-center justify-center rounded-2xl",
                "bg-primary/10 ring-1 ring-primary/20",
              )}
            >
              <MicOff
                className="h-9 w-9 text-primary"
                aria-hidden
                strokeWidth={1.5}
              />
              {/* Warning badge */}
              <span
                aria-hidden
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[9px] font-bold leading-none text-amber-950 ring-2 ring-background"
              >
                !
              </span>
            </div>
          </motion.div>

          {/* Heading + description */}
          <motion.div variants={fadeUp} className="max-w-sm space-y-3">
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {t("notFound.title")}
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              {t("notFound.description")}
            </p>
          </motion.div>

          {/* Primary + secondary CTA */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button
              asChild
              size="lg"
              className="h-12 gap-2 rounded-full px-8 text-sm font-semibold shadow-[0_4px_20px_-4px_rgba(5,150,105,0.4)] transition-all hover:scale-105 hover:shadow-[0_8px_25px_-5px_rgba(5,150,105,0.5)] active:scale-95"
            >
              <Link href="/">
                <Home className="h-4 w-4" aria-hidden />
                {t("notFound.primaryCta")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 gap-2 rounded-full px-8 text-sm font-semibold"
            >
              <Link href="/pricing">
                <CreditCard className="h-4 w-4" aria-hidden />
                {t("notFound.secondaryCta")}
              </Link>
            </Button>
          </motion.div>

          {/* Suggested navigation links */}
          <motion.div variants={fadeUp} className="mt-12">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t("notFound.suggestionsTitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href="/pricing"
                tabIndex={0}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                {t("notFound.suggestions.pricing")}
              </Link>
              <Link
                href="/#faq"
                tabIndex={0}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                {t("notFound.suggestions.faq")}
              </Link>
              <Link
                href="/login"
                tabIndex={0}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden />
                {t("notFound.suggestions.login")}
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-center gap-2 px-6 py-4 text-center text-xs text-muted-foreground/60">
        <span>© 2026 Billo</span>
        <span aria-hidden>·</span>
        <Link
          href="/"
          className="transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("notFound.backToHome")}
        </Link>
      </footer>
    </div>
  );
}
