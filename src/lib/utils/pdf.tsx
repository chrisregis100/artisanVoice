"use client";

import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoice/invoice-pdf";
import type { InvoiceItem } from "@/types";

interface GeneratePDFParams {
  customerName: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName: string;
  businessPhone?: string;
}

export async function generatePDF(params: GeneratePDFParams): Promise<Blob> {
  const document = (
    <InvoicePDF
      {...params}
      date={new Date()}
    />
  );

  const blob = await pdf(document).toBlob();
  return blob;
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function generateFilename(
  type: "quote" | "invoice",
  customerName: string
): string {
  const prefix = type === "quote" ? "devis" : "facture";
  const sanitizedName = customerName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  const date = new Date().toISOString().split("T")[0];

  return `${prefix}_${sanitizedName || "client"}_${date}.pdf`;
}
