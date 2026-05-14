"use client";

import { useCallback, useEffect, useState } from "react";

export interface WalletPayload {
  balance: number;
  signupBonusGranted: boolean;
}

export function useWallet() {
  const [data, setData] = useState<WalletPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/credits/wallet");
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
      const json = (await res.json()) as WalletPayload;
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

  return {
    data,
    isLoading,
    error,
    refetch,
    balance: data?.balance ?? 0,
  };
}
