"use client";

import { useLanguage } from "@/i18n/context";
import {
  FileText,
  Mic,
  Share2,
  TrendingUp,
  Users,
  WifiOff,
} from "lucide-react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Mic,
      title: t("landing.features.voiceTitle"),
      description: t("landing.features.voiceDesc"),
      span: "col-span-1 md:col-span-2",
    },
    {
      icon: FileText,
      title: t("landing.features.pdfTitle"),
      description: t("landing.features.pdfDesc"),
      span: "col-span-1",
    },
    {
      icon: Share2,
      title: t("landing.features.whatsappTitle"),
      description: t("landing.features.whatsappDesc"),
      span: "col-span-1",
    },
    {
      icon: Users,
      title: t("landing.features.clientsTitle"),
      description: t("landing.features.clientsDesc"),
      span: "col-span-1 md:col-span-2",
    },
    {
      icon: WifiOff,
      title: t("landing.features.offlineTitle"),
      description: t("landing.features.offlineDesc"),
      span: "col-span-1 md:col-span-1",
    },
    {
      icon: TrendingUp,
      title: t("landing.features.trackingTitle"),
      description: t("landing.features.trackingDesc"),
      span: "col-span-1 md:col-span-2",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-slate-50 py-24 lg:py-32">
      <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />
      <div className="absolute -left-40 top-40 -z-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute -right-40 bottom-40 -z-10 h-96 w-96 rounded-full bg-brand/5 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm">
            {t("landing.features.badge")}
          </span>
          <h2 className="mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative flex flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 ${feature.span}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div className="relative z-10 flex flex-1 flex-col">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <feature.icon className="h-7 w-7" aria-hidden />
                </div>

                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>

                <p className="mt-auto leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>

              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
