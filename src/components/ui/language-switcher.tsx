"use client";

import { useLanguage } from "@/i18n/context";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "default" | "ghost" | "minimal";
}

const LANG_LABELS: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

const LANG_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
};

export function LanguageSwitcher({
  className,
  variant = "default",
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();

  const nextLocale: Locale = locale === "fr" ? "en" : "fr";

  const handleToggle = () => {
    setLocale(nextLocale);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted",
          className,
        )}
        aria-label={`Switch language to ${LANG_LABELS[nextLocale]}`}
        tabIndex={0}
        title={`Switch to ${nextLocale === "fr" ? "Français" : "English"}`}
      >
        <span aria-hidden>{LANG_FLAGS[locale]}</span>
        <span>{LANG_LABELS[locale]}</span>
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-brand hover:bg-muted",
          className,
        )}
        aria-label={`Switch language to ${LANG_LABELS[nextLocale]}`}
        tabIndex={0}
      >
        <span aria-hidden>{LANG_FLAGS[locale]}</span>
        <span>{LANG_LABELS[locale]}</span>
      </button>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-background p-0.5 shadow-sm",
        className,
      )}
      role="group"
      aria-label="Language selector"
    >
      {(["fr", "en"] as Locale[]).map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLocale(lang)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setLocale(lang);
            }
          }}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-all",
            locale === lang
              ? "bg-brand text-brand-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-pressed={locale === lang}
          aria-label={lang === "fr" ? "Français" : "English"}
          tabIndex={0}
        >
          <span aria-hidden>{LANG_FLAGS[lang]}</span>
          <span>{LANG_LABELS[lang]}</span>
        </button>
      ))}
    </div>
  );
}
