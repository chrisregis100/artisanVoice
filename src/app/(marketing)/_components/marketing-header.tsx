"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useLanguage } from "@/i18n/context";
import { cn } from "@/lib/utils";

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#pricing", label: t("nav.pricing") },
    { href: "/#faq", label: t("nav.faq") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={t("nav.homeAria")}
        >
          <BilloLogoMark className="h-9 w-9" size={36} />
          <span className="text-lg font-bold text-brand">Billo</span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={t("nav.mainNav")}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors",
                scrolled
                  ? "text-slate-600 hover:text-slate-900"
                  : "text-slate-700 hover:text-slate-900",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher variant="ghost" />
          <Button
            variant="ghost"
            asChild
            className="text-slate-600 hover:text-slate-900"
          >
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button
            asChild
            className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
          >
            <Link href="/register">{t("nav.registerFree")}</Link>
          </Button>
        </div>

        <button
          className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white/98 backdrop-blur-md p-4 flex flex-col gap-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            <div className="flex justify-center pb-1">
              <LanguageSwitcher />
            </div>
            <Button variant="outline" asChild className="w-full">
              <Link href="/login">{t("nav.login")}</Link>
            </Button>
            <Button
              asChild
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              <Link href="/register">{t("nav.registerFree")}</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
