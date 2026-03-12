"use client";

import { SidebarNav } from "@/components/layout/sidebar-nav";
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
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-full">
      <div className="hidden md:block w-1/2 max-w-md border-r bg-background p-8 overflow-y-auto">
        <SidebarNav businessName={businessName || "Test Artisan"} />
      </div>

      <div className="flex-1 w-full md:w-1/2 overflow-auto p-4 md:p-8 bg-muted/30">
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
          <h1 className="text-3xl font-black tracking-tight mb-8 uppercase">Paramètres</h1>

          {/* Section 1: Business Info */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <CardHeader className="border-b-4 border-foreground pb-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-black uppercase tracking-wide">Informations entreprise</CardTitle>
              </div>
              <CardDescription className="font-medium text-muted-foreground mt-2">
                Ces informations apparaîtront sur vos devis et factures.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="font-bold uppercase tracking-wider text-xs">Nom de l&apos;entreprise</Label>
                <Input
                  id="businessName"
                  placeholder="Ex: Menuiserie Kossi"
                  value={businessName}
                  onChange={(e) => updateSettings({ businessName: e.target.value })}
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessPhone" className="font-bold uppercase tracking-wider text-xs">Téléphone</Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  placeholder="Ex: +229 97 00 00 00"
                  value={businessPhone}
                  onChange={(e) => updateSettings({ businessPhone: e.target.value })}
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAddress" className="font-bold uppercase tracking-wider text-xs">Adresse</Label>
                <textarea
                  id="businessAddress"
                  placeholder="Ex: Quartier Zongo, Cotonou, Bénin"
                  value={businessAddress}
                  onChange={(e) =>
                    updateSettings({ businessAddress: e.target.value })
                  }
                  rows={2}
                  className={cn(
                    "flex w-full rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none resize-none"
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Invoice Customization */}
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <CardHeader className="border-b-4 border-foreground pb-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-black uppercase tracking-wide">
                  Personnalisation des factures
                </CardTitle>
              </div>
              <CardDescription className="font-medium text-muted-foreground mt-2">
                Configurez le format de vos documents.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="invoicePrefix" className="font-bold uppercase tracking-wider text-xs">Préfixe numéro de facture</Label>
                <Input
                  id="invoicePrefix"
                  placeholder="Ex: FAC-"
                  value={invoicePrefix}
                  onChange={(e) =>
                    updateSettings({ invoicePrefix: e.target.value })
                  }
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalMentions" className="font-bold uppercase tracking-wider text-xs">Mentions légales</Label>
                <textarea
                  id="legalMentions"
                  placeholder="Ex: Paiement à 30 jours. Pénalités de retard : 10%."
                  value={legalMentions}
                  onChange={(e) =>
                    updateSettings({ legalMentions: e.target.value })
                  }
                  rows={3}
                  className={cn(
                    "flex w-full rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none resize-none"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency" className="font-bold uppercase tracking-wider text-xs">Devise</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) =>
                    updateSettings({
                      currency: e.target.value as "XOF" | "EUR" | "USD",
                    })
                  }
                  className={cn(
                    "flex h-10 w-full rounded-md border-2 border-foreground bg-background px-3 py-2 text-sm shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:outline-none"
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
          <Card className="border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl">
            <CardHeader className="border-b-4 border-foreground pb-4">
              <div className="flex items-center gap-3">
                <Key className="h-6 w-6 text-foreground" />
                <CardTitle className="text-xl font-black uppercase tracking-wide">Clé API</CardTitle>
              </div>
              <CardDescription className="font-medium text-muted-foreground mt-2">
                Nécessaire pour les fonctionnalités vocales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey" className="font-bold uppercase tracking-wider text-xs">Clé API OpenAI</Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  placeholder="sk-..."
                  value={openaiApiKey}
                  onChange={(e) =>
                    updateSettings({ openaiApiKey: e.target.value })
                  }
                  className="border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <p className="text-xs font-medium text-muted-foreground mt-2">
                  Votre clé est stockée localement sur votre appareil et n&apos;est
                  jamais envoyée à nos serveurs.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save button */}
          <div className="sticky bottom-4 pt-4">
            <Button 
              onClick={handleSave} 
              className="w-full h-12 text-lg font-black border-2 border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all" 
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
