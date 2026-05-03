"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { defaultLocale, locales, type Locale } from "./config";
import fr from "./messages/fr.json";
import en from "./messages/en.json";

const messages: Record<Locale, Record<string, unknown>> = { fr, en };

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

function getInitialLocale(): Locale {
  const cookie = getCookie("locale");
  if (cookie && locales.includes(cookie as Locale)) return cookie as Locale;
  return defaultLocale;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Always initialize with defaultLocale so server and client render identically.
  // Cookie-based locale is applied after mount to avoid hydration mismatch.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const saved = getCookie("locale");
    if (saved && locales.includes(saved as Locale)) {
      setLocaleState(saved as Locale);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setCookie("locale", newLocale);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string>): string => {
      const msgs = messages[locale];
      let result = getNestedValue(msgs, key);
      if (result === key && locale !== defaultLocale) {
        result = getNestedValue(messages[defaultLocale], key);
      }
      if (vars) {
        result = result.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);
      }
      return result;
    },
    [locale],
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
