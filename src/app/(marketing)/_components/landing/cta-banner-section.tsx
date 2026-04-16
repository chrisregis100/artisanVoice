"use client";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { ArrowRight, Mic } from "lucide-react";
import Link from "next/link";

export function CtaBannerSection() {
  const { t } = useLanguage();

  return (
    <section className="bg-slate-950 py-20">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
        <div className="mb-5 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Mic className="h-7 w-7 text-white" aria-hidden />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">
          {t("landing.cta.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button
            asChild
            size="lg"
            className="h-12 gap-2 rounded-xl bg-white px-8 text-base font-semibold text-slate-900 shadow-lg hover:bg-slate-100"
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
            className="h-12 rounded-xl border-white/20 bg-transparent px-8 text-base font-semibold text-white hover:bg-white/10"
          >
            <Link href="/login">{t("landing.cta.login")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
