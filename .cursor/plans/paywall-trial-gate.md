# Plan d'exécution : Paywall post-essai gratuit (3 crédits)

---

## Section 0 : Décision architecturale

**Retenue : Option A — `credit_wallets.has_purchased BOOLEAN DEFAULT FALSE` + trigger DB.**

**Pourquoi :**
- `credit_wallets` contient déjà `signup_bonus_granted` — même pattern sémantique
- `getWallet()` lit déjà cette table — ajout d'une colonne = zéro round-trip supplémentaire
- Le trigger `AFTER INSERT ON credit_transactions WHERE kind='purchase'` rend la mise à jour atomique et invisible pour les webhooks existants (FedaPay + LemonSqueezy appellent `grantCredits()` → RPC `grant_credits()` → INSERT dans `credit_transactions` → trigger fire → `has_purchased = true`)
- Aucun webhook ne doit être modifié

**Logique de gating (3 cas) :**

```
has_purchased = true                          → ACCÈS dashboard (user payant)
has_purchased = false  ET  balance > 0        → ACCÈS dashboard (essai en cours)
has_purchased = false  ET  balance ≤ 0        → REDIRECT /paywall (essai expiré)
```

---

## Étape 1 : Migration Supabase

**Fichier à créer :** `supabase/migrations/016_has_purchased.sql`

```sql
-- 1. Ajouter la colonne
ALTER TABLE credit_wallets
  ADD COLUMN IF NOT EXISTS has_purchased BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Backfill : marquer les users ayant déjà acheté
UPDATE credit_wallets cw
SET has_purchased = TRUE
WHERE EXISTS (
  SELECT 1 FROM credit_transactions ct
  WHERE ct.user_id = cw.user_id
    AND ct.kind = 'purchase'
);

-- 3. Trigger automatique : toute future transaction 'purchase' met le flag à TRUE
CREATE OR REPLACE FUNCTION set_has_purchased()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.kind = 'purchase' THEN
    UPDATE credit_wallets
    SET has_purchased = TRUE
    WHERE user_id = NEW.user_id
      AND has_purchased = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_purchase_transaction ON credit_transactions;
CREATE TRIGGER on_purchase_transaction
  AFTER INSERT ON credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_has_purchased();

-- 4. Index composé pour le check paywall (user_id est déjà PK, ceci aide le gating)
CREATE INDEX IF NOT EXISTS idx_credit_wallets_paywall
  ON credit_wallets (user_id, has_purchased, balance);
```

**Exécution :** Via Supabase Dashboard SQL Editor ou `supabase db push`.

**Dépendances :** Aucune.
**Acceptation :**
```sql
SELECT user_id, has_purchased FROM credit_wallets LIMIT 10;
-- Les users ayant des transactions kind='purchase' ont has_purchased=true

INSERT INTO credit_transactions (user_id, kind, delta, balance_after)
VALUES ('test-user-id', 'purchase', 5, 5);
SELECT has_purchased FROM credit_wallets WHERE user_id = 'test-user-id';
-- Doit retourner true
-- Nettoyer après test
```

---

## Étape 2 : Mettre à jour les types DB TypeScript

**Fichier :** `src/lib/supabase/types.ts`

Dans le type `credit_wallets`, ajouter `has_purchased` dans Row, Insert et Update.

Remplacer le bloc `credit_wallets` existant :

```typescript
// AVANT
credit_wallets: {
  Row: {
    user_id: string;
    balance: number;
    signup_bonus_granted: boolean;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    balance?: number;
    signup_bonus_granted?: boolean;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    balance?: number;
    signup_bonus_granted?: boolean;
    updated_at?: string;
  };
  Relationships: [];
};
```

