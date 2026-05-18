"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Package, Save, ToggleLeft, ToggleRight } from "lucide-react";
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

interface CreditPackRow {
  id: string;
  slug: string;
  display_name: string;
  credits_amount: number;
  bonus_credits: number;
  price_usd_cents: number;
  price_xof: number;
  is_active: boolean;
  sort_order: number;
}

interface PackEdit {
  price_usd_cents: string;
  price_xof: string;
  bonus_credits: string;
  is_active: boolean;
}

export default function AdminPlansPage() {
  const [packs, setPacks] = useState<CreditPackRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [packEdits, setPackEdits] = useState<Record<string, PackEdit>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const syncEdits = useCallback((rows: CreditPackRow[]) => {
    const edits: Record<string, PackEdit> = {};
    for (const pack of rows) {
      edits[pack.id] = {
        price_usd_cents: String(pack.price_usd_cents),
        price_xof: String(pack.price_xof),
        bonus_credits: String(pack.bonus_credits),
        is_active: pack.is_active,
      };
    }
    setPackEdits(edits);
  }, []);

  const fetchPacks = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/credit-packs");
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data: { packs: CreditPackRow[] } = await res.json();
      setPacks(data.packs);
      syncEdits(data.packs);
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de charger les packs",
      });
    } finally {
      setIsLoading(false);
    }
  }, [syncEdits]);

  useEffect(() => {
    void fetchPacks();
  }, [fetchPacks]);

  const handleSave = async (packId: string) => {
    const edit = packEdits[packId];
    if (!edit) return;

    const priceUsd = Number(edit.price_usd_cents);
    const priceXof = Number(edit.price_xof);
    const bonusCredits = Number(edit.bonus_credits);

    if (isNaN(priceUsd) || priceUsd < 0) {
      toast.error("Prix USD invalide");
      return;
    }
    if (isNaN(priceXof) || priceXof < 0) {
      toast.error("Prix XOF invalide");
      return;
    }
    if (isNaN(bonusCredits) || bonusCredits < 0) {
      toast.error("Crédits bonus invalides");
      return;
    }

    setSavingId(packId);
    try {
      const res = await fetch("/api/admin/credit-packs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: packId,
          updates: {
            price_usd_cents: priceUsd,
            price_xof: priceXof,
            bonus_credits: bonusCredits,
            is_active: edit.is_active,
          },
        }),
      });

      if (!res.ok) {
        const data: { error?: string } = await res.json();
        throw new Error(data.error ?? "Erreur lors de la sauvegarde");
      }

      toast.success("Pack mis à jour");
      void fetchPacks();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Impossible de sauvegarder",
      });
    } finally {
      setSavingId(null);
    }
  };

  const updateEdit = (packId: string, field: keyof PackEdit, value: string | boolean) => {
    setPackEdits((prev) => ({
      ...prev,
      [packId]: { ...prev[packId], [field]: value },
    }));
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des packs de crédits</h1>
          <p className="mt-1 text-muted-foreground">
            Ajustez les prix et les crédits bonus par pack.
          </p>
        </div>
        <p className="text-center text-muted-foreground">
          Aucun pack de crédits trouvé. Vérifiez que les migrations ont été appliquées.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gestion des packs de crédits</h1>
        <p className="mt-1 text-muted-foreground">
          Ajustez les prix, les crédits bonus et l&apos;état d&apos;activation de chaque pack.
        </p>
      </div>

      <div className="space-y-4">
        {packs.map((pack) => {
          const edit = packEdits[pack.id];
          if (!edit) return null;
          const isSaving = savingId === pack.id;

          return (
            <Card key={pack.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" aria-hidden />
                  {pack.display_name}
                  <span
                    className={`ml-auto inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      edit.is_active
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {edit.is_active ? "Actif" : "Inactif"}
                  </span>
                </CardTitle>
                <CardDescription>
                  Slug : <code className="text-xs">{pack.slug}</code> ·{" "}
                  {pack.credits_amount} crédits de base · ordre {pack.sort_order}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`usd-${pack.id}`}>Prix USD (centimes)</Label>
                    <Input
                      id={`usd-${pack.id}`}
                      type="number"
                      min={0}
                      value={edit.price_usd_cents}
                      onChange={(e) => updateEdit(pack.id, "price_usd_cents", e.target.value)}
                      placeholder="ex: 400"
                    />
                    <p className="text-xs text-muted-foreground">
                      = ${(Number(edit.price_usd_cents) / 100).toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`xof-${pack.id}`}>Prix XOF (FCFA)</Label>
                    <Input
                      id={`xof-${pack.id}`}
                      type="number"
                      min={0}
                      value={edit.price_xof}
                      onChange={(e) => updateEdit(pack.id, "price_xof", e.target.value)}
                      placeholder="ex: 2400"
                    />
                    <p className="text-xs text-muted-foreground">
                      = {Number(edit.price_xof).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`bonus-${pack.id}`}>Crédits bonus offerts</Label>
                    <Input
                      id={`bonus-${pack.id}`}
                      type="number"
                      min={0}
                      value={edit.bonus_credits}
                      onChange={(e) => updateEdit(pack.id, "bonus_credits", e.target.value)}
                      placeholder="ex: 10"
                    />
                    <p className="text-xs text-muted-foreground">
                      Total : {pack.credits_amount + Number(edit.bonus_credits)} crédits
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>État du pack</Label>
                    <button
                      type="button"
                      onClick={() => updateEdit(pack.id, "is_active", !edit.is_active)}
                      className="flex h-10 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-pressed={edit.is_active}
                      aria-label={edit.is_active ? "Désactiver ce pack" : "Activer ce pack"}
                    >
                      {edit.is_active ? (
                        <ToggleRight className="h-5 w-5 text-green-600" aria-hidden />
                      ) : (
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" aria-hidden />
                      )}
                      {edit.is_active ? "Actif (visible)" : "Inactif (masqué)"}
                    </button>
                    <p className="text-xs text-muted-foreground">
                      Affiché sur la page pricing
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    size="sm"
                    onClick={() => void handleSave(pack.id)}
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
