"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface RealtimeTransaction {
  id: string;
  user_id: string;
  kind: string;
  delta: number;
  balance_after: number;
  pack_id: string | null;
  payment_provider: string | null;
  payment_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseRealtimeTransactionsOptions {
  /** If provided, only notify for transactions matching this kind */
  filterKind?: string;
  /** If provided, only notify for transactions matching this provider */
  filterProvider?: string;
}

interface UseRealtimeTransactionsReturn {
  newTransactions: RealtimeTransaction[];
  ackTransaction: (id: string) => void;
}

export function useRealtimeTransactions({
  filterKind,
  filterProvider,
}: UseRealtimeTransactionsOptions = {}): UseRealtimeTransactionsReturn {
  const [newTransactions, setNewTransactions] = useState<RealtimeTransaction[]>([]);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const channelName = `admin-credit-transactions-${Date.now()}`;

    const channel = supabase.channel(channelName).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "credit_transactions",
      },
      (payload) => {
        const tx = payload.new as RealtimeTransaction;

        if (filterKind && tx.kind !== filterKind) return;
        if (filterProvider && tx.payment_provider !== filterProvider) return;

        setNewTransactions((prev) => [tx, ...prev]);
      },
    );

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [filterKind, filterProvider]);

  const ackTransaction = (id: string) => {
    setNewTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  return { newTransactions, ackTransaction };
}
