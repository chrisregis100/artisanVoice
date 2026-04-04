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
    <Card className="relative p-6 sm:p-8 bg-white dark:bg-card border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none ring-1 ring-border/50 rounded-2xl overflow-hidden">
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

      <div className="flex justify-between items-start mb-8 border-b border-border/60 pb-6">
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

      <div className="mb-8 p-4 bg-slate-50/50 dark:bg-muted/10 border border-border/40 rounded-xl">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Client</p>
        {onCustomerNameChange ? (
          <Input
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Saisissez le nom du client"
            className="h-11 text-base font-medium border-border/60 bg-white dark:bg-background shadow-sm hover:border-primary/40 focus:border-primary transition-colors"
            aria-label="Nom du client"
          />
        ) : (
          <p className="font-semibold text-lg text-foreground">
            {customerName || "—"}
          </p>
        )}
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-12 gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/60 pb-3 mb-4">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-center">Qté</div>
          <div className="col-span-2 text-right">P.U.</div>
          <div className="col-span-2 text-right">Total</div>
          {onItemRemove && <div className="col-span-1" />}
        </div>

        {items.length === 0 ? (
          <div className="py-12 border border-dashed border-border/60 rounded-xl text-center bg-slate-50/50 dark:bg-muted/10">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Plus className="w-6 h-6 text-primary/60" />
            </div>
            <p className="text-base font-medium text-foreground">Aucun article pour le moment</p>
            <p className="text-sm text-muted-foreground mt-1">
              Testez la commande vocale ou ajoutez une ligne !
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
                    "grid gap-2 py-2.5 px-3 text-base transition-all border border-transparent rounded-xl group",
                    onItemRemove ? "grid-cols-12" : "grid-cols-12",
                    highlightedItemId === item.id &&
                      "highlight-animation bg-primary/10 border-primary/30",
                    onItemUpdate &&
                      !isEditing &&
                      "cursor-pointer hover:border-border/60 hover:bg-slate-50/80 dark:hover:bg-muted/20 hover:shadow-sm bg-transparent",
                    isEditing && "border-border/60 bg-white dark:bg-muted/20 shadow-[0_2px_10px_rgb(0,0,0,0.06)] dark:shadow-none p-3 ring-1 ring-primary/20"
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
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "fr-FR"
                        )}
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

      <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 p-6 rounded-2xl mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex justify-between items-center relative z-10">
          <span className="text-xl font-semibold tracking-tight text-primary">Total HT</span>
          <span className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </Card>
  );
}
