"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  Bot,
  CreditCard,
  FileText,
  Key,
  Loader2,
  Package,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { Button } from "@/components/ui/button";

export default function AdminOverviewPage() {
  const { data, isLoading } = useAdminDashboard();

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

  const { stats } = data;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vue d&apos;ensemble</h1>
        <p className="mt-1 text-muted-foreground">
          Statistiques globales et accès rapide aux sections d&apos;administration.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <Users className="h-5 w-5 text-blue-500 dark:text-blue-400" aria-hidden />
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
                    <FileText className="h-5 w-5 text-green-500 dark:text-green-400" aria-hidden />
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
                <ShoppingBag className="h-5 w-5 text-purple-500 dark:text-purple-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Acheteurs actifs</p>
                <p className="text-2xl font-bold">{stats.activeBuyersCount}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.totalPurchases30d} achat{stats.totalPurchases30d !== 1 ? 's' : ''} ce mois
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <TrendingUp className="h-5 w-5 text-amber-500 dark:text-amber-400" aria-hidden />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Revenus du mois</p>
                <p className="text-lg font-bold leading-tight">
                  {stats.monthlyRevenueXof.toLocaleString("fr-FR")} FCFA
                </p>
                {stats.monthlyRevenueUsdCents > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    + ${(stats.monthlyRevenueUsdCents / 100).toFixed(2)} USD
                  </p>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Navigation</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Fournisseur IA</p>
                  <p className="text-sm text-muted-foreground">
                    Moteur vocal OpenAI ou Gemini
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/ai" aria-label="Ouvrir fournisseur IA">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Plans tarifaires</p>
                  <p className="text-sm text-muted-foreground">
                    Prix et limites de facturation
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/plans" aria-label="Ouvrir les plans">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="h-8 w-8 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Transactions</p>
                  <p className="text-sm text-muted-foreground">
                    Historique complet des crédits
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/transactions" aria-label="Ouvrir les transactions">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:bg-muted/40">
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Paiements</p>
                  <p className="text-sm text-muted-foreground">
                    Revenus FedaPay et LemonSqueezy
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/payments" aria-label="Ouvrir les paiements">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-colors hover:bg-muted/40 sm:col-span-2">
            <CardContent className="flex items-center justify-between gap-4 pt-6">
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-primary" aria-hidden />
                <div>
                  <p className="font-medium">Clés API</p>
                  <p className="text-sm text-muted-foreground">
                    Stockage chiffré côté serveur (priorité sur les variables
                    d&apos;environnement)
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <Link href="/admin/keys" aria-label="Ouvrir les clés API">
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
