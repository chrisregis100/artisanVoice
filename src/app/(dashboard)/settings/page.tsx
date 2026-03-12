"use client";

import { useSettingsStore } from "@/stores/settings-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Building2, FileText, Key } from "lucide-react";
import { useState } from "react";

const currencies = [
  { value: "XOF" as const, label: "FCFA (XOF)" },
  { value: "EUR" as const, label: "Euro (EUR)" },
  { value: "USD" as const, label: "Dollar (USD)" },
];

export default function SettingsPage() {
  const [isSaved, setIsSaved] = useState(false);
  const {
    businessName,
    businessPhone,
    businessAddress,
    invoicePrefix,
    legalMentions,
    currency,
    openaiApiKey,
    updateSettings,
  } = useSettingsStore();

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6 pb-12">
      <h1 className="text-2xl font-bold">Paramètres</h1>

      {/* Section 1: Business Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Informations entreprise</CardTitle>
          </div>
          <CardDescription>
            Ces informations apparaîtront sur vos devis et factures.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Nom de l&apos;entreprise</Label>
            <Input
              id="businessName"
              placeholder="Ex: Menuiserie Kossi"
              value={businessName}
              onChange={(e) => updateSettings({ businessName: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessPhone">Téléphone</Label>
            <Input
              id="businessPhone"
              type="tel"
              placeholder="Ex: +229 97 00 00 00"
              value={businessPhone}
              onChange={(e) => updateSettings({ businessPhone: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="businessAddress">Adresse</Label>
            <textarea
              id="businessAddress"
              placeholder="Ex: Quartier Zongo, Cotonou, Bénin"
              value={businessAddress}
              onChange={(e) =>
                updateSettings({ businessAddress: e.target.value })
              }
              rows={2}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Invoice Customization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Personnalisation des factures
            </CardTitle>
          </div>
          <CardDescription>
            Configurez le format de vos documents.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoicePrefix">Préfixe numéro de facture</Label>
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
            <Label htmlFor="legalMentions">Mentions légales</Label>
            <textarea
              id="legalMentions"
              placeholder="Ex: Paiement à 30 jours. Pénalités de retard : 10%."
              value={legalMentions}
              onChange={(e) =>
                updateSettings({ legalMentions: e.target.value })
              }
              rows={3}
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <select
              id="currency"
              value={currency}
              onChange={(e) =>
                updateSettings({
                  currency: e.target.value as "XOF" | "EUR" | "USD",
                })
              }
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
              aria-label="Sélectionner la devise"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: API Key */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Clé API</CardTitle>
          </div>
          <CardDescription>
            Nécessaire pour les fonctionnalités vocales (OpenAI Realtime API).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openaiApiKey">Clé API OpenAI</Label>
            <Input
              id="openaiApiKey"
              type="password"
              placeholder="sk-..."
              value={openaiApiKey}
              onChange={(e) =>
                updateSettings({ openaiApiKey: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              Votre clé est stockée localement sur votre appareil et n&apos;est
              jamais envoyée à nos serveurs.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="sticky bottom-4">
        <Button onClick={handleSave} className="w-full" size="lg">
          {isSaved ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              Enregistré
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </div>
  );
}
