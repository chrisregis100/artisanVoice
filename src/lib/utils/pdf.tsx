"use client";

import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoice/invoice-pdf";
import type { GeneratePDFParams } from "@/types";

export async function generatePDF(params: GeneratePDFParams): Promise<Blob> {
  if (typeof window === "undefined") {
    throw new Error("PDF generation can only be performed in the browser");
  }

  const pdfElement = <InvoicePDF {...params} />;

  try {
    const blob = await pdf(pdfElement).toBlob();
    return blob;
  } catch (error) {
    throw new Error(
      `PDF generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export function downloadPDF(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } finally {
    URL.revokeObjectURL(url);
  }
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
