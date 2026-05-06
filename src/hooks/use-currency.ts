"use client";
import { useState, useEffect, useCallback } from "react";

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

// XOF: actual amount, EUR/USD: cents
const PRICES: Record<string, Record<Currency, number>> = {
  early_bird: { XOF: 2500, EUR: 450, USD: 450 },
  pro_monthly: { XOF: 5000, EUR: 900, USD: 900 },
  pro_annual: { XOF: 50000, EUR: 9000, USD: 9000 },
  business_monthly: { XOF: 10000, EUR: 1900, USD: 1900 },
  business_annual: { XOF: 100000, EUR: 19000, USD: 19000 },
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

  const formatPrice = useCallback(
    (planKey: string): string => {
      const priceData = PRICES[planKey];
      if (!priceData) return "0";

      const rawAmount = priceData[currency];
      const displayAmount = currency === "XOF" ? rawAmount : rawAmount / 100;

      if (currency === "XOF") {
        return displayAmount.toLocaleString("fr-FR");
      }
      return displayAmount % 1 === 0
        ? displayAmount.toLocaleString(config.locale)
        : displayAmount.toLocaleString(config.locale, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
    },
    [currency, config.locale],
  );

  const formatWithSymbol = useCallback(
    (planKey: string): string => {
      const formatted = formatPrice(planKey);
      if (config.position === "before") return `${config.symbol}${formatted}`;
      return `${formatted} ${config.symbol}`;
    },
    [formatPrice, config],
  );

  return { currency, config, formatPrice, formatWithSymbol, PRICES };
}
