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
