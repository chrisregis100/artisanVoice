import Link from "next/link";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { fetchFedaPayTransaction } from "@/lib/payment/fedapay";
import {
  fetchLemonSqueezyOrder,
  resolvePackSlugFromVariant,
} from "@/lib/payment/lemonsqueezy";
import { grantCredits } from "@/lib/credits/grant";
import { getPackAdmin } from "@/lib/credits/packs";

export const metadata: Metadata = {
  title: "Confirmation de paiement",
};

type GrantStatus =
  | "granted"
  | "already_credited"
  | "pending"
  | "error"
  | "no_verification";

interface VerifyResult {
  status: GrantStatus;
  creditsGranted?: number;
}

/**
 * Attempt to verify the payment with the provider and grant credits.
 * Idempotent: safe to call even if the webhook already processed the transaction.
 */
async function verifyAndGrantCredits(params: {
  userId: string;
  provider: string;
  transactionId: string;
  packSlug: string;
}): Promise<VerifyResult> {
  const { userId, provider, transactionId, packSlug } = params;

  // ── FedaPay ──────────────────────────────────────────────────────────────────
  if (provider === "fedapay") {
    let tx: Awaited<ReturnType<typeof fetchFedaPayTransaction>>;
    try {
      tx = await fetchFedaPayTransaction(transactionId);
    } catch (err) {
      console.error("[success/fedapay] fetchFedaPayTransaction failed", {
        transactionId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { status: "error" };
    }

    const isApproved =
      tx.status === "approved" || tx.status === "transferred";
    if (!isApproved) {
      return { status: "pending" };
    }

    // Security: the transaction must belong to the authenticated user.
    if (!tx.metadata?.user_id || tx.metadata.user_id !== userId) {
      console.error("[success/fedapay] user_id mismatch", {
        txUserId: tx.metadata?.user_id,
        sessionUserId: userId,
        transactionId,
      });
      return { status: "error" };
    }

    const effectiveSlug = tx.metadata.pack_slug ?? packSlug;
    const pack = await getPackAdmin(effectiveSlug);
    if (!pack) {
      console.error("[success/fedapay] Pack not found", {
        effectiveSlug,
        transactionId,
      });
      return { status: "error" };
    }

    const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

    try {
      await grantCredits({
        userId,
        amount: creditsToGrant,
        kind: "purchase",
        packId: tx.metadata.pack_id ?? pack.id,
        paymentProvider: "fedapay",
        paymentReference: String(tx.id),
        metadata: { pack_slug: effectiveSlug, source: "success_page_fallback" },
      });

      revalidatePath("/dashboard");
      revalidatePath("/credits", "layout");
      revalidatePath("/credits/buy", "layout");

      return { status: "granted", creditsGranted: creditsToGrant };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      // Idempotence: the updated RPC returns cleanly for duplicates, but if the
      // migration hasn't been applied yet the old RPC throws 23505.
      if (
        message.includes("unique") ||
        message.includes("duplicate") ||
        message.includes("already") ||
        message.includes("23505")
      ) {
        return { status: "already_credited", creditsGranted: creditsToGrant };
      }

      console.error("[success/fedapay] grantCredits failed", {
        userId,
        transactionId,
        error: message,
      });
      return { status: "error" };
    }
  }

  // ── LemonSqueezy ─────────────────────────────────────────────────────────────
  if (provider === "lemonsqueezy") {
    let order: Awaited<ReturnType<typeof fetchLemonSqueezyOrder>>;
    try {
      order = await fetchLemonSqueezyOrder(transactionId);
    } catch (err) {
      console.error("[success/lemonsqueezy] fetchLemonSqueezyOrder failed", {
        orderId: transactionId,
        error: err instanceof Error ? err.message : String(err),
      });
      return { status: "error" };
    }

    if (order.status !== "paid") {
      return { status: "pending" };
    }

    // Resolve pack from variant ID (more secure than trusting the URL slug alone).
    const resolvedSlug =
      order.variantId !== null
        ? resolvePackSlugFromVariant(String(order.variantId))
        : null;
    const effectiveSlug = resolvedSlug ?? packSlug;

    const pack = await getPackAdmin(effectiveSlug);
    if (!pack) {
      console.error("[success/lemonsqueezy] Pack not found", {
        effectiveSlug,
        orderId: transactionId,
      });
      return { status: "error" };
    }

    const creditsToGrant = pack.creditsAmount + pack.bonusCredits;

    try {
      await grantCredits({
        userId,
        amount: creditsToGrant,
        kind: "purchase",
        packId: pack.id,
        paymentProvider: "lemonsqueezy",
        paymentReference: order.id,
        metadata: { pack_slug: effectiveSlug, source: "success_page_fallback" },
      });

      revalidatePath("/dashboard");
      revalidatePath("/credits", "layout");
      revalidatePath("/credits/buy", "layout");

      return { status: "granted", creditsGranted: creditsToGrant };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      if (
        message.includes("unique") ||
        message.includes("duplicate") ||
        message.includes("already") ||
        message.includes("23505")
      ) {
        return { status: "already_credited", creditsGranted: creditsToGrant };
      }

      console.error("[success/lemonsqueezy] grantCredits failed", {
        userId,
        orderId: transactionId,
        error: message,
      });
      return { status: "error" };
    }
  }

  return { status: "no_verification" };
}

interface PageProps {
  params: Promise<{ packSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CreditsBuySuccessPage({
  params,
  searchParams,
}: PageProps) {
  const { packSlug } = await params;
  const sp = await searchParams;

  // FedaPay appends ?id=<tx_id>; LemonSqueezy appends ?order_id=<order_id>
  const txId = typeof sp.id === "string" ? sp.id : null;
  const orderId = typeof sp.order_id === "string" ? sp.order_id : null;

  // FedaPay sometimes overwrites the entire callback URL query string when
  // redirecting, stripping our ?provider=fedapay param. Detect provider from
  // which identifier parameter is present when the explicit param is missing.
  const rawProvider = typeof sp.provider === "string" ? sp.provider : "";
  const provider = rawProvider || (txId ? "fedapay" : orderId ? "lemonsqueezy" : "");

  const transactionId =
    provider === "fedapay" ? txId : provider === "lemonsqueezy" ? orderId : null;

  let result: VerifyResult = { status: "no_verification" };

  if (transactionId) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      result = await verifyAndGrantCredits({
        userId: user.id,
        provider,
        transactionId,
        packSlug,
      });
    }
  }

  const isSuccess =
    result.status === "granted" || result.status === "already_credited";
  const isPending = result.status === "pending";
  const isError = result.status === "error";

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {/* Icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
          {isSuccess && (
            <svg
              viewBox="0 0 52 52"
              className="h-11 w-11"
              fill="none"
              aria-hidden
            >
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary/30"
              />
              <polyline
                points="14,27 22,35 38,18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              />
            </svg>
          )}
          {isPending && (
            <svg
              viewBox="0 0 52 52"
              className="h-11 w-11"
              fill="none"
              aria-hidden
            >
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-amber-400/50"
              />
              <circle cx="26" cy="26" r="3" fill="currentColor" className="text-amber-400" />
              <line
                x1="26"
                y1="14"
                x2="26"
                y2="26"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-amber-400"
              />
            </svg>
          )}
          {result.status === "no_verification" && (
            <svg
              viewBox="0 0 52 52"
              className="h-11 w-11"
              fill="none"
              aria-hidden
            >
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-primary/30"
              />
              <polyline
                points="14,27 22,35 38,18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary"
              />
            </svg>
          )}
          {isError && (
            <svg
              viewBox="0 0 52 52"
              className="h-11 w-11"
              fill="none"
              aria-hidden
            >
              <circle
                cx="26"
                cy="26"
                r="24"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-amber-400/50"
              />
              <line
                x1="26"
                y1="16"
                x2="26"
                y2="30"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="text-amber-400"
              />
              <circle cx="26" cy="37" r="2.5" fill="currentColor" className="text-amber-400" />
            </svg>
          )}
        </div>

        {isSuccess && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              {result.status === "granted" ? "Crédits ajoutés !" : "Crédits confirmés !"}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {result.status === "granted"
                ? `${result.creditsGranted ?? ""} crédit${(result.creditsGranted ?? 0) > 1 ? "s" : ""} ont été ajoutés à votre compte.`
                : "Votre paiement avait déjà été traité. Vos crédits sont bien présents sur votre compte."}
            </p>
          </>
        )}

        {isPending && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              Paiement en cours
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Votre paiement est en cours de validation. Vos crédits arriveront
              dans quelques instants — actualisez le tableau de bord après une
              minute si besoin.
            </p>
          </>
        )}

        {isError && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              Vérification en attente
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Votre paiement a bien été reçu mais la confirmation automatique n&apos;a
              pas pu aboutir. Vos crédits seront ajoutés sous peu via notre système
              de webhooks. Si ce n&apos;est pas le cas dans 5 minutes, contactez le
              support.
            </p>
          </>
        )}

        {result.status === "no_verification" && (
          <>
            <h1 className="text-2xl font-bold text-foreground">
              Paiement reçu
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Votre paiement a bien été reçu. Vos crédits seront ajoutés
              automatiquement dans quelques instants via notre système de
              confirmation. Actualisez le tableau de bord après une minute si
              besoin.
            </p>
          </>
        )}

        <p className="mt-4 text-xs text-muted-foreground/70">
          Si vos crédits n&apos;apparaissent pas immédiatement, patientez quelques
          instants — le traitement peut prendre une minute.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
          >
            <Link href="/dashboard">Accéder au tableau de bord →</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-xl font-semibold"
          >
            <Link href="/pricing">Acheter d&apos;autres crédits</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
