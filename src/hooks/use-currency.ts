"use client";
import { useState, useEffect } from "react";

type Currency = "XOF" | "EUR" | "USD";

interface CurrencyConfig {
  code: Currency;
  symbol: string;
  position: "before" | "after";
  locale: string;
}

const CURRENCY_MAP: Record<Currency, CurrencyConfig> = {
  XOF: { code: "XOF", symbol: "FCFA", position: "after", locale: "fr-FR" },
  EUR: { code: "EUR", symbol: "€", position: "before", locale: "fr-FR" },
  USD: { code: "USD", symbol: "$", position: "before", locale: "en-US" },
};

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : undefined;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("XOF");

  useEffect(() => {
    const cookieVal = getCookie("user-currency");
    if (
      cookieVal === "XOF" ||
      cookieVal === "EUR" ||
      cookieVal === "USD"
    ) {
      setCurrency(cookieVal);
    }
  }, []);

  const config = CURRENCY_MAP[currency];

  return { currency, config };
}
