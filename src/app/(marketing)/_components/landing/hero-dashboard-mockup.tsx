"use client";

import { useLanguage } from "@/i18n/context";
import { FileText, Mic, TrendingUp, Users } from "lucide-react";

export function HeroDashboardMockup() {
  const { t } = useLanguage();

  return (
    <div className="relative mx-auto mt-20 max-w-5xl">
      <div
        className="absolute -inset-0.5 rounded-[2.5rem] bg-gradient-to-b from-primary/20 to-slate-100/20 opacity-75 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/80 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-2 border-b border-slate-200/60 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-amber-400" />
            <div className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <div className="mx-auto flex h-6 w-full max-w-md items-center justify-center rounded-md bg-white/60 text-[10px] font-medium text-slate-400 shadow-sm">
            app.artisanvoice.com
          </div>
        </div>

        <div className="flex h-[500px] bg-slate-50/50">
          <div className="hidden w-64 flex-col gap-6 border-r border-slate-200/60 bg-white/60 p-6 sm:flex">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
                <Mic className="h-4 w-4 text-brand-foreground" />
              </div>
              <span className="font-bold text-slate-900">ArtisanVoice</span>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-primary">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("landing.hero.mockupDashboard")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
                <FileText className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {t("landing.hero.mockupInvoices")}
                </span>
              </div>
              <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-600 hover:bg-slate-100">
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
                <h2 className="text-xl font-bold text-slate-900">
                  {t("landing.hero.mockupGreeting")}
                </h2>
                <p className="text-sm text-slate-500">
                  {t("landing.hero.mockupSummary")}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm">
                <Mic className="h-4 w-4" />
                {t("landing.hero.mockupCreateVoice")}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupRevenue")}
                </span>
                <span className="text-2xl font-bold text-slate-900">
                  {t("landing.hero.mockupRevenueValue")}
                </span>
                <span className="text-xs font-medium text-primary">
                  {t("landing.hero.mockupRevenueChange")}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupPending")}
                </span>
                <span className="text-2xl font-bold text-slate-900">3</span>
                <span className="text-xs font-medium text-amber-600">
                  {t("landing.hero.mockupPendingAction")}
                </span>
              </div>
              <div className="flex flex-col gap-2 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
                <span className="text-sm font-medium text-slate-500">
                  {t("landing.hero.mockupNewClients")}
                </span>
                <span className="text-2xl font-bold text-slate-900">12</span>
                <span className="text-xs font-medium text-primary">
                  {t("landing.hero.mockupNewClientsChange")}
                </span>
              </div>
            </div>

            <div className="mt-6 flex h-48 flex-col gap-4 rounded-xl border border-slate-200/60 bg-white p-5 shadow-sm">
              <span className="text-sm font-medium text-slate-900">
                {t("landing.hero.mockupRecentInvoices")}
              </span>
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
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
      </div>
    </div>
  );
}
