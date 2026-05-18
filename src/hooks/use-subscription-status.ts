"use client";

import { useCallback, useEffect, useState } from "react";

export interface SubscriptionStatusPayload {
  hasSubscription: boolean;
  plan: {
    name: string;
    displayName: string;
    priceAmount: number;
    currency: string;
    invoiceLimit: number | null;
    features: unknown;
  } | null;
  subscription?: {
    id: string;
    status: string;
    paymentProvider: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  } | null;
  usage?: {
    count: number;
    limit: number | null;
  };
}

export function useSubscriptionStatus() {
  const [data, setData] = useState<SubscriptionStatusPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/status");
      if (res.status === 401) {
        setData(null);
        setError("session");
        return;
      }
      if (!res.ok) {
        setError("fetch");
        setData(null);
        return;
      }
      const json = (await res.json()) as SubscriptionStatusPayload;
      setData(json);
    } catch {
      setError("fetch");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, isLoading, error, refetch };
}
