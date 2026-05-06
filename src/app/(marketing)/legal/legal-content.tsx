"use client";

import { useLanguage } from "@/i18n/context";

export function LegalContent() {
  const { t } = useLanguage();

  const sections = [
    { title: t("legal.s1Title"), body: t("legal.s1Body") },
    { title: t("legal.s2Title"), body: t("legal.s2Body") },
    { title: t("legal.s3Title"), body: t("legal.s3Body") },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">
        {t("legal.title")}
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">{t("legal.updated")}</p>
      <div className="mt-10 space-y-10">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold">{s.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {s.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