```typescript
// APRÈS
credit_wallets: {
  Row: {
    user_id: string;
    balance: number;
    signup_bonus_granted: boolean;
    has_purchased: boolean;
    updated_at: string;
  };
  Insert: {
    user_id: string;
    balance?: number;
    signup_bonus_granted?: boolean;
    has_purchased?: boolean;
    updated_at?: string;
  };
  Update: {
    user_id?: string;
    balance?: number;
    signup_bonus_granted?: boolean;
    has_purchased?: boolean;
    updated_at?: string;
  };
  Relationships: [];
};
```

**Dépendances :** Étape 1.
**Acceptation :** `npm run build` — aucune erreur TypeScript.

---

## Étape 3 : Étendre `getWallet()` + créer `getPaywallStatus()`

**Fichier :** `src/lib/credits/wallet.ts`

### 3a. Modifier `getWallet()` — ajouter `has_purchased` dans le SELECT et le retour

```typescript
// AVANT
export async function getWallet(
  userId: string,
): Promise<{ balance: number; signupBonusGranted: boolean } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("balance, signup_bonus_granted")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    balance: data.balance,
    signupBonusGranted: data.signup_bonus_granted,
  };
}
```

```typescript
// APRÈS
export async function getWallet(
  userId: string,
): Promise<{ balance: number; signupBonusGranted: boolean; hasPurchased: boolean } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("balance, signup_bonus_granted, has_purchased")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    balance: data.balance,
    signupBonusGranted: data.signup_bonus_granted,
    hasPurchased: data.has_purchased,
  };
}
```

### 3b. Ajouter `PaywallStatus` et `getPaywallStatus()` à la fin du fichier, AVANT `listTransactions()`

```typescript
export interface PaywallStatus {
  shouldBlock: boolean;
  reason: "trial_expired" | "ok_trial" | "ok_paid";
  balance: number;
  hasPurchased: boolean;
}

export async function getPaywallStatus(userId: string): Promise<PaywallStatus> {
  const wallet = await getWallet(userId);

  if (!wallet) {
    return { shouldBlock: true, reason: "trial_expired", balance: 0, hasPurchased: false };
  }

  if (wallet.hasPurchased) {
    return { shouldBlock: false, reason: "ok_paid", balance: wallet.balance, hasPurchased: true };
  }

  if (wallet.balance > 0) {
    return { shouldBlock: false, reason: "ok_trial", balance: wallet.balance, hasPurchased: false };
  }

  return { shouldBlock: true, reason: "trial_expired", balance: 0, hasPurchased: false };
}
```

**Dépendances :** Étape 2.
**Acceptation :** `npm run build` sans erreur. Les exports `PaywallStatus` et `getPaywallStatus` sont disponibles.

---

## Étape 4 : Guard paywall dans le dashboard layout

**Fichier :** `src/app/(dashboard)/layout.tsx`

### 4a. Ajouter l'import en tête de fichier

```typescript
// Ajouter après les imports existants
import { getPaywallStatus } from "@/lib/credits/wallet";
```

### 4b. Ajouter le check paywall juste APRÈS `if (!user) { redirect("/login"); }` et AVANT `const { data: profile }`

```typescript
  // EXISTANT
  if (!user) {
    redirect("/login");
  }

  // ← INSÉRER ICI
  const paywallStatus = await getPaywallStatus(user.id);
  if (paywallStatus.shouldBlock) {
    redirect("/paywall");
  }

  // EXISTANT (ne pas toucher)
  const { data: profile } = await supabase
    .from("users")
    .select(
      "business_name, phone, business_address, quote_prefix, invoice_prefix, vat_rate_percent, legal_mentions, currency"
    )
    .eq("id", user.id)
    .single();
```

**Ne rien changer d'autre dans ce fichier.**

**Dépendances :** Étape 3.
**Acceptation :** Un user avec `has_purchased=false` et `balance=0` qui accède à `/dashboard` est redirigé vers `/paywall`. Un user en trial (balance > 0) accède normalement. Un user payant accède toujours.

---

## Étape 5 : Protéger `/paywall` dans le middleware

**Fichier :** `src/lib/supabase/middleware.ts`

