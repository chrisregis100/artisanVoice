/**
 * @deprecated Ce composant est remplacé par `src/components/credits/insufficient-credits-modal.tsx`.
 * Conserver uniquement pour éviter de casser d'éventuelles références non détectées.
 * Ne plus utiliser dans de nouveaux composants.
 */
"use client";

import Link from "next/link";
import { CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PlanCardConfig {
  planKey: string;
  nameKey: string;
  periodKey: string;
  features: [string, string, string];
  checkoutPlan: string;
  isRecommended: boolean;
}

const PLAN_CARDS: PlanCardConfig[] = [
  {
    planKey: "early_bird",
    nameKey: "pricingPage.earlyBirdName",
    periodKey: "dashboard.quota.earlyBirdPeriod",
    features: [
      "pricingPage.earlyBirdF1",
      "pricingPage.earlyBirdF2",
      "pricingPage.earlyBirdF6",
    ],
    checkoutPlan: "early_bird",
    isRecommended: true,
  },
  {
    planKey: "pro_monthly",
    nameKey: "pricingPage.proName",
    periodKey: "dashboard.quota.proPeriod",
    features: [
      "pricingPage.proF1",
      "pricingPage.proF2",
      "pricingPage.proF6",
    ],
    checkoutPlan: "pro_monthly",
    isRecommended: false,
  },
  {
    planKey: "business_monthly",
    nameKey: "pricingPage.businessName",
    periodKey: "dashboard.quota.businessPeriod",
    features: [
      "pricingPage.businessF1",
      "pricingPage.businessF3",
      "pricingPage.businessF6",
    ],
    checkoutPlan: "business_monthly",
    isRecommended: false,
  },
];

interface QuotaExceededModalProps {
  open: boolean;
  onClose: () => void;
}

export function QuotaExceededModal({ open, onClose }: QuotaExceededModalProps) {
  const { t } = useLanguage();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <DialogTitle className="text-xl font-bold">
            {t("dashboard.quota.title")}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            {t("dashboard.quota.subtitle")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLAN_CARDS.map((card) => (
            <div
              key={card.planKey}
              className={cn(
                "relative flex flex-col rounded-xl border p-4",
                card.isRecommended
                  ? "border-primary/60 bg-primary/5 ring-1 ring-primary/30"
                  : "border-border bg-card",
              )}
            >
              {card.isRecommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                  {t("common.recommended")}
                </span>
              )}

              <div className="mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  {t(card.nameKey)}
                </h3>
              </div>

              <ul className="mb-4 flex flex-col gap-1.5">
                {card.features.map((featureKey) => (
                  <li key={featureKey} className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-xs leading-snug text-foreground/80">
                      {t(featureKey)}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="sm"
                className={cn(
                  "mt-auto h-9 w-full rounded-lg text-xs font-semibold",
                  card.isRecommended
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-foreground text-background hover:bg-foreground/90",
                )}
                onClick={onClose}
              >
                <Link
                  href={`/subscribe/checkout?plan=${card.checkoutPlan}`}
                  aria-label={`${t("dashboard.quota.cta")} — ${t(card.nameKey)}`}
                >
                  {t("dashboard.quota.cta")}
                </Link>
              </Button>
            </div>
          ))}
        </div>

        <DialogFooter className="mt-2 justify-center sm:justify-center">
          <Link
            href="/pricing"
            onClick={onClose}
            className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            tabIndex={0}
          >
            {t("dashboard.quota.allPlans")}
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
