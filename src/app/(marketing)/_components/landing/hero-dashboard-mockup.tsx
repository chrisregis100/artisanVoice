"use client";

import { useLanguage } from "@/i18n/context";
import { FileText, Mic, TrendingUp, Users } from "lucide-react";
import { motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import React from "react";

export function HeroDashboardMockup() {
  const { t } = useLanguage();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useMotionValue(0), { damping: 30, stiffness: 100 });
  const rotateY = useSpring(useMotionValue(0), { damping: 30, stiffness: 100 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;

    rotateX.set(-y / 40);
    rotateY.set(x / 40);
  }

  function handleMouseLeave() {
    rotateX.set(0);
    rotateY.set(0);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100, rotateX: 15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.3, type: "spring", bounce: 0.2 }}
      className="relative mx-auto mt-20 max-w-5xl [perspective:2000px]"
    >
      {/* Glow orb derrière le mockup pour un rendu premium SaaS */}
      <div
        className="absolute -inset-10 rounded-[3rem] bg-gradient-to-r from-primary/30 via-emerald-400/20 to-brand/30 opacity-70 blur-3xl"
        aria-hidden="true"
      />

      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/60 shadow-[0_0_80px_-20px_rgba(5,150,105,0.3)] backdrop-blur-2xl"
      >
        <div className="flex items-center gap-2 border-b border-white/40 bg-white/40 px-4 py-3 backdrop-blur-md">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-amber-400 shadow-sm" />
            <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm" />
          </div>
          <div className="mx-auto flex h-6 w-full max-w-md items-center justify-center rounded-md bg-white/60 text-[10px] font-medium text-slate-500 shadow-sm">
            app.artisanvoice.com
          </div>
        </div>

        <div className="flex h-[500px] bg-slate-50/40">
          <div className="hidden w-64 flex-col gap-6 border-r border-white/50 bg-white/40 p-6 sm:flex backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand shadow-md shadow-brand/20">
                <Mic className="h-4 w-4 text-brand-foreground" />
              </div>
              <span className="font-display font-bold text-slate-900 tracking-tight">ArtisanVoice</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary shadow-sm ring-1 ring-primary/20">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("landing.hero.mockupDashboard")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white/60 lg:hover:shadow-sm">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("landing.hero.mockupInvoices")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 transition-colors hover:bg-white/60 lg:hover:shadow-sm">
                <Users className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("landing.hero.mockupClients")}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  {t("landing.hero.mockupGreeting")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("landing.hero.mockupSummary")}
                </p>
              </div>
              <div className="flex cursor-pointer items-center gap-2 rounded-full ring-1 ring-primary/20 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/30 transition-transform hover:scale-105 active:scale-95">
                <Mic className="h-4 w-4" />
                {t("landing.hero.mockupCreateVoice")}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupRevenue")}
                </span>
                <span className="font-display text-2xl font-bold text-slate-900">
                  {t("landing.hero.mockupRevenueValue")}
                </span>
                <span className="text-xs font-medium text-emerald-600">
                  {t("landing.hero.mockupRevenueChange")}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupPending")}
                </span>
                <span className="font-display text-2xl font-bold text-slate-900">3</span>
                <span className="text-xs font-medium text-amber-600">
                  {t("landing.hero.mockupPendingAction")}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md transition-shadow hover:shadow-md">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupNewClients")}
                </span>
                <span className="font-display text-2xl font-bold text-slate-900">12</span>
                <span className="text-xs font-medium text-emerald-600">
                  {t("landing.hero.mockupNewClientsChange")}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-white/60 bg-white/70 p-5 shadow-sm backdrop-blur-md">
              <span className="text-sm font-medium text-slate-900">
                {t("landing.hero.mockupRecentInvoices")}
              </span>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between rounded-xl border border-white bg-slate-50/50 p-3 transition-colors hover:bg-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">
                          {t("landing.hero.mockupInvoiceLabel")} #2024-{100 + i}
                        </span>
                        <span className="text-xs text-slate-500">
                          {t("landing.hero.mockupClientLabel")} {i}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {15000 * i} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
