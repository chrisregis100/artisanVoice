"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  Users,
  FileText,
  TrendingUp,
  Save,
  Loader2,
  Key,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  price_amount: number;
  invoice_limit: number | null;
  is_active: boolean;
}

interface AdminSetting {
  key: string;
  value: unknown;
}

interface Stats {
  totalUsers: number;
  totalInvoices: number;
  freeSubscriptions: number;
  proSubscriptions: number;
  monthlyRevenue: number;
}

interface ServerKeys {
  openai: string;
  gemini: string;
}

interface AdminData {
  settings: AdminSetting[];
  plans: Plan[];
  stats: Stats;
  serverKeys: ServerKeys;
}

export default function AdminPanelPage() {
  const [data, setData] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // AI provider state
  const [activeProvider, setActiveProvider] = useState<"openai" | "gemini">("openai");

  // Plan editing state
  const [planEdits, setPlanEdits] = useState<
    Record<string, { price_amount: string; invoice_limit: string }>
  >({});

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const json = (await res.json()) as AdminData;
      setData(json);

      const providerSetting = json.settings.find((s) => s.key === "ai_provider");
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

      const edits: Record<string, { price_amount: string; invoice_limit: string }> = {};
      for (const plan of json.plans) {
        edits[plan.id] = {
          price_amount: String(plan.price_amount),
          invoice_limit: plan.invoice_limit !== null ? String(plan.invoice_limit) : "",
        };
      }
      setPlanEdits(edits);
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de charger les données",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de sauvegarder",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePlan = async (planId: string) => {
    const edit = planEdits[planId];
    if (!edit) return;

    setIsSaving(true);
    try {
      const price = Number(edit.price_amount);
      const limit = edit.invoice_limit === "" ? null : Number(edit.invoice_limit);

      if (isNaN(price) || price < 0) throw new Error("Prix invalide");
      if (edit.invoice_limit !== "" && (isNaN(limit as number) || (limit as number) < 0)) {
        throw new Error("Limite de factures invalide");
      }

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "plan",
          id: planId,
          updates: { price_amount: price, invoice_limit: limit },
        }),
      });
      if (!res.ok) throw new Error("Erreur lors de la sauvegarde");
      toast.success("Plan mis à jour");
      fetchData();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de sauvegarder",
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
      <div className="text-center text-muted-foreground">
        Impossible de charger les données admin.
      </div>
    );
  }

  const { stats, plans, serverKeys } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-muted-foreground mt-1">
          Gérez les paramètres globaux de l&apos;application.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Utilisateurs</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Factures créées</p>
                <p className="text-2xl font-bold">{stats.totalInvoices}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Package className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Abonnements actifs</p>
                <p className="text-2xl font-bold">
                  {stats.freeSubscriptions + stats.proSubscriptions}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stats.freeSubscriptions} gratuit · {stats.proSubscriptions} pro
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus mensuels</p>
                <p className="text-2xl font-bold">
                  {stats.monthlyRevenue.toLocaleString("fr-FR")} FCFA
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ai">
        <TabsList>
          <TabsTrigger value="ai">Fournisseur IA</TabsTrigger>
          <TabsTrigger value="plans">Plans</TabsTrigger>
        </TabsList>

        {/* AI Provider Tab */}
        <TabsContent value="ai" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Fournisseur d&apos;IA
              </CardTitle>
              <CardDescription>
                Choisissez le moteur d&apos;IA utilisé pour les conversations vocales.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider selection */}
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
                  <span className="text-sm text-muted-foreground">
                    Modèle vocal haute qualité
                  </span>
                  {activeProvider === "openai" && (
                    <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                  )}
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
                  <span className="font-semibold">Google Gemini 2.0 Flash Live</span>
                  <span className="text-sm text-muted-foreground">
                    Modèle vocal Google multimodal
                  </span>
                  {activeProvider === "gemini" && (
                    <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              </div>

              {/* Server key status */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  Clés API configurées sur le serveur
                </p>
                <div className="grid gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">OPENAI_API_KEY</span>
                    <code className="text-xs font-mono bg-background px-2 py-0.5 rounded border">
                      {serverKeys.openai}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">GEMINI_API_KEY</span>
                    <code className="text-xs font-mono bg-background px-2 py-0.5 rounded border">
                      {serverKeys.gemini}
                    </code>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveProvider}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="mt-6">
          <div className="space-y-4">
            {plans.map((plan) => {
              const edit = planEdits[plan.id];
              if (!edit) return null;

              return (
                <Card key={plan.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{plan.display_name}</CardTitle>
                    <CardDescription>
                      Plan <code className="text-xs">{plan.name}</code> ·{" "}
                      {plan.is_active ? "Actif" : "Inactif"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor={`price-${plan.id}`}>
                          Prix (FCFA / mois)
                        </Label>
                        <Input
                          id={`price-${plan.id}`}
                          type="number"
                          min={0}
                          value={edit.price_amount}
                          onChange={(e) =>
                            setPlanEdits((prev) => ({
                              ...prev,
                              [plan.id]: { ...prev[plan.id], price_amount: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`limit-${plan.id}`}>
                          Limite de factures (vide = illimité)
                        </Label>
                        <Input
                          id={`limit-${plan.id}`}
                          type="number"
                          min={0}
                          placeholder="Illimité"
                          value={edit.invoice_limit}
                          onChange={(e) =>
                            setPlanEdits((prev) => ({
                              ...prev,
                              [plan.id]: {
                                ...prev[plan.id],
                                invoice_limit: e.target.value,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => handleSavePlan(plan.id)}
                        disabled={isSaving}
                        className="gap-2"
                      >
                        {isSaving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Save className="h-3.5 w-3.5" />
                        )}
                        Sauvegarder
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
