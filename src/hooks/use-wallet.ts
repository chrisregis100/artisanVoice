"use client";

import { useEffect } from "react";
import { create } from "zustand";

export interface WalletPayload {
  balance: number;
  signupBonusGranted: boolean;
  hasPurchased: boolean;
}

interface WalletState {
  data: WalletPayload | null;
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  isFetching: boolean;
  refetch: () => Promise<void>;
}

const useWalletStore = create<WalletState>((set, get) => ({
  data: null,
  isLoading: true,
  error: null,
  hasFetched: false,
  isFetching: false,
  refetch: async () => {
    if (get().isFetching) return;
    set({ isFetching: true, error: null });
    try {
      const res = await fetch("/api/credits/wallet");
      if (res.status === 401) {
        set({ data: null, error: "session", isLoading: false, isFetching: false, hasFetched: true });
        return;
      }
      if (!res.ok) {
        set({ data: null, error: "fetch", isLoading: false, isFetching: false, hasFetched: true });
        return;
      }
      const json = (await res.json()) as WalletPayload;
      set({ data: json, isLoading: false, error: null, hasFetched: true, isFetching: false });
    } catch {
      set({ data: null, error: "fetch", isLoading: false, isFetching: false, hasFetched: true });
    }
  },
}));

export function useWallet() {
  const state = useWalletStore();

  useEffect(() => {
    if (!state.hasFetched && !state.isFetching) {
      void state.refetch();
    }
  }, [state.hasFetched, state.isFetching, state.refetch]);

  return {
    data: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: state.refetch,
    balance: state.data?.balance ?? 0,
    hasPurchased: state.data?.hasPurchased ?? false,
  };
}
