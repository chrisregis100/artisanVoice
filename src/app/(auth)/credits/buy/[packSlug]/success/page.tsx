import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Crédits ajoutés !",
};

interface PageProps {
  params: Promise<{ packSlug: string }>;
}

export default async function CreditsBuySuccessPage({ params }: PageProps) {
  const { packSlug } = await params;
  void packSlug;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {/* Success icon */}
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
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
        </div>

        <h1 className="text-2xl font-bold text-foreground">Crédits ajoutés !</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Votre paiement a été confirmé. Vos crédits ont été ajoutés à votre compte et sont prêts à l&apos;emploi.
        </p>

        <p className="mt-4 text-xs text-muted-foreground/70">
          Si vos crédits n&apos;apparaissent pas immédiatement, patientez quelques instants — le traitement peut prendre une minute.
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