Ajouter `"/paywall"` dans le tableau `protectedPrefixes` :

```typescript
// AVANT
  const protectedPrefixes = [
    "/dashboard",
    "/invoices",
    "/settings",
    "/home",
    "/subscribe",
    "/admin",
    "/panel",
  ];
```

```typescript
// APRÈS
  const protectedPrefixes = [
    "/dashboard",
    "/invoices",
    "/settings",
    "/home",
    "/subscribe",
    "/admin",
    "/panel",
    "/paywall",
  ];
```

**Dépendances :** Aucune (parallélisable).
**Acceptation :** Accès à `/paywall` sans session → redirect `/login?redirect=%2Fpaywall`.

---

## Étape 6 : Créer la page `/paywall`

**Deux fichiers à créer :**

### 6a. `src/app/paywall/page.tsx` (Server Component)

```typescript
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaywallStatus } from "@/lib/credits/wallet";
import { listPacks } from "@/lib/credits/packs";
import { PaywallContent } from "./paywall-content";

export function generateMetadata() {
  return {
    title: "Choisissez un pack — Billo",
    robots: { index: false, follow: false },
  };
}

export default async function PaywallPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const status = await getPaywallStatus(user.id);
  if (!status.shouldBlock) redirect("/dashboard");

  const packs = await listPacks();

  return <PaywallContent packs={packs} />;
}
```

### 6b. `src/app/paywall/paywall-content.tsx` (Client Component)

```typescript
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/i18n/context";
import { useCurrency } from "@/hooks/use-currency";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { cn } from "@/lib/utils";

interface CreditPack {
  id: string;
  slug: string;
  displayName: string;
  creditsAmount: number;
  bonusCredits: number;
  priceUsdCents: number;
  priceXof: number;
  isActive: boolean;
  sortOrder: number;
}

interface PaywallContentProps {
  packs: CreditPack[];
}

function formatPrice(currency: string, priceXof: number, priceUsdCents: number): string {
  if (currency === "XOF") {
    return `${priceXof.toLocaleString("fr-FR")} FCFA`;
  }
  const dollars = priceUsdCents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PaywallContent({ packs }: PaywallContentProps) {
  const { t } = useLanguage();
  const { currency } = useCurrency();

  const activePacks = packs
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted to-background px-4 py-12">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2.5"
        aria-label="Billo — Accueil"
      >
        <BilloLogoMark className="h-9 w-9" size={36} />
        <span className="text-lg font-bold text-brand">Billo</span>
      </Link>

      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
          <Zap className="h-3 w-3" aria-hidden />
          {t("paywall.badge")}
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          {t("paywall.title")}
        </h1>

        <p className="mt-3 text-base text-muted-foreground">
          {t("paywall.subtitle")}
        </p>
      </div>

      <div className="mx-auto mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {activePacks.map((pack) => {
          const totalCredits = pack.creditsAmount + pack.bonusCredits;
          const isPopular = pack.slug === "populaire";

          return (
            <div
              key={pack.id}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg",
                isPopular
                  ? "border-primary/50 bg-primary/5 shadow-md"
                  : "border-border bg-card",
              )}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                  {t("paywall.popular")}
                </span>
              )}

              <h3 className="text-lg font-bold text-foreground">
                {pack.displayName}
              </h3>

              <p className="mt-3 text-3xl font-black tabular-nums text-foreground">
                {formatPrice(currency, pack.priceXof, pack.priceUsdCents)}
              </p>

              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" aria-hidden />
                <span className="text-sm font-semibold text-foreground">
                  {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
                </span>
                {pack.bonusCredits > 0 && (
                  <span className="text-xs text-muted-foreground">
                    (dont {pack.bonusCredits} offerts)
                  </span>
                )}
              </div>

              <ul className="mt-4 flex flex-col gap-2">
                {[
                  t("paywall.featureVoice"),
                  t("paywall.featureExport"),
                  t("paywall.featureNoExpiry"),
                ].map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                className={cn(
                  "mt-6 w-full gap-2",
                  isPopular && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
                variant={isPopular ? "default" : "outline"}
              >
                <Link href={`/credits/buy/${pack.slug}`}>
                  {t("paywall.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
        {t("paywall.singlePayment")}
      </div>
    </div>
  );
}
```

