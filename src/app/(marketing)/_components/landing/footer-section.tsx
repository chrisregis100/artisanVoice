"use client";

import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import Link from "next/link";

export function FooterSection() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const links = {
    [t("landing.footer.product")]: [
      { label: t("landing.footer.features"), href: "/#features" },
      { label: t("landing.footer.pricing"), href: "/#pricing" },
      { label: t("landing.footer.faq"), href: "/#faq" },
    ],
    [t("landing.footer.account")]: [
      { label: t("landing.footer.login"), href: "/login" },
      { label: t("landing.footer.register"), href: "/register" },
    ],
    [t("landing.footer.legal")]: [
      { label: t("landing.footer.legalNotice"), href: "/legal" },
      { label: t("landing.footer.privacy"), href: "/privacy" },
    ],
  };

  return (
    <footer className="border-t border-slate-100 bg-white py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="flex items-center gap-2.5"
              aria-label="Billo"
            >
              <BilloLogoMark className="h-9 w-9" size={36} />
              <span className="text-lg font-bold text-brand">
                Billo
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-500">
              {t("landing.footer.tagline")}
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {category}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-slate-500 transition-colors hover:text-slate-900"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-sm text-slate-400">
            © {currentYear} Billo · {t("landing.footer.rights")}
          </p>
          <p className="text-xs text-slate-300">{t("landing.footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
