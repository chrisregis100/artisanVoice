"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { useLanguage } from "@/i18n/context";
import { updateUserSettings } from "./actions";
import { Building2, Check, ChevronDown, FileText, Loader2 } from "lucide-react";
import { useState } from "react";

const currencies = [
  { value: "XOF" as const, label: "FCFA (XOF)" },
  { value: "EUR" as const, label: "Euro (EUR)" },
  { value: "USD" as const, label: "Dollar (USD)" },
];

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { t } = useLanguage();
  const {
    businessName,
    businessPhone,
    businessAddress,
    quotePrefix,
    invoicePrefix,
    vatRatePercent,
    legalMentions,
    currency,
    updateSettings,
  } = useSettingsStore();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings({
        business_name: businessName,
        phone: businessPhone,
        business_address: businessAddress,
        quote_prefix: quotePrefix,
        invoice_prefix: invoicePrefix,
        vat_rate_percent: vatRatePercent,
        legal_mentions: legalMentions,
        currency: currency,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-muted/20">
      <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-8 pb-16 md:px-8 lg:py-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
            {t("dashboard.settings.sectionLabel")}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {t("dashboard.settings.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("dashboard.settings.subtitle")}
          </p>
        </div>

        {/* Section 1: Business Info */}
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-foreground" />
              <CardTitle className="text-xl font-semibold tracking-tight">
                {t("dashboard.settings.businessInfoTitle")}
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground mt-2">
              {t("dashboard.settings.businessInfoDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="businessName">
                {t("dashboard.settings.businessNameLabel")}
              </Label>
              <Input
                id="businessName"
                placeholder="Ex: Menuiserie Kossi"
                value={businessName}
                onChange={(e) =>
                  updateSettings({ businessName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessPhone">
                {t("dashboard.settings.phoneLabel")}
              </Label>
              <Input
                id="businessPhone"
                type="tel"
                placeholder="Ex: +229 97 00 00 00"
                value={businessPhone}
                onChange={(e) =>
                  updateSettings({ businessPhone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessAddress">
                {t("dashboard.settings.addressLabel")}
              </Label>
              <textarea
                id="businessAddress"
                placeholder="Ex: Quartier Zongo, Cotonou, Bénin"
                value={businessAddress}
                onChange={(e) =>
                  updateSettings({ businessAddress: e.target.value })
                }
                rows={2}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none",
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Invoice Customization */}
        <Card className="rounded-xl border shadow-sm">
          <CardHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-foreground" />
              <CardTitle className="text-xl font-semibold tracking-tight">
                {t("dashboard.settings.invoiceCustomTitle")}
              </CardTitle>
            </div>
            <CardDescription className="text-muted-foreground mt-2">
              {t("dashboard.settings.invoiceCustomDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="quotePrefix">
                {t("dashboard.settings.quotePrefixLabel")}
              </Label>
              <Input
                id="quotePrefix"
                placeholder="Ex: DV-"
                value={quotePrefix ?? "DV-"}
                onChange={(e) =>
                  updateSettings({ quotePrefix: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invoicePrefix">
                {t("dashboard.settings.invoicePrefixLabel")}
              </Label>
              <Input
                id="invoicePrefix"
                placeholder="Ex: FAC-"
                value={invoicePrefix}
                onChange={(e) =>
                  updateSettings({ invoicePrefix: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vatRatePercent">
                {t("dashboard.settings.vatRateLabel")}
              </Label>
              <Input
                id="vatRatePercent"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={vatRatePercent ?? 20}
                onChange={(e) =>
                  updateSettings({
                    vatRatePercent: Number(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                {t("dashboard.settings.vatRateHint")}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="legalMentions">
                {t("dashboard.settings.legalMentionsLabel")}
              </Label>
              <textarea
                id="legalMentions"
                placeholder="Ex: Paiement à 30 jours. Pénalités de retard : 10%."
                value={legalMentions}
                onChange={(e) =>
                  updateSettings({ legalMentions: e.target.value })
                }
                rows={3}
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none",
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">
                {t("dashboard.settings.currencyLabel")}
              </Label>
              <div className="relative">
                <Select
                  id="currency"
                  value={currency}
                  onChange={(e) =>
                    updateSettings({
                      currency: e.target.value as "XOF" | "EUR" | "USD",
                    })
                  }
                  aria-label={t("dashboard.settings.currencyLabel")}
                >
                  {currencies.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </Select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save button */}
        <div className="sticky bottom-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                {t("dashboard.settings.saveBtn")}
              </>
            ) : isSaved ? (
              <>
                <Check className="h-6 w-6 mr-2" />
                {t("dashboard.settings.savedBtn")}
              </>
            ) : (
              t("dashboard.settings.saveBtn")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
