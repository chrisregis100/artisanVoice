"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  buildDocumentNumber,
  calculateTotalTtc,
  calculateVatAmount,
  cn,
  formatCurrency,
  formatDate,
  splitAddressLines,
} from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceItem } from "@/types";

interface InvoicePreviewProps {
  customerName: string;
  customerPhone?: string;
  customerAddress: string;
  documentDate: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  quotePrefix: string;
  invoicePrefix: string;
  vatRatePercent: number;
  highlightedItemId?: string | null;
  onCustomerNameChange?: (name: string) => void;
  onCustomerAddressChange?: (address: string) => void;
  onDocumentDateChange?: (isoDate: string) => void;
  onItemUpdate?: (id: string, updates: Partial<InvoiceItem>) => void;
  onItemRemove?: (index: number) => void;
  onTypeChange?: (type: "quote" | "invoice") => void;
  onAddArticle?: () => void;
  itemIdToFocus?: string | null;
  onItemFocusConsumed?: () => void;
}

export function InvoicePreview({
  customerName,
  customerPhone,
  customerAddress,
  documentDate,
  items,
  total,
  type,
  businessName = "Mon Entreprise",
  businessAddress,
  businessPhone,
  quotePrefix,
  invoicePrefix,
  vatRatePercent,
  highlightedItemId,
  onCustomerNameChange,
  onCustomerAddressChange,
  onDocumentDateChange,
  onItemUpdate,
  onItemRemove,
  onTypeChange,
  onAddArticle,
  itemIdToFocus,
  onItemFocusConsumed,
}: InvoicePreviewProps) {
  const documentTitle = type === "quote" ? "Devis" : "Facture";
  const documentNumber = useMemo(
    () =>
      buildDocumentNumber(type, documentDate, quotePrefix, invoicePrefix),
    [type, documentDate, quotePrefix, invoicePrefix]
  );

  const subtotalHt = total;
  const vatAmount = calculateVatAmount(subtotalHt, vatRatePercent);
  const totalTtc = calculateTotalTtc(subtotalHt, vatRatePercent);

  const issuerLines = splitAddressLines(businessAddress || "");
  const clientLines = splitAddressLines(customerAddress);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!itemIdToFocus) return;
    const exists = items.some((i) => i.id === itemIdToFocus);
    if (exists) {
      setEditingItemId(itemIdToFocus);
      onItemFocusConsumed?.();
    }
  }, [itemIdToFocus, items, onItemFocusConsumed]);

  const handleItemClick = (itemId: string) => {
    if (!onItemUpdate) return;
    setEditingItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleItemKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    if (e.key === "Enter" || e.key === "Escape") {
      setEditingItemId(null);
    }
    if (e.key === "Enter" || e.key === " ") {
      if (editingItemId !== itemId) {
        handleItemClick(itemId);
      }
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-white p-6 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 dark:border-border dark:bg-card dark:shadow-none dark:ring-border sm:p-10">
      {onTypeChange && (
        <div
          className="flex flex-wrap gap-2 mb-6"
          role="group"
          aria-label="Type de document"
        >
          <Button
            type="button"
            variant={type === "quote" ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange("quote")}
            className={type === "quote" ? "shadow-md shadow-primary/20" : ""}
          >
            Devis
          </Button>
          <Button
            type="button"
            variant={type === "invoice" ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange("invoice")}
            className={type === "invoice" ? "shadow-md shadow-primary/20" : ""}
          >
            Facture
          </Button>
        </div>
      )}

      <div className="mb-8 border-b border-border/50 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {documentTitle} N° {documentNumber}
        </h2>
        <div className="mt-2 text-sm text-muted-foreground">
          {onDocumentDateChange ? (
            <label className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">Date</span>
              <Input
                type="date"
                value={documentDate}
                onChange={(e) => onDocumentDateChange(e.target.value)}
                className="h-9 w-auto max-w-[11rem] text-sm"
                aria-label="Date du document"
              />
            </label>
          ) : (
            <span>
              Date :{" "}
              {documentDate ? (
                formatDate(documentDate)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          )}
        </div>
      </div>

      <div className="mb-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-muted/40 p-4 dark:bg-muted/10">
          <p className="mb-2 text-sm font-bold text-foreground">Émetteur</p>
          <p className="font-semibold text-foreground">{businessName}</p>
          {issuerLines.map((line) => (
            <p key={line} className="text-sm text-muted-foreground">
              {line}
            </p>
          ))}
          {businessPhone ? (
            <p className="mt-1 text-sm text-muted-foreground">{businessPhone}</p>
          ) : null}
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/40 p-4 dark:bg-muted/10">
          <p className="mb-2 text-sm font-bold text-foreground">Client</p>
          {onCustomerNameChange ? (
            <Input
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Nom du client"
              className="mb-2 h-10 text-base font-semibold border-border/60 bg-white dark:bg-background"
              aria-label="Nom du client"
            />
          ) : (
            <p className="font-semibold text-foreground">
              {customerName || "—"}
            </p>
          )}
          {onCustomerAddressChange ? (
            <textarea
              value={customerAddress}
              onChange={(e) => onCustomerAddressChange(e.target.value)}
              placeholder="Adresse (rue, ville…)"
              rows={3}
              className={cn(
                "mt-1 flex w-full rounded-md border border-input bg-white px-3 py-2 text-sm dark:bg-background",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none min-h-[4.5rem]"
              )}
              aria-label="Adresse du client"
            />
          ) : (
            <>
              {clientLines.map((line) => (
                <p key={line} className="text-sm text-muted-foreground">
                  {line}
                </p>
              ))}
              {customerPhone ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {customerPhone}
                </p>
              ) : null}
            </>
          )}
          {onCustomerAddressChange && customerPhone ? (
            <p className="mt-2 text-sm text-muted-foreground">{customerPhone}</p>
          ) : null}
        </div>
      </div>

      <div className="mb-6">
        <div className="mb-0 overflow-hidden rounded-t-lg border border-b-0 border-border/60 bg-muted/70 dark:bg-muted/30">
          <div className="grid grid-cols-12 gap-2 px-3 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-center">Quantité</div>
            <div className="col-span-2 text-right">Prix unitaire</div>
            <div className="col-span-2 text-right">Total</div>
            {onItemRemove && <div className="col-span-1" />}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="rounded-b-lg border border-dashed border-border/60 bg-slate-50/70 py-12 text-center dark:bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground">
              Aucun article pour le moment
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Testez la commande vocale ou ajoutez une ligne !
            </p>
          </div>
        ) : (
          <div className="rounded-b-lg border border-border/60 border-t-0 divide-y divide-border/50">
            {items.map((item, index) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-2 py-2.5 px-3 text-base transition-all group",
                    onItemRemove ? "grid-cols-12" : "grid-cols-12",
                    highlightedItemId === item.id &&
                      "highlight-animation bg-primary/10",
                    onItemUpdate &&
                      !isEditing &&
                      "cursor-pointer hover:bg-muted/40",
                    isEditing &&
                      "bg-white dark:bg-muted/20 p-3 ring-1 ring-primary/20"
                  )}
                  onClick={() => handleItemClick(item.id)}
                  onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                  tabIndex={onItemUpdate ? 0 : undefined}
                  role={onItemUpdate ? "button" : undefined}
                  aria-label={
                    onItemUpdate ? `Modifier ${item.description}` : undefined
                  }
                >
                  {isEditing ? (
                    <>
                      <div className="col-span-5">
                        <Input
                          value={item.description}
                          onChange={(e) =>
                            onItemUpdate?.(item.id, {
                              description: e.target.value,
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-10 text-base border-border/60 focus:border-primary"
                          aria-label="Description"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            onItemUpdate?.(item.id, {
                              quantity: Number(e.target.value) || 0,
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-10 text-base text-center border-border/60 focus:border-primary"
                          min={1}
                          aria-label="Quantité"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) =>
                            onItemUpdate?.(item.id, {
                              unitPrice: Number(e.target.value) || 0,
                            })
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="h-10 text-base text-right border-border/60 focus:border-primary"
                          min={0}
                          aria-label="Prix unitaire"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end font-semibold text-foreground">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-2 text-destructive/80 hover:text-destructive-foreground hover:bg-destructive rounded-lg transition-colors"
                            aria-label={`Supprimer ${item.description}`}
                            tabIndex={0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="col-span-5 font-medium text-foreground flex items-center">
                        {item.description}
                      </div>
                      <div className="col-span-2 text-center text-sm text-muted-foreground flex items-center justify-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground flex items-center justify-end">
                        {item.unitPrice.toLocaleString("fr-FR")}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-foreground flex items-center justify-end">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-1.5 text-destructive/70 hover:bg-destructive hover:text-destructive-foreground rounded-lg transition-colors"
                            aria-label={`Supprimer ${item.description}`}
                            tabIndex={0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {onAddArticle && (
          <Button
            type="button"
            variant="ghost"
            className="mt-6 w-full gap-2 text-muted-foreground hover:text-foreground hover:bg-slate-50 dark:hover:bg-muted/10 border border-dashed border-border/60 rounded-xl"
            onClick={onAddArticle}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter une ligne
          </Button>
        )}
      </div>

      <div className="mt-6 flex flex-col items-end gap-2 border-t border-border/50 pt-6">
        <div className="w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">Sous-total HT</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(subtotalHt)}
            </span>
          </div>
          <div className="flex justify-between gap-8">
            <span className="text-muted-foreground">
              TVA ({vatRatePercent} %)
            </span>
            <span className="font-medium tabular-nums">
              {formatCurrency(vatAmount)}
            </span>
          </div>
          <div className="flex justify-between gap-8 border-t border-border/60 pt-3 text-base">
            <span className="font-bold text-foreground">Total TTC</span>
            <span className="text-xl font-bold tabular-nums text-foreground">
              {formatCurrency(totalTtc)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 border-t border-border/50 pt-8">
        <p className="text-sm font-semibold text-foreground">Bon pour accord</p>
        <div
          className="mt-12 min-h-[4rem] rounded-md border border-dashed border-border/70 bg-muted/20"
          aria-hidden
        />
        <p className="mt-3 text-xs text-muted-foreground">
          Signature du client
        </p>
      </div>
    </Card>
  );
}
