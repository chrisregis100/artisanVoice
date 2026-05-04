import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function calculateTotal(
  items: { quantity: number; unitPrice: number }[]
): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

/** Sous-total HT (hors taxes) — somme des lignes. */
export function calculateSubtotalHt(
  items: { quantity: number; unitPrice: number }[]
): number {
  return calculateTotal(items);
}

export function calculateVatAmount(
  subtotalHt: number,
  vatRatePercent: number
): number {
  return (subtotalHt * vatRatePercent) / 100;
}

export function calculateTotalTtc(
  subtotalHt: number,
  vatRatePercent: number
): number {
  return subtotalHt + calculateVatAmount(subtotalHt, vatRatePercent);
}

/** Date locale au format yyyy-MM-dd (pour numéro de document). */
export function formatIsoDateForDocument(date: string | Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function getTodayIsoDateString(): string {
  return formatIsoDateForDocument(new Date());
}

export function buildDocumentNumber(
  type: "quote" | "invoice",
  documentDate: string | Date,
  quotePrefix: string,
  invoicePrefix: string
): string {
  const prefix = (type === "quote" ? quotePrefix : invoicePrefix).trim();
  const base = prefix.replace(/-+$/, "");
  const datePart = formatIsoDateForDocument(documentDate);
  return `${base}-${datePart}`;
}

/** Affiche les lignes d’une adresse multiligne (trim des vides). */
export function splitAddressLines(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
