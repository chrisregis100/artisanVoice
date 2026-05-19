"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Bot, Key, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

export default function AdminAiPage() {
  const { data, isLoading, refetch } = useAdminDashboard();
  const [activeProvider, setActiveProvider] = useState<"openai" | "gemini">("openai");
  const [isSaving, setIsSaving] = useState(false);

  const syncProviderFromSettings = useCallback(() => {
    if (!data?.settings) return;
    const providerSetting = data.settings.find((s) => s.key === "ai_provider");
    if (
      providerSetting?.value &&
      typeof providerSetting.value === "object" &&
      !Array.isArray(providerSetting.value) &&
      "provider" in (providerSetting.value as object)
    ) {
      const v = (providerSetting.value as { provider: string }).provider;
      if (v === "gemini") setActiveProvider("gemini");
      else setActiveProvider("openai");
    }
  }, [data?.settings]);

  useEffect(() => {
    syncProviderFromSettings();
  }, [syncProviderFromSettings]);

  const handleSaveProvider = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "ai_provider", value: { provider: activeProvider } }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      toast.success("Fournisseur IA mis à jour");
      void refetch();
    } catch (err) {
      toast.error("Erreur", {
        description:
          err instanceof Error ? err.message : "Impossible de sauvegarder",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-muted-foreground">
        Impossible de charger les données admin.
      </p>
    );
  }

  const { serverKeys } = data;

  const sourceLabel = (source: string) => {
    if (source === "database") return "Base de données (chiffré)";
    if (source === "environment") return "Variable d'environnement";
    return "Non configurée";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fournisseur IA</h1>
        <p className="mt-1 text-muted-foreground">
          Choisissez le moteur utilisé pour les conversations vocales. Les clés se gèrent dans{" "}
          <span className="font-medium text-foreground">Clés API</span>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" aria-hidden />
            Moteur vocal
          </CardTitle>
          <CardDescription>
            OpenAI Realtime ou Gemini Live — une clé valide est requise pour le fournisseur actif.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setActiveProvider("openai")}
              className={[
                "relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                activeProvider === "openai"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50",
              ].join(" ")}
              aria-pressed={activeProvider === "openai"}
            >
              <span className="font-semibold">OpenAI GPT-4o Realtime</span>
              <span className="text-sm text-muted-foreground">Modèle vocal haute qualité</span>
              {activeProvider === "openai" ? (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setActiveProvider("gemini")}
              className={[
                "relative flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                activeProvider === "gemini"
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50",
              ].join(" ")}
              aria-pressed={activeProvider === "gemini"}
            >
              <span className="font-semibold">Google Gemini 3.1 Flash Live</span>
              <span className="text-sm text-muted-foreground">
                Modèle vocal Google multimodal
              </span>
              {activeProvider === "gemini" ? (
                <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </button>
          </div>

          <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Key className="h-4 w-4 text-muted-foreground" aria-hidden />
              État des clés (aperçu)
            </p>
            <ul className="space-y-3 text-sm">
              <li className="rounded-md border border-border/60 bg-background/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">OpenAI</span>
                  <span className="text-xs text-muted-foreground">
                    {sourceLabel(serverKeys.openai.source)}
                  </span>
                </div>
                <code className="mt-1 block text-xs font-mono">{serverKeys.openai.mask}</code>
              </li>
              <li className="rounded-md border border-border/60 bg-background/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">Gemini</span>
                  <span className="text-xs text-muted-foreground">
                    {sourceLabel(serverKeys.gemini.source)}
                  </span>
                </div>
                <code className="mt-1 block text-xs font-mono">{serverKeys.gemini.mask}</code>
              </li>
            </ul>
          </div>

          <Button onClick={handleSaveProvider} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            Sauvegarder le fournisseur
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
