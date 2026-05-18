"use client";

import Link from "next/link";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@/hooks/use-wallet";

export function WalletBalance() {
  const { data, isLoading } = useWallet();

  if (isLoading) {
    return (
      <div
        className="h-7 w-24 animate-pulse rounded-full bg-muted"
        aria-hidden="true"
      />
    );
  }

  if (!data) return null;

  const { balance } = data;

  const colorClass =
    balance === 0
      ? "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15"
      : balance <= 3
        ? "border-amber-400/30 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50"
        : "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15";

  return (
    <Link
      href="/account/credits"
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-colors",
        colorClass,
      )}
      aria-label={`${balance} crédit${balance !== 1 ? "s" : ""} — voir l'historique`}
    >
      <Coins className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>
        {balance} crédit{balance !== 1 ? "s" : ""}
      </span>
    </Link>
  );
}
