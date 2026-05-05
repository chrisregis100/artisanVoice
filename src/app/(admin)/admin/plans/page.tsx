"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

export default function AdminPlansPage() {
  const { data, isLoading, refetch } = useAdminDashboard();
  const [planEdits, setPlanEdits] = useState<
    Record<string, { price_amount: string; invoice_limit: string }>
  >({});
  const [isSaving, setIsSaving] = useState(false);

  const syncPlans = useCallback(() => {
    if (!data?.plans) return;
    const edits: Record<string, { price_amount: string; invoice_limit: string }> = {};
    for (const plan of data.plans) {
      edits[plan.id] = {
        price_amount: String(plan.price_amount),
        invoice_limit: plan.invoice_limit !== null ? String(plan.invoice_limit) : "",
      };
    }
    setPlanEdits(edits);
  }, [data?.plans]);

  useEffect(() => {
    syncPlans();
  }, [syncPlans]);

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

  const { plans } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plans tarifaires</h1>
        <p className="mt-1 text-muted-foreground">
          Ajustez les prix mensuels et les plafonds de factures par plan.
        </p>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const edit = planEdits[plan.id];
          if (!edit) return null;

          return (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" aria-hidden />
                  {plan.display_name}
                </CardTitle>
                <CardDescription>
                  Plan <code className="text-xs">{plan.name}</code> ·{" "}
                  {plan.is_active ? "Actif" : "Inactif"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`price-${plan.id}`}>Prix (FCFA / mois)</Label>
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
                    onClick={() => void handleSavePlan(plan.id)}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    ) : (
                      <Save className="h-3.5 w-3.5" aria-hidden />
                    )}
                    Sauvegarder
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
