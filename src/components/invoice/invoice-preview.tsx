"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { Trash2 } from "lucide-react";
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
}: InvoicePreviewProps) {
  const documentTitle = type === "quote" ? "DEVIS" : "FACTURE";
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleItemClick = (itemId: string) => {
    if (!onItemUpdate) return;
    setEditingItemId((prev) => (prev === itemId ? null : itemId));
  };

  const handleItemKeyDown = (
    e: React.KeyboardEvent,
    itemId: string
  ) => {
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
    <Card className="p-6 sm:p-8 bg-white border-4 border-foreground shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-4 border-foreground pb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight uppercase">
            {documentTitle}
          </h2>
          <p className="text-base font-bold text-muted-foreground mt-2">
            {formatDate(new Date())}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-foreground uppercase tracking-wide">{businessName}</p>
        </div>
      </div>

      {/* Customer - editable text field */}
      <div className="mb-8 p-4 bg-muted border-2 border-foreground rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <p className="text-sm font-bold text-foreground uppercase tracking-wider mb-2">Client</p>
        {onCustomerNameChange ? (
          <Input
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Nom du client"
            className="h-10 text-xl font-black border-2 border-foreground bg-white px-3 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            aria-label="Nom du client"
          />
        ) : (
          <p className="font-black text-xl text-foreground">
            {customerName || "—"}
          </p>
        )}
      </div>

      {/* Items */}
      <div className="mb-8">
        <div className="grid grid-cols-12 gap-2 text-sm font-black text-foreground uppercase tracking-wider border-b-4 border-foreground pb-3 mb-3">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-center">Qté</div>
          <div className="col-span-2 text-right">P.U.</div>
          <div className="col-span-2 text-right">Total</div>
          {onItemRemove && <div className="col-span-1" />}
        </div>

        {items.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-muted-foreground/50 rounded-lg text-center bg-muted/30">
            <p className="text-lg font-bold text-foreground">Aucun article</p>
            <p className="text-sm font-medium text-muted-foreground mt-2">Dictez vos articles pour commencer</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, index) => {
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "grid gap-2 py-3 px-2 text-base transition-all border-2 border-transparent rounded-lg",
                    onItemRemove ? "grid-cols-12" : "grid-cols-12",
                    highlightedItemId === item.id &&
                      "highlight-animation bg-primary/20 border-primary",
                    onItemUpdate &&
                      !isEditing &&
                      "cursor-pointer hover:border-foreground hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white",
                    isEditing && "border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-muted/30 p-3"
                  )}
                  onClick={() => handleItemClick(item.id)}
                  onKeyDown={(e) => handleItemKeyDown(e, item.id)}
                  tabIndex={onItemUpdate ? 0 : undefined}
                  role={onItemUpdate ? "button" : undefined}
                  aria-label={
                    onItemUpdate
                      ? `Modifier ${item.description}`
                      : undefined
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
                          className="h-9 text-base font-bold border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                          className="h-9 text-base font-bold text-center border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
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
                          className="h-9 text-base font-bold text-right border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          min={0}
                          aria-label="Prix unitaire"
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-end font-black text-foreground">
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "fr-FR"
                        )}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-1.5 text-background bg-destructive hover:bg-destructive/90 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors rounded"
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
                      <div className="col-span-5 font-bold text-foreground flex items-center">
                        {item.description}
                      </div>
                      <div className="col-span-2 text-center font-medium text-foreground flex items-center justify-center">
                        {item.quantity}
                      </div>
                      <div className="col-span-2 text-right font-medium text-foreground flex items-center justify-end">
                        {item.unitPrice.toLocaleString("fr-FR")}
                      </div>
                      <div className="col-span-2 text-right font-black text-foreground flex items-center justify-end">
                        {(item.quantity * item.unitPrice).toLocaleString(
                          "fr-FR"
                        )}
                      </div>
                      {onItemRemove && (
                        <div className="col-span-1 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onItemRemove(index);
                            }}
                            className="p-1.5 text-background bg-destructive hover:bg-destructive/90 border-2 border-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-colors rounded"
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
      </div>

      {/* Total */}
      <div className="bg-foreground text-background p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] mt-4">
        <div className="flex justify-between items-center">
          <span className="text-2xl font-black uppercase tracking-wider">TOTAL</span>
          <span className="text-3xl sm:text-4xl font-black">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </Card>
  );
}
