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
      color: "from-emerald-500 to-teal-400",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
    },
    {
      icon: FileText,
      title: t("landing.features.pdfTitle"),
      description: t("landing.features.pdfDesc"),
      span: "col-span-1",
      color: "from-blue-500 to-cyan-400",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      icon: Share2,
      title: t("landing.features.whatsappTitle"),
      description: t("landing.features.whatsappDesc"),
      span: "col-span-1",
      color: "from-green-500 to-emerald-400",
      bg: "bg-green-50",
      text: "text-green-600",
    },
    {
      icon: Users,
      title: t("landing.features.clientsTitle"),
      description: t("landing.features.clientsDesc"),
      span: "col-span-1 md:col-span-2",
      color: "from-purple-500 to-indigo-400",
      bg: "bg-purple-50",
      text: "text-purple-600",
    },
    {
      icon: WifiOff,
      title: t("landing.features.offlineTitle"),
      description: t("landing.features.offlineDesc"),
      span: "col-span-1 md:col-span-1",
      color: "from-orange-500 to-rose-400",
      bg: "bg-orange-50",
      text: "text-orange-600",
    },
    {
      icon: TrendingUp,
      title: t("landing.features.trackingTitle"),
      description: t("landing.features.trackingDesc"),
      span: "col-span-1 md:col-span-2",
      color: "from-amber-500 to-yellow-400",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-slate-50 py-24 lg:py-32">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-[0.03]" />
      <div className="absolute -left-40 top-40 -z-10 h-96 w-96 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute -right-40 bottom-40 -z-10 h-96 w-96 rounded-full bg-blue-200/20 blur-3xl" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-20 text-center">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200/50 bg-emerald-50/80 px-4 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm backdrop-blur-sm">
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
              {/* Subtle gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity duration-300 group-hover:opacity-[0.03]`} />
              
              <div className="relative z-10 flex flex-1 flex-col">
                <div className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl ${feature.bg} ${feature.text} shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-7 w-7" aria-hidden />
                </div>
                
                <h3 className="mb-3 text-xl font-bold text-slate-900">
                  {feature.title}
                </h3>
                
                <p className="mt-auto leading-relaxed text-slate-500">
                  {feature.description}
                </p>
              </div>

              {/* Decorative corner blur */}
              <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${feature.color} opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
