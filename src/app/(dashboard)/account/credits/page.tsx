import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getWallet, listTransactions } from "@/lib/credits/wallet";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Historique des crédits",
};

const KIND_LABELS: Record<string, string> = {
  purchase: "Achat",
  signup_bonus: "Bonus inscription",
  charge: "Utilisation",
  migration: "Migration",
  grant: "Crédit offert",
  refund: "Remboursement",
};

const KIND_CLASSES: Record<
  string,
  { badge: string; delta: string }
> = {
  purchase: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    delta: "text-emerald-600 dark:text-emerald-400",
  },
  signup_bonus: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    delta: "text-blue-600 dark:text-blue-400",
  },
  grant: {
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    delta: "text-blue-600 dark:text-blue-400",
  },
  migration: {
    badge: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
    delta: "text-purple-600 dark:text-purple-400",
  },
  charge: {
    badge: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
    delta: "text-red-600 dark:text-red-400",
  },
  refund: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    delta: "text-emerald-600 dark:text-emerald-400",
  },
};

const DEFAULT_KIND_CLASS = {
  badge: "bg-muted text-muted-foreground",
  delta: "text-foreground",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export default async function CreditsHistoryPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [wallet, transactions] = await Promise.all([
    getWallet(user.id),
    listTransactions(user.id, 50),
  ]);

  const balance = wallet?.balance ?? 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6 md:py-8">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 shrink-0">
          <Link href="/dashboard" aria-label="Retour au tableau de bord">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Crédits
          </h1>
          <p className="text-sm text-muted-foreground">
            Historique de vos transactions
          </p>
        </div>
      </div>

      {/* Balance card */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Solde actuel</CardTitle>
          <CardDescription>
            Chaque facture ou devis partagé consomme 1 crédit.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl font-bold tabular-nums">{balance}</span>
            <span className="text-base text-muted-foreground">
              crédit{balance !== 1 ? "s" : ""}
            </span>
          </div>
          <Button asChild className="gap-2 shrink-0">
            <Link href="/pricing">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Acheter un pack
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Transaction list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Transactions</CardTitle>
          {transactions.length > 0 ? (
            <CardDescription>
              {transactions.length} dernière{transactions.length !== 1 ? "s" : ""}{" "}
              transaction{transactions.length !== 1 ? "s" : ""}
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Aucune transaction pour le moment.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {transactions.map((tx) => {
                const kindClass =
                  KIND_CLASSES[tx.kind] ?? DEFAULT_KIND_CLASS;
                const kindLabel = KIND_LABELS[tx.kind] ?? tx.kind;
                const isCredit = tx.delta > 0;

                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 px-6 py-3"
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${kindClass.badge}`}
                        >
                          {kindLabel}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(tx.createdAt)}
                      </span>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <span
                        className={`text-sm font-semibold tabular-nums ${kindClass.delta}`}
                      >
                        {isCredit ? "+" : ""}
                        {tx.delta}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        solde : {tx.balanceAfter}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
