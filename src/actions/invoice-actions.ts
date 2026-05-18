"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { calculateTotal } from "@/lib/utils";

const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, "Description requise"),
  quantity: z.number().positive("Quantité doit être positive"),
  unitPrice: z.number().nonnegative("Prix unitaire ne peut être négatif"),
});

const UpdateInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
  customerName: z.string().min(1, "Nom client requis"),
  customerAddress: z.string().optional(),
  customerPhone: z.string().optional(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format date invalide (YYYY-MM-DD)"),
  type: z.enum(["quote", "invoice"]),
  items: z.array(InvoiceItemSchema).min(1, "Au moins un article requis"),
});

export type UpdateInvoiceResult =
  | { success: true }
  | { error: "VALIDATION_ERROR" | "UNAUTHORIZED" | "DOCUMENT_PAID" | "NOT_FOUND" | "SERVER_ERROR" };

export async function updateInvoiceAction(
  formData: FormData
): Promise<UpdateInvoiceResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "UNAUTHORIZED" };
  }

  // Parse items from JSON string in FormData
  const itemsJson = formData.get("items");
  let items: unknown[] = [];
  if (typeof itemsJson === "string") {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = JSON.parse(itemsJson) as unknown;
      if (Array.isArray(parsed)) {
        items = parsed;
      }
    } catch {
      // Invalid JSON, will fail validation
    }
  }

  const rawData = {
    invoiceId: formData.get("invoiceId"),
    customerName: formData.get("customerName"),
    customerAddress: formData.get("customerAddress"),
    customerPhone: formData.get("customerPhone"),
    documentDate: formData.get("documentDate"),
    type: formData.get("type"),
    items,
  };

  const parsed = UpdateInvoiceSchema.safeParse(rawData);

  if (!parsed.success) {
    return { error: "VALIDATION_ERROR" };
  }

  const {
    invoiceId,
    customerName,
    customerAddress,
    customerPhone,
    documentDate,
    type,
    items: validItems,
  } = parsed.data;

  // Check ownership and current status
  const { data: existingInvoice } = await supabase
    .from("invoices")
    .select("user_id, status")
    .eq("id", invoiceId)
    .single();

  if (!existingInvoice) {
    return { error: "NOT_FOUND" };
  }

  if (existingInvoice.user_id !== user.id) {
    return { error: "UNAUTHORIZED" };
  }

  // Block editing if paid
  if (existingInvoice.status === "paid") {
    return { error: "DOCUMENT_PAID" };
  }

  // Calculate total
  const total = calculateTotal(validItems);

  // Determine new status: if was sent, revert to draft
  const newStatus = existingInvoice.status === "sent" ? "draft" : existingInvoice.status;

  // Update invoice - use type assertion for new columns not yet in generated types
  const invoiceUpdate = {
    customer_name: customerName,
    customer_address: customerAddress ?? null,
    customer_phone: customerPhone ?? null,
    document_date: documentDate,
    type,
    total,
    status: newStatus,
  };

  const { error: updateError } = await supabase
    .from("invoices")
    .update(invoiceUpdate as never)
    .eq("id", invoiceId)
    .eq("user_id", user.id);

  if (updateError) {
    return { error: "SERVER_ERROR" };
  }

  // Get current item IDs to determine stale ones
  const { data: currentItems } = await supabase
    .from("invoice_items")
    .select("id")
    .eq("invoice_id", invoiceId);

  const validItemIds = new Set(validItems.map((item) => item.id));
  const currentItemIds = currentItems?.map((item) => item.id) ?? [];
  const staleIds = currentItemIds.filter((id) => !validItemIds.has(id));

  // Delete stale items
  if (staleIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("invoice_items")
      .delete()
      .in("id", staleIds);

    if (deleteError) {
      // Log but continue - not fatal
      console.error("Failed to delete stale items:", deleteError);
    }
  }

  // Upsert items
  const itemRows = validItems.map((item) => ({
    id: item.id,
    invoice_id: invoiceId,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
  }));

  const { error: itemsError } = await supabase
    .from("invoice_items")
    .upsert(itemRows);

  if (itemsError) {
    return { error: "SERVER_ERROR" };
  }

  // Revalidate paths
  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);

  return { success: true };
}
