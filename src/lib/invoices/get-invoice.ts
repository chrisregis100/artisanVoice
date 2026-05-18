import { createClient } from "@/lib/supabase/server";
import type { DocumentType, DocumentStatus, InvoiceItem } from "@/types";

export interface InvoiceWithItems {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  documentDate: string;
  type: DocumentType;
  status: DocumentStatus;
  total: number;
  createdAt: string;
  sentAt: string | null;
  items: InvoiceItem[];
}

// Helper to safely extract string value from potentially unknown data
function getString(
  obj: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  if (!obj) return undefined;
  const value = obj[key];
  if (typeof value === "string") return value;
  return undefined;
}

// Helper to safely extract string or null
function getStringOrNull(
  obj: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = getString(obj, key);
  return value ?? null;
}

// Helper to safely extract items array
function getItemsArray(
  obj: Record<string, unknown> | undefined,
  key: string
): InvoiceItem[] {
  if (!obj) return [];
  const value = obj[key];
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null
    )
    .map((item) => ({
      id: getString(item, "id") ?? "",
      description: getString(item, "description") ?? "",
      quantity: typeof item.quantity === "number" ? item.quantity : 0,
      unitPrice: typeof item.unit_price === "number" ? item.unit_price : 0,
    }));
}

export async function getInvoiceWithItems(
  invoiceId: string
): Promise<InvoiceWithItems | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: invoiceData } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", invoiceId)
    .eq("user_id", user.id)
    .single();

  if (!invoiceData) return null;

  // Treat as Record for safe property access
  const invoice = invoiceData as Record<string, unknown>;

  // Map items
  const items = getItemsArray(invoice, "invoice_items");

  const createdAt = getString(invoice, "created_at") ?? "";

  return {
    id: getString(invoice, "id") ?? "",
    userId: getString(invoice, "user_id") ?? "",
    customerName: getString(invoice, "customer_name") ?? "",
    customerPhone: getStringOrNull(invoice, "customer_phone"),
    customerAddress: getStringOrNull(invoice, "customer_address"),
    documentDate:
      getString(invoice, "document_date") ?? createdAt.split("T")[0] ?? "",
    type: (getString(invoice, "type") as DocumentType) ?? "quote",
    status: (getString(invoice, "status") as DocumentStatus) ?? "draft",
    total: typeof invoice.total === "number" ? invoice.total : 0,
    createdAt,
    sentAt: getStringOrNull(invoice, "sent_at"),
    items,
  };
}
