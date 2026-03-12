"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { InvoiceItem } from "@/types";

// Register fonts (using system fonts that work without external files)
Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#000000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#16a34a",
  },
  subtitle: {
    fontSize: 10,
    color: "#666666",
    marginTop: 4,
  },
  businessInfo: {
    textAlign: "right",
  },
  businessName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  businessPhone: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
  },
  customerSection: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 4,
    marginBottom: 20,
  },
  customerLabel: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
  },
  customerName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 8,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#666666",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  colDescription: {
    flex: 5,
  },
  colQty: {
    flex: 1,
    textAlign: "center",
  },
  colPrice: {
    flex: 2,
    textAlign: "right",
  },
  colTotal: {
    flex: 2,
    textAlign: "right",
  },
  itemDescription: {
    fontWeight: "bold",
  },
  itemValue: {
    color: "#444444",
  },
  totalSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#000000",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#16a34a",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
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
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName: string;
  businessPhone?: string;
  date: Date;
}

export function InvoicePDF({
  customerName,
  items,
  total,
  type,
  businessName,
  businessPhone,
  date,
}: InvoicePDFProps) {
  const documentTitle = type === "quote" ? "DEVIS" : "FACTURE";

  const formatCurrency = (amount: number): string => {
    return amount.toLocaleString("fr-FR") + " FCFA";
  };

  const formatDate = (d: Date): string => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(d);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{documentTitle}</Text>
            <Text style={styles.subtitle}>{formatDate(date)}</Text>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessName}</Text>
            {businessPhone && (
              <Text style={styles.businessPhone}>{businessPhone}</Text>
            )}
          </View>
        </View>

        {/* Customer */}
        <View style={styles.customerSection}>
          <Text style={styles.customerLabel}>Client</Text>
          <Text style={styles.customerName}>{customerName || "—"}</Text>
        </View>

        {/* Table Header */}
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderText, styles.colDescription]}>
            Description
          </Text>
          <Text style={[styles.tableHeaderText, styles.colQty]}>Qté</Text>
          <Text style={[styles.tableHeaderText, styles.colPrice]}>P.U.</Text>
          <Text style={[styles.tableHeaderText, styles.colTotal]}>Total</Text>
        </View>

        {/* Items */}
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text>Aucun article</Text>
          </View>
        ) : (
          items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.itemDescription, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.itemValue, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.itemValue, styles.colPrice]}>
                {item.unitPrice.toLocaleString("fr-FR")}
              </Text>
              <Text style={[styles.itemDescription, styles.colTotal]}>
                {(item.quantity * item.unitPrice).toLocaleString("fr-FR")}
              </Text>
            </View>
          ))
        )}

        {/* Total */}
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Document généré par ArtisanVoice - {formatDate(date)}
        </Text>
      </Page>
    </Document>
  );
}
