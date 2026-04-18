"use client";

import { useLanguage } from "@/i18n/context";

export function SocialProofSection() {
  const { t } = useLanguage();

  const stats = [
    { value: "1 200+", label: t("landing.socialProof.activeArtisans") },
    { value: "18 000+", label: t("landing.socialProof.docsCreated") },
    { value: "< 30 s", label: t("landing.socialProof.perInvoice") },
    { value: "4.8 / 5", label: t("landing.socialProof.avgRating") },
  ];

  return (
    <section
      id="social-proof"
      className="border-b border-border bg-background py-12"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="mb-10 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground/60">
          {t("landing.socialProof.trust")}
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span className="text-3xl font-extrabold text-foreground">
                {stat.value}
              </span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
