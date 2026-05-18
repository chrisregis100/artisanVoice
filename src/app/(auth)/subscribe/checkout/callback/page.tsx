"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";

type VerifyStatus = "loading" | "success" | "pending" | "failure";

const REDIRECT_DELAY_MS = 3000;

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Loader2
        className="h-8 w-8 animate-spin text-brand"
        aria-label="Chargement"
      />
    </div>
  );
}

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [countdown, setCountdown] = useState(3);
  const hasVerified = useRef(false);

  const provider = searchParams.get("provider");
  const transactionId =
    searchParams.get("transaction_id") ?? searchParams.get("id");
  const urlStatus = searchParams.get("status");

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    const verify = async () => {
      if (
        urlStatus === "cancelled" ||
        urlStatus === "failed" ||
        urlStatus === "error"
      ) {
        setStatus("failure");
        return;
      }

      try {
        const params = new URLSearchParams();
        if (provider) params.set("provider", provider);
        if (transactionId) params.set("transaction_id", transactionId);

        const res = await fetch(
          `/api/subscription/verify?${params.toString()}`,
        );
        const data: { status: "success" | "pending" | "failure" } =
          await res.json();

        if (data.status === "success") {
          setStatus("success");
          toast.success("Paiement confirmé !");
        } else if (data.status === "pending") {
          setStatus("pending");
        } else {
          setStatus("failure");
        }
      } catch {
        setStatus("pending");
      }
    };

    verify();
  }, [provider, transactionId, urlStatus]);

  useEffect(() => {
    if (status !== "success") return;

    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.push("/dashboard?welcome=1");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, router]);

  return (
    <>
      <style>{`
        @keyframes checkDraw {
          from { stroke-dashoffset: 60; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        @keyframes circlePop {
          0%   { transform: scale(0.6); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes fadeSlideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .anim-circle-pop   { animation: circlePop   0.45s cubic-bezier(.34,1.56,.64,1) forwards; }
        .anim-check-draw   { animation: checkDraw   0.4s ease-out 0.3s forwards; opacity: 0; }
        .anim-fade-slide   { animation: fadeSlideUp 0.4s ease-out 0.55s forwards; opacity: 0; }
        .progress-shrink   { animation: progressBar ${REDIRECT_DELAY_MS}ms linear forwards; }
        @keyframes progressBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          {/* ── LOADING ── */}
          {status === "loading" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand/10">
                <Loader2
                  className="h-10 w-10 animate-spin text-brand"
                  aria-hidden
                />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Vérification de votre paiement…
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Veuillez patienter, nous confirmons votre transaction.
              </p>
            </>
          )}

          {/* ── SUCCESS ── */}
          {status === "success" && (
            <>
              <div className="anim-circle-pop mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
                    strokeDasharray="60"
                    className="anim-check-draw text-primary"
                  />
                </svg>
              </div>

              <div className="anim-fade-slide">
                <h2 className="text-xl font-bold text-foreground">
                  Paiement confirmé !
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bienvenue dans Billo Pro. Votre abonnement est maintenant
                  actif.
                </p>
                <p className="mt-4 text-sm font-medium text-primary">
                  Redirection dans{" "}
                  <span className="tabular-nums">{countdown}</span>{" "}
                  seconde{countdown !== 1 ? "s" : ""}…
                </p>

                <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-primary/15">
                  <div className="progress-shrink h-full rounded-full bg-primary" />
                </div>

                <Button
                  asChild
                  size="lg"
                  className="mt-6 h-11 w-full gap-2 rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                >
                  <Link href="/dashboard?welcome=1">
                    Accéder au tableau de bord →
                  </Link>
                </Button>
              </div>
            </>
          )}

          {/* ── PENDING ── */}
          {status === "pending" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/30">
                <Clock
                  className="h-10 w-10 text-amber-500 dark:text-amber-400"
                  aria-hidden
                />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Paiement en cours de traitement
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Vous recevrez une confirmation par e-mail dès validation. Votre
                abonnement sera activé automatiquement.
              </p>

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-900/40 dark:bg-amber-950/20">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Que faire maintenant ?
                </p>
                <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-500/80">
                  Vous pouvez fermer cette page. L&apos;activation se fera
                  automatiquement en quelques minutes.
                </p>
              </div>

              <Button
                asChild
                size="lg"
                className="mt-6 h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
              >
                <Link href="/dashboard">Aller au tableau de bord</Link>
              </Button>
            </>
          )}

          {/* ── FAILURE ── */}
          {status === "failure" && (
            <>
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertCircle
                  className="h-10 w-10 text-red-500 dark:text-red-400"
                  aria-hidden
                />
              </div>
              <h2 className="text-xl font-bold text-foreground">
                Échec du paiement
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Le paiement n&apos;a pas pu être validé. Aucun montant n&apos;a
                été débité.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Button
                  asChild
                  size="lg"
                  className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                >
                  <Link href="/subscribe/checkout">Réessayer le paiement</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-11 w-full rounded-xl font-semibold"
                >
                  <Link href="/subscribe">Choisir un autre plan</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CallbackContent />
    </Suspense>
  );
}
