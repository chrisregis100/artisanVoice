"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceItem } from "@/types";

interface InvoicePreviewProps {
  customerName: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName?: string;
  highlightedItemId?: string | null;
  onCustomerNameChange?: (name: string) => void;
  onItemUpdate?: (id: string, updates: Partial<InvoiceItem>) => void;
  onItemRemove?: (index: number) => void;
  onTypeChange?: (type: "quote" | "invoice") => void;
  onAddArticle?: () => void;
  itemIdToFocus?: string | null;
  onItemFocusConsumed?: () => void;
}

export function InvoicePreview({
  customerName,
  items,
  total,
  type,
  businessName = "Mon Entreprise",
  highlightedItemId,
  onCustomerNameChange,
  onItemUpdate,
  onItemRemove,
  onTypeChange,
  onAddArticle,
  itemIdToFocus,
  onItemFocusConsumed,
}: InvoicePreviewProps) {
  const documentTitle = type === "quote" ? "Devis" : "Facture";
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
    <Card className="p-6 sm:p-8 bg-card border border-border/80 shadow-sm rounded-xl overflow-hidden">
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
          >
            Devis
          </Button>
          <Button
            type="button"
            variant={type === "invoice" ? "default" : "outline"}
            size="sm"
            onClick={() => onTypeChange("invoice")}
          >
            Facture
          </Button>
        </div>
      )}

      <div className="flex justify-between items-start mb-8 border-b border-border pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {documentTitle}
          </h2>
          <p className="text-sm font-medium text-muted-foreground mt-2">
            {formatDate(new Date())}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-foreground">{businessName}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-muted/50 border border-border rounded-lg">
        <p className="text-sm font-semibold text-foreground mb-2">Client</p>
        {onCustomerNameChange ? (
          <Input
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Nom du client"
            className="h-10 text-base font-medium border border-input bg-background"
            aria-label="Nom du client"
          />
        ) : (
          <p className="font-semibold text-lg text-foreground">
            {customerName || "—"}
          </p>
        )}
      </div>

      <div className="mb-8">
        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-muted-foreground border-b border-border pb-2 mb-3">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-center">Qté</div>
          <div className="col-span-2 text-right">P.U.</div>
          <div className="col-span-2 text-right">Total</div>
          {onItemRemove && <div className="col-span-1" />}
        </div>

        {items.length === 0 ? (
          <div className="py-10 border border-dashed border-border rounded-lg text-center bg-muted/20">
            <p className="text-base font-medium text-foreground">Aucun article</p>
            <p className="text-sm text-muted-foreground mt-2">
              Ajoutez une ligne ou dictez vos articles
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-2 py-2 px-2 text-base transition-all border border-transparent rounded-lg",
                    onItemRemove ? "grid-cols-12" : "grid-cols-12",
                    highlightedItemId === item.id &&
                      "highlight-animation bg-primary/15 border-primary/40",
                    onItemUpdate &&
                      !isEditing &&
                      "cursor-pointer hover:border-border hover:bg-muted/30 bg-background",
                    isEditing && "border-border bg-muted/30 p-3"
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
                          className="h-9 text-base border border-input"
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
                          className="h-9 text-base text-center border border-input"
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
                          className="h-9 text-base text-right border border-input"
                          min={0}
                          aria-label="Prix unitaire"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end font-semibold text-foreground">
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "fr-FR"
                        )}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-1.5 text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
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
                      <div className="col-span-2 text-center text-sm text-foreground flex items-center justify-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right text-sm text-foreground flex items-center justify-end">
                        {item.unitPrice.toLocaleString("fr-FR")}
                      </div>
                      <div className="col-span-2 text-right font-semibold text-foreground flex items-center justify-end">
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "fr-FR"
                        )}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-1.5 text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md opacity-80 hover:opacity-100 transition-opacity"
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
            variant="outline"
            className="mt-4 w-full sm:w-auto gap-2"
            onClick={onAddArticle}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Ajouter un article
          </Button>
        )}
      </div>

      <div className="bg-foreground text-background p-5 rounded-lg mt-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold tracking-wide">Total</span>
          <span className="text-2xl sm:text-3xl font-bold">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </Card>
  );
}
