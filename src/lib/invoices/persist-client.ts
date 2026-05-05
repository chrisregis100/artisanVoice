"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { DocumentStatus, DocumentType, InvoiceItem } from "@/types";

type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];

export interface UpsertInvoicePayload {
  userId: string;
  invoiceId: string;
  customerName: string;
  items: InvoiceItem[];
  total: number;
  type: DocumentType;
  status: DocumentStatus;
  sentAtIso?: string | null;
}

export async function upsertInvoiceToSupabase(
  payload: UpsertInvoicePayload,
): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id || user.id !== payload.userId) {
    throw new Error("Unauthorized");
  }

  const { data: existing } = await supabase
    .from("invoices")
    .select("id, created_at")
    .eq("id", payload.invoiceId)
    .eq("user_id", payload.userId)
    .maybeSingle();

  const createdIso =
    (existing?.created_at as string | undefined) ?? new Date().toISOString();

  const invoiceRow: InvoiceInsert = {
    id: payload.invoiceId,
    user_id: payload.userId,
    customer_name: payload.customerName,
    type: payload.type,
    status: payload.status,
    total: payload.total,
    created_at: createdIso,
    sent_at: payload.sentAtIso ?? null,
  };

  const { error: invoiceError } = await supabase
    .from("invoices")
    .upsert(invoiceRow as never);

  if (invoiceError) throw invoiceError;

  const { data: existingItems } = await supabase
    .from("invoice_items")
    .select("id")
    .eq("invoice_id", payload.invoiceId);

  const nextIds = new Set(payload.items.map((i) => i.id));
  const staleIds =
    existingItems?.filter((row) => !nextIds.has(row.id)).map((row) => row.id) ??
    [];

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase
      .from("invoice_items")
      .delete()
      .in("id", staleIds);
    if (delErr) throw delErr;
  }

  if (payload.items.length === 0) return;

  const rows: InvoiceItemInsert[] = payload.items.map((item) => ({
    id: item.id,
    invoice_id: payload.invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .upsert(rows as never[]);

  if (itemsError) throw itemsError;
}
