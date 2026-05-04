"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { ArrowRight, CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { HeroDashboardMockup } from "./hero-dashboard-mockup";
import { motion } from "framer-motion";

export function HeroSection() {
  const { t } = useLanguage();

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <section className="relative overflow-hidden bg-background pt-32 pb-20 lg:pt-48 lg:pb-32">
      <div className="absolute inset-x-0 top-0 -z-10 h-[1000px] overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 aspect-square w-[800px] rounded-full bg-gradient-to-tr from-primary/20 to-emerald-300/10 blur-[100px] pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-[80%] aspect-square w-[600px] rounded-full bg-gradient-to-br from-brand/10 to-transparent blur-[80px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
          }}
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={fadeUpVariant} className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur-md transition-shadow hover:shadow-md hover:shadow-primary/20 cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <Zap className="h-3.5 w-3.5" aria-hidden />
            {t("landing.hero.badge")}
          </motion.div>

          <motion.h1 
            variants={fadeUpVariant}
            className="font-display max-w-5xl text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-7xl lg:leading-[1.1]"
          >
            {t("landing.hero.titlePart1")}{" "}
            <span className="relative whitespace-nowrap text-primary">
              <svg
                aria-hidden="true"
                viewBox="0 0 418 42"
                className="absolute top-2/3 left-0 h-[0.58em] w-full fill-primary/20"
                preserveAspectRatio="none"
              >
                <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
              </svg>
              <span className="relative drop-shadow-sm">{t("landing.hero.titleHighlight")}</span>
            </span>
          </motion.h1>
          
          <motion.p variants={fadeUpVariant} className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {t("landing.hero.subtitle")}
          </motion.p>

          <motion.div variants={fadeUpVariant} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-14 gap-2 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_4px_20px_-4px_rgba(5,150,105,0.4)] transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-[0_8px_25px_-5px_rgba(5,150,105,0.5)] active:scale-95"
            >
              <Link href="/register">
                {t("landing.hero.ctaPrimary")}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-14 rounded-full border-border bg-background/50 px-8 text-base font-semibold text-foreground shadow-sm backdrop-blur-md transition-all hover:scale-105 hover:bg-muted hover:shadow-md active:scale-95"
            >
              <Link href="#demo">{t("landing.hero.ctaSecondary")}</Link>
            </Button>
          </motion.div>

          <motion.div variants={fadeUpVariant} className="mt-8 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-primary/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            </div>
            {t("landing.hero.freeNotice")}
          </motion.div>
        </motion.div>

        <HeroDashboardMockup />
      </div>
    </section>
  );
}
