"use client";

import { useEffect, useState, useCallback } from "react";
import { useCurrency } from "./use-currency";

export interface PublicPlanRow {
  name: string;
  display_name: string;
  price_amount: number;
  currency: string;
  invoice_limit: number | null;
  is_active: boolean;
}

const FALLBACK_PRO_MONTHLY = 5000;

function findPlanByTierInterval(
  plans: PublicPlanRow[] | undefined | null,
  tier: string,
  interval: string,
  currency: string,
): PublicPlanRow | undefined {
  const targetName = `${tier}_${interval}_${currency.toLowerCase()}`;
  return plans?.find((p) => p.name === targetName);
}

export function usePublicPlans() {
  const [plans, setPlans] = useState<PublicPlanRow[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const { currency } = useCurrency();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/plans/public");
        if (!res.ok) throw new Error("plans fetch failed");
        const json = (await res.json()) as { plans?: PublicPlanRow[] };
        if (!cancelled) setPlans(json.plans ?? []);
      } catch {
        if (!cancelled) {
          setHasError(true);
          setPlans([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const getPlan = useCallback(
    (tier: string, interval: string): PublicPlanRow | undefined => {
      return findPlanByTierInterval(plans, tier, interval, currency);
    },
    [plans, currency],
  );

  const proMonthlyAmount =
    findPlanByTierInterval(plans, "pro", "monthly", currency)?.price_amount ??
    FALLBACK_PRO_MONTHLY;
  const isLoading = plans === null && !hasError;

  return {
    plans: plans ?? [],
    proMonthlyAmount,
    isLoading,
    hasError,
    getPlan,
  };
}
