"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Key, Loader2, Trash2 } from "lucide-react";
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
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";

export default function AdminApiKeysPage() {
  const { data, isLoading, refetch } = useAdminDashboard();
  const [openaiInput, setOpenaiInput] = useState("");
  const [geminiInput, setGeminiInput] = useState("");
  const [savingProvider, setSavingProvider] = useState<"openai" | "gemini" | null>(
    null,
  );

  const sourceLabel = (source: string) => {
    if (source === "database") return "Base de données";
    if (source === "environment") return "Environnement (.env)";
    return "Aucune";
  };

  const handleSave = async (provider: "openai" | "gemini", apiKey: string) => {
    const trimmed = apiKey.trim();
    if (trimmed.length < 12) {
      toast.error("Clé trop courte", {
        description: "Vérifiez la clé fournie par le prestataire.",
      });
      return;
    }

    setSavingProvider(provider);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "api_key", provider, apiKey: trimmed }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Échec de l’enregistrement");
      }
      toast.success("Clé enregistrée", {
        description:
          "Stockée chiffrée en base. Elle est prioritaire sur la variable d’environnement.",
      });
      if (provider === "openai") setOpenaiInput("");
      else setGeminiInput("");
      void refetch();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Réessayez plus tard.",
      });
    } finally {
      setSavingProvider(null);
    }
  };

  const handleClear = async (provider: "openai" | "gemini") => {
    setSavingProvider(provider);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "api_key", provider, clear: true }),
      });
      if (!res.ok) throw new Error("Échec de la suppression");
      toast.success("Clé retirée de la base", {
        description: "La variable d’environnement sera utilisée si elle est définie.",
      });
      void refetch();
    } catch (err) {
      toast.error("Erreur", {
        description: err instanceof Error ? err.message : "Réessayez plus tard.",
      });
    } finally {
      setSavingProvider(null);
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clés API</h1>
        <p className="mt-1 text-muted-foreground">
          Les clés sont envoyées via HTTPS (TLS), puis chiffrées côté serveur (AES-256-GCM)
          avant d&apos;être stockées. Définissez{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">
            ADMIN_SECRETS_ENCRYPTION_KEY
          </code>{" "}
          (32 octets en base64, ex.{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">openssl rand -base64 32</code>
          ).
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" aria-hidden />
              OpenAI
            </CardTitle>
            <CardDescription>
              Aperçu :{" "}
              <span className="font-mono text-foreground">{serverKeys.openai.mask}</span>
              <span className="mt-1 block text-xs">
                Source active : {sourceLabel(serverKeys.openai.source)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="openai-key">Nouvelle clé (non affichée après enregistrement)</Label>
              <Input
                id="openai-key"
                type="password"
                autoComplete="off"
                placeholder="sk-..."
                value={openaiInput}
                onChange={(e) => setOpenaiInput(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={savingProvider !== null}
                className="gap-2"
                onClick={() => void handleSave("openai", openaiInput)}
              >
                {savingProvider === "openai" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Enregistrer en base
              </Button>
              {serverKeys.openai.source === "database" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={savingProvider !== null}
                  onClick={() => void handleClear("openai")}
                >
                  {savingProvider === "openai" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden />
                  )}
                  Retirer de la base
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Key className="h-5 w-5" aria-hidden />
              Google Gemini
            </CardTitle>
            <CardDescription>
              Aperçu :{" "}
              <span className="font-mono text-foreground">{serverKeys.gemini.mask}</span>
              <span className="mt-1 block text-xs">
                Source active : {sourceLabel(serverKeys.gemini.source)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="gemini-key">Nouvelle clé (non affichée après enregistrement)</Label>
              <Input
                id="gemini-key"
                type="password"
                autoComplete="off"
                placeholder="AIza..."
                value={geminiInput}
                onChange={(e) => setGeminiInput(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={savingProvider !== null}
                className="gap-2"
                onClick={() => void handleSave("gemini", geminiInput)}
              >
                {savingProvider === "gemini" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : null}
                Enregistrer en base
              </Button>
              {serverKeys.gemini.source === "database" ? (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={savingProvider !== null}
                  onClick={() => void handleClear("gemini")}
                >
                  {savingProvider === "gemini" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden />
                  )}
                  Retirer de la base
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-sm text-muted-foreground">
        Une clé en base a la priorité sur{" "}
        <code className="rounded bg-muted px-1 py-0.5">OPENAI_API_KEY</code> /{" "}
        <code className="rounded bg-muted px-1 py-0.5">GEMINI_API_KEY</code>. Le trafic
        navigateur → serveur reste chiffré par TLS ; évitez les réseaux non fiables lors de la
        saisie.
      </p>
    </div>
  );
}
