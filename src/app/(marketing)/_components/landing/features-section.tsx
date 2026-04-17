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
import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import React, { MouseEvent } from "react";

export function FeaturesSection() {
  const { t } = useLanguage();

  const features = [
    {
      icon: Mic,
      title: t("landing.features.voiceTitle"),
      description: t("landing.features.voiceDesc"),
      span: "md:col-span-2 md:row-span-2",
      gradient: "from-emerald-500/10 to-teal-400/5",
    },
    {
      icon: FileText,
      title: t("landing.features.pdfTitle"),
      description: t("landing.features.pdfDesc"),
      span: "md:col-span-1",
      gradient: "from-brand/10 to-transparent",
    },
    {
      icon: Share2,
      title: t("landing.features.whatsappTitle"),
      description: t("landing.features.whatsappDesc"),
      span: "md:col-span-1",
      gradient: "from-green-500/10 to-transparent",
    },
    {
      icon: Users,
      title: t("landing.features.clientsTitle"),
      description: t("landing.features.clientsDesc"),
      span: "md:col-span-1",
      gradient: "from-blue-500/10 to-transparent",
    },
    {
      icon: WifiOff,
      title: t("landing.features.offlineTitle"),
      description: t("landing.features.offlineDesc"),
      span: "md:col-span-1",
      gradient: "from-slate-500/10 to-transparent",
    },
    {
      icon: TrendingUp,
      title: t("landing.features.trackingTitle"),
      description: t("landing.features.trackingDesc"),
      span: "md:col-span-2",
      gradient: "from-emerald-600/10 to-brand/5",
    },
  ];

  return (
    <section id="features" className="relative overflow-hidden bg-white py-24 lg:py-32">
      {/* Background subtil */}
      <div className="absolute inset-x-0 top-1/2 -z-10 h-[600px] -translate-y-1/2 w-full bg-slate-50/50" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur-sm">
            {t("landing.features.badge")}
          </span>
          <h2 className="font-display mx-auto max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
            {t("landing.features.subtitle")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:auto-rows-[220px]">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
    const { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onMouseMove={handleMouseMove}
      className={`group relative flex flex-col overflow-hidden rounded-[2rem] border border-slate-200/50 bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 ${feature.span}`}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(16, 185, 129, 0.08),
              transparent 80%
            )
          `,
        }}
      />
      
      {/* Decorative gradient statique */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity group-hover:opacity-100 ${feature.gradient}`} />

      <div className="relative z-10 flex flex-1 flex-col">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)] ring-1 ring-slate-100 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)]">
          <feature.icon className="h-7 w-7" aria-hidden />
        </div>

        <h3 className="font-display mb-3 text-2xl font-bold text-slate-900 tracking-tight">
          {feature.title}
        </h3>

        <p className="mt-auto leading-relaxed text-slate-500">
          {feature.description}
        </p>
      </div>
    </motion.div>
  );
}
