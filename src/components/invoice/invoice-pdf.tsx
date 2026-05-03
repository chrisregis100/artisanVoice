"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceItem } from "@/types";
import {
  buildDocumentNumber,
  calculateTotalTtc,
  calculateVatAmount,
  formatIsoDateForDocument,
  splitAddressLines,
} from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#000000",
    paddingBottom: 56,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 6,
  },
  headerDate: {
    fontSize: 10,
    color: "#666666",
    marginBottom: 20,
  },
  twoCol: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 20,
  },
  col: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
  },
  colLabel: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 6,
  },
  colLine: {
    fontSize: 10,
    color: "#333333",
    marginBottom: 2,
  },
  colLineBold: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 0,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#444444",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  colDescription: { flex: 5 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 2, textAlign: "right" },
  colTotal: { flex: 2, textAlign: "right" },
  itemDescription: { fontWeight: "bold" },
  itemMuted: { color: "#444444" },
  totalsBlock: {
    marginTop: 16,
    alignSelf: "flex-end",
    width: 220,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    fontSize: 10,
  },
  totalRowMuted: {
    color: "#444444",
  },
  totalRowTtc: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#000000",
    fontSize: 12,
    fontWeight: "bold",
  },
  signatureBlock: {
    marginTop: 36,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  signatureTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 48,
  },
  signatureHint: {
    fontSize: 8,
    color: "#888888",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999999",
  },
  emptyState: {
    padding: 40,
    textAlign: "center",
    color: "#999999",
  },
});

interface InvoicePDFProps {
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

export function InvoicePDF({
  customerName,
  customerPhone,
  customerAddress,
  items,
  total,
  type,
  businessName,
  businessPhone,
  businessAddress,
  documentDate,
  quotePrefix,
  invoicePrefix,
  vatRatePercent,
}: InvoicePDFProps) {
  const documentTitle = type === "quote" ? "Devis" : "Facture";
  const documentNumber = buildDocumentNumber(
    type,
    documentDate,
    quotePrefix,
    invoicePrefix
  );

  const subtotalHt = total;
  const vatAmount = calculateVatAmount(subtotalHt, vatRatePercent);
  const totalTtc = calculateTotalTtc(subtotalHt, vatRatePercent);

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("fr-FR") + " FCFA";
  };

  const formatDate = (d: Date | string): string => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(d));
  };

  const issuerLines = splitAddressLines(businessAddress || "");
  const clientLines = splitAddressLines(customerAddress || "");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.headerTitle}>
          {documentTitle} N° {documentNumber}
        </Text>
        <Text style={styles.headerDate}>Date : {formatDate(documentDate)}</Text>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Émetteur</Text>
            <Text style={styles.colLineBold}>{businessName}</Text>
            {issuerLines.map((line, i) => (
              <Text key={i} style={styles.colLine}>
                {line}
              </Text>
            ))}
            {businessPhone ? (
              <Text style={styles.colLine}>{businessPhone}</Text>
            ) : null}
          </View>
          <View style={styles.col}>
            <Text style={styles.colLabel}>Client</Text>
            <Text style={styles.colLineBold}>{customerName || "—"}</Text>
            {clientLines.map((line, i) => (
              <Text key={i} style={styles.colLine}>
                {line}
              </Text>
            ))}
            {customerPhone ? (
              <Text style={styles.colLine}>{customerPhone}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>
            Quantité
          </Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>
            Prix unitaire
          </Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>Aucun article</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.itemDescription, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.itemMuted, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.itemMuted, styles.colPrice]}>
                {item.unitPrice.toLocaleString("fr-FR")}
              </Text>
              <Text style={[styles.itemDescription, styles.colTotal]}>
                {(item.quantity * item.unitPrice).toLocaleString("fr-FR")}
              </Text>
            </View>
          ))
        )}

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowMuted}>Sous-total HT</Text>
            <Text>{formatCurrency(subtotalHt)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalRowMuted}>
              TVA ({vatRatePercent} %)
            </Text>
            <Text>{formatCurrency(vatAmount)}</Text>
          </View>
          <View style={styles.totalRowTtc}>
            <Text>Total TTC</Text>
            <Text>{formatCurrency(totalTtc)}</Text>
          </View>
        </View>

        <View style={styles.signatureBlock}>
          <Text style={styles.signatureTitle}>Bon pour accord</Text>
          <Text style={styles.signatureHint}>Signature du client</Text>
        </View>

        <Text style={styles.footer} fixed>
          Document généré par Billo —{" "}
          {formatIsoDateForDocument(documentDate)}
        </Text>
      </Page>
    </Document>
  );
}
