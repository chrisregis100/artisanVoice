"use client";

import Link from "next/link";
import { AlertCircle, Coins, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  hasPurchased?: boolean;
}

interface PackHighlight {
  name: string;
  credits: number;
  price: string;
  featured?: boolean;
}

const PACK_HIGHLIGHTS: PackHighlight[] = [
  { name: "Starter", credits: 5, price: "1 500 FCFA" },
  { name: "Populaire", credits: 15, price: "3 500 FCFA", featured: true },
  { name: "Pro", credits: 40, price: "7 500 FCFA" },
];

export function InsufficientCreditsModal({
  open,
  onOpenChange,
  currentBalance,
  hasPurchased = false,
}: InsufficientCreditsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <AlertCircle
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                aria-hidden="true"
              />
            </div>
            <div className="pt-0.5">
              <DialogTitle>Crédits insuffisants</DialogTitle>
              <DialogDescription className="mt-1">
                Votre solde actuel :{" "}
                <span className="font-semibold text-foreground">
                  {currentBalance} crédit{currentBalance !== 1 ? "s" : ""}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground">
          {hasPurchased
            ? "Votre solde est insuffisant pour cette action. Rechargez vos crédits pour continuer."
            : "Vous avez utilisé vos 3 crédits gratuits. Achetez un pack pour continuer à créer vos factures et devis."}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {PACK_HIGHLIGHTS.map((pack) => (
            <div
              key={pack.name}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center",
                pack.featured
                  ? "border-primary/40 bg-primary/5"
                  : "border-border/60 bg-muted/40",
              )}
            >
              {pack.featured ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Populaire
                </span>
              ) : null}
              <div className="flex items-center gap-1">
                <Coins
                  className="h-3.5 w-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-xl font-bold tabular-nums">
                  {pack.credits}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">{pack.price}</span>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button asChild className="gap-2">
            <Link href={hasPurchased ? "/pricing" : "/paywall"}>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              {hasPurchased ? "Recharger mes crédits" : "Choisir un pack"}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
