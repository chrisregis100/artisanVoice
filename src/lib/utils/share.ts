"use client";

import { generatePDF, downloadPDF, generateFilename } from "./pdf";
import type { InvoiceItem } from "@/types";
import { calculateTotalTtc, calculateVatAmount } from "@/lib/utils";

export type ShareMethod = "whatsapp" | "download" | "native";

interface ShareParams {
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  documentDate: Date | string;
  quotePrefix: string;
  invoicePrefix: string;
  vatRatePercent: number;
}

function formatCurrency(amount: number): string {
  return amount.toLocaleString("fr-FR") + " FCFA";
}

function generateShareMessage(params: ShareParams): string {
  const {
    customerName,
    total,
    type,
    businessName,
    vatRatePercent,
  } = params;
  const documentType = type === "quote" ? "Devis" : "Facture";
  const vatAmount = calculateVatAmount(total, vatRatePercent);
  const totalTtc = calculateTotalTtc(total, vatRatePercent);

  return `${documentType} de ${businessName}

Client: ${customerName || "—"}
Sous-total HT: ${formatCurrency(total)}
TVA (${vatRatePercent} %): ${formatCurrency(vatAmount)}
Total TTC: ${formatCurrency(totalTtc)}

Merci pour votre confiance!`;
}

export async function shareViaWhatsApp(
  params: ShareParams,
  phoneNumber?: string
): Promise<void> {
  const message = generateShareMessage(params);

  // Format phone number for WhatsApp (remove spaces, add country code if needed)
  let formattedPhone = "";
  if (phoneNumber) {
    formattedPhone = phoneNumber.replace(/\s+/g, "").replace(/^0/, "229");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.replace(/^([^+])/, "+$1");
    }
  }

  // Generate WhatsApp URL
  const baseUrl = formattedPhone
    ? `https://wa.me/${formattedPhone.replace(/\+/g, "")}`
    : "https://wa.me/";

  const whatsappUrl = `${baseUrl}?text=${encodeURIComponent(message)}`;

  // Open WhatsApp
  window.open(whatsappUrl, "_blank");
}

export async function shareWithPDF(
  params: ShareParams,
  method: ShareMethod
): Promise<void> {
  // Generate PDF
  const pdfBlob = await generatePDF(params);
  const filename = generateFilename(params.type, params.customerName);

  switch (method) {
    case "download":
      downloadPDF(pdfBlob, filename);
      break;

    case "native":
      // Try Web Share API with file
      if (navigator.share && navigator.canShare) {
        const file = new File([pdfBlob], filename, {
          type: "application/pdf",
        });

        const shareData = {
          title: `${params.type === "quote" ? "Devis" : "Facture"} - ${params.customerName}`,
          text: generateShareMessage(params),
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      // Fallback to download
      downloadPDF(pdfBlob, filename);
      break;

    case "whatsapp":
      // Download PDF first, then open WhatsApp with message
      downloadPDF(pdfBlob, filename);
      // Small delay to ensure download starts
      await new Promise((resolve) => setTimeout(resolve, 500));
      await shareViaWhatsApp(params, params.customerPhone);
      break;
  }
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

export function canShareFiles(): boolean {
  if (typeof navigator === "undefined") return false;
  if (!("share" in navigator) || !("canShare" in navigator)) return false;

  // Check if file sharing is supported
  const testFile = new File(["test"], "test.pdf", { type: "application/pdf" });
  return navigator.canShare({ files: [testFile] });
}
