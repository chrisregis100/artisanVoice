"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { ArrowRight, Mic } from "lucide-react";
import Link from "next/link";

export function CtaBannerSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-brand py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-foreground/10">
            <Mic className="h-7 w-7 text-brand-foreground" aria-hidden />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-brand-foreground sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-brand-foreground/60">
          {t("landing.cta.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl bg-brand-foreground px-8 text-base font-semibold text-brand shadow-lg hover:bg-brand-foreground/90"
          >
            <Link href="/register">
              {t("landing.cta.createAccount")}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-brand-foreground/20 bg-transparent px-8 text-base font-semibold text-brand-foreground hover:bg-brand-foreground/10"
          >
            <Link href="/login">{t("landing.cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