**Dépendances :** Étapes 3, 5, 10 (clés i18n).
**Acceptation :** Naviguer vers `/paywall` en tant que user trial expiré → page s'affiche avec les 3 packs et les prix dans la devise détectée. User payant → redirigé `/dashboard`. User non-auth → redirigé `/login`.

---

## Étape 7 : Mettre à jour la redirection post-auth

**Fichiers à modifier :**

### 7a. `src/app/api/subscription/status/route.ts`

Réécrire le handler pour retourner le statut paywall réel au lieu de toujours `true` :

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaywallStatus } from "@/lib/credits/wallet";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasSubscription: false });
  }

  const status = await getPaywallStatus(user.id);
  return NextResponse.json({ hasSubscription: !status.shouldBlock });
}
```

### 7b. `src/lib/subscription/post-auth-redirect.ts`

Modifier le fallback pour rediriger vers `/paywall` au lieu de `/subscribe` :

```typescript
// AVANT
export async function getPostAuthPath(): Promise<string> {
  try {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return "/subscribe";
    const data = (await res.json()) as { hasSubscription?: boolean };
    return data.hasSubscription ? "/dashboard" : "/subscribe";
  } catch {
    return "/subscribe";
  }
}
```

```typescript
// APRÈS
export async function getPostAuthPath(): Promise<string> {
  try {
    const res = await fetch("/api/subscription/status");
    if (!res.ok) return "/paywall";
    const data = (await res.json()) as { hasSubscription?: boolean };
    return data.hasSubscription ? "/dashboard" : "/paywall";
  } catch {
    return "/paywall";
  }
}
```

**Aucune modification nécessaire dans `login/page.tsx` ni `register/page.tsx`** — ils appellent déjà `getPostAuthPath()` et font `router.push(nextPath)`. Le changement de route `/subscribe` → `/paywall` se propage automatiquement.

**Dépendances :** Étape 3.
**Acceptation :** Login d'un user trial expiré → redirigé vers `/paywall`. Login d'un user payant → `/dashboard`. Register (nouveau user, 3 crédits bonus) → `/dashboard` (car `has_purchased=false` mais `balance=3 > 0`, donc `shouldBlock=false`, donc `hasSubscription=true`).

---

## Étape 8 : Refactoriser le checkout — auto-sélection provider

**Fichier :** `src/app/(auth)/credits/buy/[packSlug]/checkout-client.tsx`

**Objectif :** Remplacer les deux boutons provider par UN seul bouton primaire basé sur la devise détectée, avec un lien secondaire pour l'autre méthode.

**Remplacer le fichier entier par :**

```typescript
"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Loader2,
  Shield,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Zap,
} from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { useCurrency } from "@/hooks/use-currency";
import { initiateFedaPayPurchase, getLemonSqueezyUrl } from "./actions";

interface CreditPack {
  id: string;
  slug: string;
  displayName: string;
  creditsAmount: number;
  bonusCredits: number;
  priceUsdCents: number;
  priceXof: number;
  isActive: boolean;
  sortOrder: number;
}

interface CheckoutClientProps {
  pack: CreditPack;
  userId: string;
}

