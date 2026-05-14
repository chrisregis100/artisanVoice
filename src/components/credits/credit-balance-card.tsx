"use client";

import Link from "next/link";
import { AlertCircle, Coins, Loader2, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useWallet } from "@/hooks/use-wallet";

interface CreditBalanceCardProps {
  className?: string;
}

const MAX_GAUGE_CREDITS = 20;

export function CreditBalanceCard({ className }: CreditBalanceCardProps) {
  const { data, isLoading, error, refetch } = useWallet();

  if (isLoading) {
    return (
      <Card className={className} aria-busy="true">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins className="h-4 w-4 shrink-0" aria-hidden="true" />
            Crédits
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Chargement…
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className={cn("border-destructive/40", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle
              className="h-4 w-4 text-destructive"
              aria-hidden="true"
            />
            Crédits
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Impossible de charger le solde.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="shrink-0 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { balance } = data;
  const ratio = Math.min(100, (balance / MAX_GAUGE_CREDITS) * 100);

  const statusMessage =
    balance === 0
      ? "Rechargez pour continuer"
      : balance <= 3
        ? "Pensez à recharger"
        : `${balance} facture${balance !== 1 ? "s" : ""} disponible${balance !== 1 ? "s" : ""}`;

  const gaugeClass =
    balance === 0
      ? "bg-destructive"
      : balance <= 3
        ? "bg-amber-500"
        : "bg-brand";

  const statusTextClass =
    balance === 0
      ? "text-destructive"
      : balance <= 3
        ? "text-amber-600 dark:text-amber-400"
        : "text-muted-foreground";

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Coins
              className="h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            Crédits
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => void refetch()}
            aria-label="Actualiser le solde"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums">{balance}</span>
          <span className="text-sm text-muted-foreground">
            crédit{balance !== 1 ? "s" : ""}
          </span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={balance}
          aria-valuemin={0}
          aria-valuemax={MAX_GAUGE_CREDITS}
          aria-label={`${balance} crédits`}
        >
          <div
            className={cn("h-full rounded-full transition-all", gaugeClass)}
            style={{ width: `${ratio}%` }}
          />
        </div>

        <p className={cn("text-xs font-medium", statusTextClass)}>
          {statusMessage}
        </p>

        <Button variant="outline" size="sm" asChild className="w-full gap-2">
          <Link href="/pricing">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
            Recharger
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
