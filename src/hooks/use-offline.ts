"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  db,
  saveInvoiceLocally,
  updateInvoiceLocally,
  getLocalInvoices,
  type LocalInvoice,
} from "@/lib/offline/db";
import {
  syncInvoicesToServer,
  setupSyncListeners,
  isOnline,
} from "@/lib/offline/sync";
import { useInvoiceStore } from "@/stores/invoice-store";
import { generateId } from "@/lib/utils";

interface UseOfflineReturn {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  localInvoices: LocalInvoice[];
  saveCurrentInvoice: () => Promise<string>;
  syncNow: () => Promise<void>;
}

export function useOffline(userId: string): UseOfflineReturn {
  const [online, setOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const { customerName, customerPhone, items, total, type, id, reset } =
    useInvoiceStore();

  // Live query for local invoices
  const localInvoices = useLiveQuery(
    () => (userId ? getLocalInvoices(userId) : Promise.resolve([])),
    [userId],
    []
  );

  // Count pending invoices
  const pendingCount = useLiveQuery(
    () =>
      db.invoices.where("syncStatus").anyOf(["local", "error"]).count(),
    [],
    0
  );

  // Monitor online status
  useEffect(() => {
    setOnline(isOnline());

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Set up automatic sync
  useEffect(() => {
    const cleanup = setupSyncListeners((result) => {
      console.log("Auto-sync completed:", result);
    });

    return cleanup;
  }, []);

  // Save current invoice to local storage
  const saveCurrentInvoice = useCallback(async () => {
    if (!userId) throw new Error("User not authenticated");

    const invoiceId = id || generateId();

    await saveInvoiceLocally({
      id: invoiceId,
      userId,
      customerName,
      customerPhone,
      items,
      total,
      type,
      status: "draft",
    });

    // Try to sync immediately if online
    if (isOnline()) {
      try {
        await syncInvoicesToServer();
      } catch (error) {
        console.error("Immediate sync failed:", error);
      }
    }

    reset();
    return invoiceId;
  }, [userId, id, customerName, customerPhone, items, total, type, reset]);

  // Manual sync
  const syncNow = useCallback(async () => {
    if (!isOnline()) {
      throw new Error("Cannot sync while offline");
    }

    setIsSyncing(true);
    try {
      await syncInvoicesToServer();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return {
    isOnline: online,
    isSyncing,
    pendingCount: pendingCount || 0,
    localInvoices: localInvoices || [],
    saveCurrentInvoice,
    syncNow,
  };
}