function formatXof(amount: number): string {
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

function formatUsd(cents: number): string {
  const dollars = cents / 100;
  return dollars % 1 === 0
    ? `$${dollars.toLocaleString("en-US")}`
    : `$${dollars.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CheckoutClient({ pack, userId }: CheckoutClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAlternative, setShowAlternative] = useState(false);
  const { currency } = useCurrency();

  const isAfrican = currency === "XOF";
  const totalCredits = pack.creditsAmount + pack.bonusCredits;

  const handleFedaPay = async () => {
    setIsLoading(true);
    try {
      const result = await initiateFedaPayPurchase(pack.slug);
      if (result?.error) {
        toast.error("Erreur de paiement", { description: result.error });
        setIsLoading(false);
      }
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setIsLoading(false);
    }
  };

  const handleLemonSqueezy = async () => {
    setIsLoading(true);
    try {
      const result = await getLemonSqueezyUrl(pack.slug, userId);
      if ("error" in result) {
        toast.error("Erreur", { description: result.error });
        setIsLoading(false);
        return;
      }
      window.location.href = result.url;
    } catch {
      toast.error("Une erreur inattendue s'est produite.");
      setIsLoading(false);
    }
  };

  const handlePrimaryPayment = isAfrican ? handleFedaPay : handleLemonSqueezy;
  const handleAlternativePayment = isAfrican ? handleLemonSqueezy : handleFedaPay;

  const primaryLabel = isAfrican ? "Payer avec Mobile Money" : "Payer par carte";
  const primaryIcon = isAfrican ? Smartphone : CreditCard;
  const primaryPrice = isAfrican ? formatXof(pack.priceXof) : formatUsd(pack.priceUsdCents);
  const primarySubtext = isAfrican ? "MTN Money · Moov Money · Carte locale" : "Visa · Mastercard · Apple Pay · Google Pay";
  const PrimaryIcon = primaryIcon;

  const altLabel = isAfrican ? "Payer par carte internationale" : "Payer avec Mobile Money (Afrique)";
  const altPrice = isAfrican ? formatUsd(pack.priceUsdCents) : formatXof(pack.priceXof);

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted to-background">
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="flex items-center gap-2.5" aria-label="Billo — Accueil">
              <BilloLogoMark className="h-9 w-9" size={36} />
              <span className="text-lg font-bold text-brand">Billo</span>
            </Link>
            <Link
              href="/pricing"
              className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-brand"
              aria-label="Retour aux packs"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
              Retour aux packs
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            Paiement sécurisé
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left: payment */}
          <div className="min-w-0 lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-border/90 bg-card p-6 shadow-md shadow-border/30 sm:p-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Finaliser votre achat
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {primarySubtext}
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* Primary provider */}
                <Button
                  onClick={() => void handlePrimaryPayment()}
                  disabled={isLoading}
                  className="h-14 w-full gap-3 rounded-xl text-base"
                  size="lg"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    <PrimaryIcon className="h-5 w-5" aria-hidden />
                  )}
                  {primaryLabel} — {primaryPrice}
                </Button>

                {/* Alternative toggle */}
                {!showAlternative ? (
                  <button
                    type="button"
                    onClick={() => setShowAlternative(true)}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    Autre méthode de paiement
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleAlternativePayment()}
                    disabled={isLoading}
                    className={cn(
                      "flex w-full flex-col rounded-xl border-2 p-5 text-left transition-all",
                      "border-border bg-card hover:border-brand/50 hover:bg-muted/50 disabled:opacity-60",
                    )}
                  >
                    <p className="font-semibold text-foreground">{altLabel}</p>
                    <p className="mt-1 text-lg font-black tabular-nums text-foreground">
                      {altPrice}
                    </p>
                  </button>
                )}
              </div>

              <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground/60">
                Les crédits sont ajoutés immédiatement après confirmation du paiement.
              </p>
            </div>
          </div>

          {/* Right: order summary */}
          <div className="min-w-0 lg:col-span-5">
            <Card className="rounded-2xl border-border/90 p-6 shadow-md shadow-border/30 sm:p-8 lg:sticky lg:top-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Récapitulatif
              </h2>

              <div className="mt-5 border-b border-border pb-5">
                <span className="text-lg font-bold text-foreground">
                  Pack {pack.displayName}
                </span>
                <div className="mt-2 flex items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-semibold text-primary">
                    <Zap className="h-3.5 w-3.5" aria-hidden />
                    {totalCredits} crédit{totalCredits > 1 ? "s" : ""}
                  </span>
                  {pack.bonusCredits > 0 && (
                    <span className="text-xs text-muted-foreground">
                      dont {pack.bonusCredits} offerts
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Inclus
                </p>
                <ul className="flex flex-col gap-2.5">
                  {[
                    `${pack.creditsAmount} crédits${pack.bonusCredits > 0 ? ` + ${pack.bonusCredits} offerts` : ""}`,
                    "Assistant vocal pour créer vos factures",
                    "Édition et personnalisation complète",
                    "Export PDF professionnel",
                    "Crédits sans expiration",
                  ].map((feature) => (
                    <li key={feature} className="flex gap-2.5 text-sm leading-snug text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted px-4 py-3">
                <span className="font-semibold text-foreground/80">Total</span>
                <p className="text-xl font-black tabular-nums text-foreground">
                  {primaryPrice}
                </p>
              </div>

              <p className="mt-4 text-center text-xs text-muted-foreground/60">
                Paiement unique · Pas d&apos;abonnement
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Dépendances :** Aucune (parallélisable).
**Acceptation :** User avec cookie `user-currency=XOF` → bouton primaire "Payer avec Mobile Money — X FCFA". User `USD` → bouton "Payer par carte — $X". Le lien "Autre méthode" révèle l'alternative.

---

## Étape 9 : Mettre à jour le modal crédits insuffisants

**Fichier :** `src/components/credits/insufficient-credits-modal.tsx`

### 9a. Ajouter prop `hasPurchased` à l'interface

```typescript
// AVANT
interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}
```

```typescript
// APRÈS
interface InsufficientCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
  hasPurchased?: boolean;
}
```

### 9b. Mettre à jour le destructuring

```typescript
// AVANT
export function InsufficientCreditsModal({
  open,
  onOpenChange,
  currentBalance,
}: InsufficientCreditsModalProps) {
```

```typescript
// APRÈS
export function InsufficientCreditsModal({
  open,
  onOpenChange,
  currentBalance,
  hasPurchased = false,
}: InsufficientCreditsModalProps) {
```

### 9c. Modifier le texte descriptif

```typescript
// AVANT
        <p className="text-sm text-muted-foreground">
          Vous n&apos;avez plus de crédits disponibles. Achetez un pack pour
          continuer à créer vos factures et devis.
        </p>
```

```typescript
// APRÈS
        <p className="text-sm text-muted-foreground">
          {hasPurchased
            ? "Votre solde est insuffisant pour cette action. Rechargez vos crédits pour continuer."
            : "Vous avez utilisé vos 3 crédits gratuits. Achetez un pack pour continuer à créer vos factures et devis."}
        </p>
```

### 9d. Modifier le bouton CTA dans le DialogFooter

```typescript
// AVANT
          <Button asChild className="gap-2">
            <Link href="/pricing">
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              Voir les packs
            </Link>
          </Button>
```

```typescript
// APRÈS
          <Button asChild className="gap-2">
            <Link href={hasPurchased ? "/pricing" : "/paywall"}>
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              {hasPurchased ? "Recharger mes crédits" : "Choisir un pack"}
            </Link>
          </Button>
```

### 9e. Mettre à jour les appelants

Les fichiers qui importent ce modal et doivent passer `hasPurchased` :
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/components/voice/voice-button.tsx`

Inspecter comment `currentBalance` arrive déjà dans ces composants pour déterminer le pattern le plus simple pour passer `hasPurchased`. Si `currentBalance` vient d'un context/provider, ajouter `hasPurchased` au même provider. Sinon, passer en prop.

**Dépendances :** Étape 3.
**Acceptation :** Modal avec `hasPurchased=false` → "Vous avez utilisé vos 3 crédits gratuits" + CTA vers `/paywall`. Avec `hasPurchased=true` → "Votre solde est insuffisant" + CTA vers `/pricing`.

---

## Étape 10 : Clés i18n

**Fichiers :** `src/i18n/messages/fr.json` et `src/i18n/messages/en.json`

**Note :** Inspecter d'abord la structure existante (profondeur de nesting, conventions de nommage) pour s'y conformer.

### Ajouter dans `fr.json` (au niveau racine du JSON, comme namespace `paywall`) :

```json
"paywall": {
  "badge": "Essai terminé",
  "title": "Votre essai gratuit est terminé",
  "subtitle": "Vous avez utilisé vos 3 crédits offerts. Choisissez un pack pour continuer à créer vos documents professionnels.",
  "popular": "Populaire",
  "cta": "Choisir ce pack",
  "singlePayment": "Paiement unique · Pas d'abonnement · Crédits sans expiration",
  "featureVoice": "Assistant vocal pour vos factures",
  "featureExport": "Export PDF professionnel",
  "featureNoExpiry": "Crédits sans expiration"
}
```

### Ajouter dans `en.json` :

```json
"paywall": {
  "badge": "Trial ended",
  "title": "Your free trial has ended",
  "subtitle": "You've used your 3 free credits. Choose a pack to continue creating your professional documents.",
  "popular": "Popular",
  "cta": "Choose this pack",
  "singlePayment": "One-time payment · No subscription · Credits never expire",
  "featureVoice": "Voice assistant for your invoices",
  "featureExport": "Professional PDF export",
  "featureNoExpiry": "Credits never expire"
}
```

**Dépendances :** Aucune (parallélisable).
**Acceptation :** `npm run build` sans clé i18n manquante. La page `/paywall` affiche les textes en FR et EN.

---

## Étape 11 : Nettoyage

### 11a. Vérifier `quota-exceeded-modal.tsx`

D'après l'exploration : **aucun import actif trouvé**. Ne pas supprimer le fichier.

### 11b. Vérifier la page de succès post-paiement

Le fichier `src/app/(auth)/credits/buy/[packSlug]/success/page.tsx` (s'il existe) doit rediriger vers `/dashboard` après paiement confirmé. Comme le trigger DB met `has_purchased=true` lors du `grant_credits()`, le dashboard layout ne bloquera plus l'utilisateur. **Aucune modification nécessaire si la page renvoie vers `/dashboard`.**

### 11c. Variables d'environnement

**Aucune nouvelle variable n'est requise.** Vérifier que `.env.example` documente les variables existantes :

```
# FedaPay (Afrique / Mobile Money)
FEDAPAY_PUBLIC_KEY=
FEDAPAY_SECRET_KEY=
FEDAPAY_WEBHOOK_SECRET=

# LemonSqueezy (International / Carte)
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_STARTER_USD=    # Product Variant ID depuis le dashboard LemonSqueezy
LEMONSQUEEZY_VARIANT_POPULAIRE_USD=  # Product Variant ID depuis le dashboard LemonSqueezy
LEMONSQUEEZY_VARIANT_PRO_USD=        # Product Variant ID depuis le dashboard LemonSqueezy
```

**Dépendances :** Toutes les étapes précédentes.
**Acceptation :** `npm run build` exit code 0. `ReadLints` propre sur tous les fichiers modifiés.

---

## Ordre d'exécution

```
Étape 1  (migration SQL)                           ← en premier
    ↓
Étape 2  (types.ts)
    ↓
Étape 3  (wallet.ts — getWallet + getPaywallStatus)
    ↓
┌────────────────┬────────────────┬────────────────┐
│ Étape 4        │ Étape 5        │ Étape 8        │
│ (layout guard) │ (middleware)   │ (checkout)     │
└───────┬────────┴───────┬────────┴───────┬────────┘
        ↓                ↓                ↓
┌────────────────┬────────────────┬────────────────┐
│ Étape 6        │ Étape 7        │ Étape 9        │
│ (page paywall) │ (post-auth)    │ (modal)        │
└───────┬────────┴───────┬────────┴───────┬────────┘
        ↓                ↓                ↓
        Étape 10 (i18n)
            ↓
        Étape 11 (nettoyage + vérif)
```

**Parallélisables :** 4+5+8, puis 6+7+9, puis 10.

---

## Checklist de validation finale

| # | Vérification | Méthode |
|---|---|---|
| 1 | Migration SQL exécutée | `SELECT has_purchased FROM credit_wallets LIMIT 1` retourne un résultat |
| 2 | Trigger DB fonctionne | Insérer une transaction `kind='purchase'` → `has_purchased` passe à `true` |
| 3 | Build TypeScript passe | `npm run build` — exit code 0 |
| 4 | Linter propre | `ReadLints` sur chaque fichier modifié/créé |
| 5 | Aucun `console.log` de debug | Rechercher dans les fichiers modifiés |
| 6 | Smoke test — nouveau user | Register → 3 crédits → dashboard OK → consommer 3 → refresh → `/paywall` |
| 7 | Smoke test — achat paywall | Sur `/paywall` → clic pack → checkout → paiement → webhook → `/dashboard` accessible |
| 8 | Smoke test — user payant balance 0 | Dashboard accessible → action → modal "Recharger" (PAS paywall) |
| 9 | Smoke test — login redirect | Login user trial expiré → `/paywall` ; login user payant → `/dashboard` |
| 10 | Devise auto-détectée | User XOF → bouton Mobile Money ; user USD → bouton Carte |
| 11 | i18n complet FR/EN | Pages affichent les textes dans les deux langues |
| 12 | RLS OK | La policy SELECT existante sur `credit_wallets` couvre `has_purchased` (vérifié : `SELECT *` ou liste de colonnes) |
| 13 | Webhooks inchangés | FedaPay et LemonSqueezy fonctionnent exactement comme avant (le trigger gère `has_purchased`) |

---

## Résumé des fichiers touchés

| Action | Fichier |
|---|---|
| **CRÉER** | `supabase/migrations/016_has_purchased.sql` |
| **CRÉER** | `src/app/paywall/page.tsx` |
| **CRÉER** | `src/app/paywall/paywall-content.tsx` |
| **MODIFIER** | `src/lib/supabase/types.ts` (ajouter `has_purchased`) |
| **MODIFIER** | `src/lib/credits/wallet.ts` (étendre `getWallet` + ajouter `getPaywallStatus`) |
| **MODIFIER** | `src/app/(dashboard)/layout.tsx` (ajouter guard paywall) |
| **MODIFIER** | `src/lib/supabase/middleware.ts` (ajouter `/paywall` aux routes protégées) |
| **MODIFIER** | `src/app/api/subscription/status/route.ts` (retourner statut réel) |
| **MODIFIER** | `src/lib/subscription/post-auth-redirect.ts` (`/subscribe` → `/paywall`) |
| **MODIFIER** | `src/app/(auth)/credits/buy/[packSlug]/checkout-client.tsx` (auto-provider) |
| **MODIFIER** | `src/components/credits/insufficient-credits-modal.tsx` (CTA conditionnel) |
| **MODIFIER** | `src/i18n/messages/fr.json` (clés `paywall.*`) |
| **MODIFIER** | `src/i18n/messages/en.json` (clés `paywall.*`) |

**Fichiers NON touchés (par design) :**
- `src/app/api/webhooks/fedapay/route.ts` — le trigger DB gère `has_purchased`
- `src/app/api/webhooks/lemonsqueezy/route.ts` — idem
- `src/lib/credits/grant.ts` — inchangé
- `src/app/(auth)/login/page.tsx` — appelle déjà `getPostAuthPath()`
- `src/app/(auth)/register/page.tsx` — idem
