import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvoiceWithItems } from "@/lib/invoices/get-invoice";
import { EditInvoiceClient } from "./edit-invoice-client";

interface EditInvoicePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: EditInvoicePageProps): Promise<Metadata> {
  const { id } = await params;
  const invoice = await getInvoiceWithItems(id);

  if (!invoice) {
    return {
      title: "Document non trouvé",
    };
  }

  const typeLabel = invoice.type === "quote" ? "Devis" : "Facture";
  return {
    title: `Modifier ${typeLabel} - ${invoice.customerName}`,
  };
}

export default async function EditInvoicePage({
  params,
}: EditInvoicePageProps) {
  const { id } = await params;
  const invoice = await getInvoiceWithItems(id);

  if (!invoice) {
    notFound();
  }

  return <EditInvoiceClient invoice={invoice} />;
}
