"use client";

import { useEffect, useRef } from "react";
import { useSettingsStore } from "@/stores/settings-store";

interface DbSettings {
  business_name: string;
  phone: string;
  business_address: string;
  quote_prefix: string;
  invoice_prefix: string;
  vat_rate_percent: number;
  legal_mentions: string;
  currency: string;
  openai_api_key: string;
}

interface SettingsInitializerProps {
  settings: DbSettings;
}

export function SettingsInitializer({ settings }: SettingsInitializerProps) {
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    updateSettings({
      businessName: settings.business_name,
      businessPhone: settings.phone,
      businessAddress: settings.business_address,
      quotePrefix: settings.quote_prefix,
      invoicePrefix: settings.invoice_prefix,
      vatRatePercent: settings.vat_rate_percent,
      legalMentions: settings.legal_mentions,
      currency: settings.currency as "XOF" | "EUR" | "USD",
      openaiApiKey: settings.openai_api_key,
    });
  }, [settings, updateSettings]);

  return null;
}
