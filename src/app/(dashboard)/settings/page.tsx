"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
import { useSettingsStore } from "@/stores/settings-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Check, Building2, FileText, Key, ChevronDown } from "lucide-react";
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-full">
      <div className="hidden md:block w-1/2 max-w-md border-r bg-background p-8 overflow-y-auto">
        <SidebarNav businessName={businessName || "Mon espace"} />
      </div>

      <div className="flex-1 w-full md:w-1/2 overflow-auto p-4 md:p-8 bg-muted/30">
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-8">Paramètres</h1>

          {/* Section 1: Business Info */}
          <Card className="border shadow-sm rounded-lg">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-semibold tracking-tight">Informations entreprise</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground mt-2">
                Ces informations apparaîtront sur vos devis et factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
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
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Invoice Customization */}
          <Card className="border shadow-sm rounded-lg">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-semibold tracking-tight">
                  Personnalisation des factures
                </CardTitle>
              </div>
              <CardDescription className="text-muted-foreground mt-2">
                Configurez le format de vos documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
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
                    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <div className="relative">
                  <Select
                    id="currency"
                    value={currency}
                    onChange={(e) =>
                      updateSettings({
                        currency: e.target.value as "XOF" | "EUR" | "USD",
                      })
                    }
                    aria-label="Sélectionner la devise"
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

          {/* Section 3: API Key */}
          <Card className="border shadow-sm rounded-lg">
            <CardHeader className="border-b pb-4">
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-semibold tracking-tight">Clé API</CardTitle>
              </div>
              <CardDescription className="text-muted-foreground mt-2">
                Nécessaire pour les fonctionnalités vocales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
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
                <p className="text-xs text-muted-foreground mt-2">
                  Votre clé est stockée localement dans votre navigateur. Elle
                  est transmise uniquement à votre propre serveur lors de la
                  création d&apos;une session vocale pour obtenir un jeton
                  éphémère, puis n&apos;est pas conservée.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="sticky bottom-4 pt-4">
            <Button 
              onClick={handleSave} 
              className="w-full h-12 text-lg font-semibold" 
              size="lg"
            >
              {isSaved ? (
                <>
                  <Check className="h-6 w-6 mr-2" />
                  Enregistré
                </>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
