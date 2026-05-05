"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import {
  db,
  getUnsyncedInvoicesForUser,
  markInvoiceSynced,
  markInvoiceSyncError,
  type LocalInvoice,
} from "./db";

type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export async function syncInvoicesToServer(): Promise<{
  synced: number;
  failed: number;
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return { synced: 0, failed: 0 };

  const unsyncedInvoices = await getUnsyncedInvoicesForUser(user.id);

  let synced = 0;
  let failed = 0;

  for (const invoice of unsyncedInvoices) {
    try {
      // Mark as syncing
      await db.invoices.update(invoice.id, { syncStatus: "syncing" });

      // Prepare invoice data
      const invoiceData: InvoiceInsert = {
        id: invoice.id,
        user_id: invoice.userId,
        customer_name: invoice.customerName,
        type: invoice.type,
        status: invoice.status,
        total: invoice.total,
        created_at: new Date(invoice.createdAt).toISOString(),
        sent_at: invoice.sentAt
          ? new Date(invoice.sentAt).toISOString()
          : null,
      };

      // Insert invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .upsert(invoiceData as never);

      if (invoiceError) throw invoiceError;

      // Insert items
      if (invoice.items.length > 0) {
        const itemsToInsert: InvoiceItemInsert[] = invoice.items.map((item) => ({
          id: item.id,
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        }));

        const { error: itemsError } = await supabase
          .from("invoice_items")
          .upsert(itemsToInsert as never[]);

        if (itemsError) throw itemsError;
      }

      // Mark as synced
      await markInvoiceSynced(invoice.id);
      synced++;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur de synchronisation";
      await markInvoiceSyncError(invoice.id, message);
      failed++;
      console.error("Sync error for invoice:", invoice.id, error);
    }
  }

  return { synced, failed };
}

interface ServerInvoice {
  id: string;
  user_id: string;
  customer_name: string;
  type: string;
  status: string;
  total: number;
  created_at: string;
  sent_at: string | null;
  invoice_items: Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
  }>;
}

export async function fetchInvoicesFromServer(
  userId: string
): Promise<LocalInvoice[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      *,
      invoice_items (*)
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const invoices = (data || []) as unknown as ServerInvoice[];

  return invoices.map((inv) => ({
    id: inv.id,
    userId: inv.user_id,
    customerName: inv.customer_name,
    customerPhone: "",
    items: (inv.invoice_items || []).map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unit_price,
    })),
    total: inv.total,
    type: inv.type as "quote" | "invoice",
    status: inv.status as "draft" | "sent" | "paid",
    syncStatus: "synced" as const,
    createdAt: new Date(inv.created_at).getTime(),
    updatedAt: new Date(inv.created_at).getTime(),
    sentAt: inv.sent_at ? new Date(inv.sent_at).getTime() : undefined,
  }));
}

export async function cacheInvoicesFromServer(userId: string): Promise<void> {
  const serverInvoices = await fetchInvoicesFromServer(userId);

  // Use a transaction to update local cache
  await db.transaction("rw", db.invoices, async () => {
    for (const invoice of serverInvoices) {
      const existing = await db.invoices.get(invoice.id);

      // Only update if server version is newer or doesn't exist locally
      if (
        !existing ||
        existing.syncStatus === "synced" ||
        existing.updatedAt < invoice.updatedAt
      ) {
        await db.invoices.put(invoice);
      }
    }
  });
}

// Check online status
export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// Set up online/offline listeners
export function setupSyncListeners(
  onSyncComplete?: (result: { synced: number; failed: number }) => void
): () => void {
  const handleOnline = async () => {
    console.log("Back online, syncing...");
    try {
      const result = await syncInvoicesToServer();
      onSyncComplete?.(result);
    } catch (error) {
      console.error("Sync failed:", error);
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }

  return () => {};
}
