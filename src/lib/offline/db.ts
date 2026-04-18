import Dexie, { type Table } from "dexie";
import type { InvoiceItem } from "@/types";

export interface LocalInvoice {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  status: "draft" | "sent" | "paid";
  syncStatus: "local" | "syncing" | "synced" | "error";
  createdAt: number;
  updatedAt: number;
  sentAt?: number;
  errorMessage?: string;
}

export interface PendingVoiceCommand {
  id: string;
  timestamp: number;
  audioBlob?: Blob;
  transcript?: string;
  processed: boolean;
  invoiceId?: string;
}

export interface CachedCustomer {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  syncStatus: "local" | "synced";
}

class BilloDB extends Dexie {
  invoices!: Table<LocalInvoice, string>;
  pendingCommands!: Table<PendingVoiceCommand, string>;
  customers!: Table<CachedCustomer, string>;

  constructor() {
    super("BilloDB");

    this.version(1).stores({
      invoices: "id, userId, syncStatus, createdAt, updatedAt",
      pendingCommands: "id, timestamp, processed, invoiceId",
      customers: "id, userId, name, syncStatus",
    });
  }
}

export const db = new BilloDB();

// Helper functions
export async function saveInvoiceLocally(
  invoice: Omit<LocalInvoice, "createdAt" | "updatedAt" | "syncStatus">
): Promise<string> {
  const now = Date.now();
  const localInvoice: LocalInvoice = {
    ...invoice,
    syncStatus: "local",
    createdAt: now,
    updatedAt: now,
  };

  await db.invoices.put(localInvoice);
  return invoice.id;
}

export async function updateInvoiceLocally(
  id: string,
  updates: Partial<LocalInvoice>
): Promise<void> {
  await db.invoices.update(id, {
    ...updates,
    updatedAt: Date.now(),
    syncStatus: "local",
  });
}

export async function getLocalInvoices(userId: string): Promise<LocalInvoice[]> {
  return db.invoices
    .where("userId")
    .equals(userId)
    .reverse()
    .sortBy("createdAt");
}

export async function getUnsyncedInvoices(): Promise<LocalInvoice[]> {
  return db.invoices.where("syncStatus").equals("local").toArray();
}

export async function markInvoiceSynced(id: string): Promise<void> {
  await db.invoices.update(id, {
    syncStatus: "synced",
    updatedAt: Date.now(),
  });
}

export async function markInvoiceSyncError(
  id: string,
  errorMessage: string
): Promise<void> {
  await db.invoices.update(id, {
    syncStatus: "error",
    errorMessage,
    updatedAt: Date.now(),
  });
}

export async function savePendingCommand(
  command: Omit<PendingVoiceCommand, "timestamp" | "processed">
): Promise<void> {
  await db.pendingCommands.put({
    ...command,
    timestamp: Date.now(),
    processed: false,
  });
}

export async function getUnprocessedCommands(): Promise<PendingVoiceCommand[]> {
  return db.pendingCommands.where("processed").equals(0).toArray();
}

export async function markCommandProcessed(id: string): Promise<void> {
  await db.pendingCommands.update(id, { processed: true });
}

export async function cacheCustomer(customer: CachedCustomer): Promise<void> {
  await db.customers.put(customer);
}

export async function getCachedCustomers(userId: string): Promise<CachedCustomer[]> {
  return db.customers.where("userId").equals(userId).toArray();
}

export async function clearLocalData(): Promise<void> {
  await Promise.all([
    db.invoices.clear(),
    db.pendingCommands.clear(),
    db.customers.clear(),
  ]);
}
