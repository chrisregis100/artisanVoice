"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  shareWithPDF,
  shareViaWhatsApp,
  canShareFiles,
  type ShareMethod,
} from "@/lib/utils/share";
import { db, putSyncedInvoiceMirror } from "@/lib/offline/db";
import { upsertInvoiceToSupabase } from "@/lib/invoices/persist-client";
import { useLanguage } from "@/i18n/context";
import type { InvoiceItem } from "@/types";
import { MessageCircle, Download, Share2, Loader2, Phone } from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Identifiant du document courant (store) — utilisé pour la persistance Supabase. */
  documentId: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName: string;
  businessPhone?: string;
  businessAddress?: string;
  documentDate: string;
  quotePrefix: string;
  invoicePrefix: string;
  vatRatePercent: number;
  /** Required for saving the document to Supabase after export. */
  userId?: string | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  documentId,
  customerName,
  customerPhone: initialPhone,
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
  userId,
}: ShareDialogProps) {
  const { t } = useLanguage();
  const [isSharing, setIsSharing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [error, setError] = useState<string | null>(null);

  const shareParams = {
    customerName,
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
    customerPhone,
  };

  const persistAfterShare = async () => {
    if (!userId) return;
    try {
      const sentAtMs = Date.now();
      await upsertInvoiceToSupabase({
        userId,
        invoiceId: documentId,
        customerName,
        items,
        total,
        type,
        status: "sent",
        sentAtIso: new Date(sentAtMs).toISOString(),
      });
      const existingLocal = await db.invoices.get(documentId);
      await putSyncedInvoiceMirror({
        id: documentId,
        userId,
        customerName,
        customerPhone: customerPhone || "",
        items,
        total,
        type,
        status: "sent",
        sentAt: sentAtMs,
        syncStatus: "synced",
        createdAt: existingLocal?.createdAt ?? sentAtMs,
        updatedAt: sentAtMs,
      });
    } catch (persistErr) {
      console.error("Persist invoice after export failed:", persistErr);
    }
  };

  const handleShare = async (method: ShareMethod) => {
    setIsSharing(true);
    setError(null);
    try {
      await shareWithPDF(shareParams, method);
      await persistAfterShare();
      onOpenChange(false);
    } catch (err) {
      console.error("Share error:", err);
      setError(t("dashboard.share.pdfShareError"));
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppOnly = async () => {
    setIsSharing(true);
    setError(null);
    try {
      await shareViaWhatsApp(shareParams, customerPhone);
      await persistAfterShare();
      onOpenChange(false);
    } catch (err) {
      console.error("Share error:", err);
      setError(t("dashboard.share.whatsappShareError"));
    } finally {
      setIsSharing(false);
    }
  };

  const documentTitle =
    type === "quote"
      ? t("dashboard.preview.quote")
      : t("dashboard.preview.invoice");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("dashboard.share.sendDocument", {
              documentType: documentTitle,
            })}
          </DialogTitle>
          <DialogDescription>
            {t("dashboard.share.shareWith", {
              customerName:
                customerName || t("dashboard.share.shareWithDefault"),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone number input */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="h-3 w-3 inline mr-1" />
              {t("dashboard.share.phoneLabel")}
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder={t("dashboard.share.phonePlaceholder")}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              disabled={isSharing}
            />
          </div>

          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="text-sm text-destructive text-left rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2"
            >
              {error}
            </p>
          )}

          {/* Share buttons */}
          <div className="grid gap-3">
            <Button
              onClick={() => void handleShare("whatsapp")}
              disabled={isSharing}
              aria-busy={isSharing}
              className="w-full justify-start h-12 bg-green-600 hover:bg-green-700 text-white dark:bg-green-600/90 dark:hover:bg-green-700/90"
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5 mr-3" />
              )}
              {t("dashboard.share.whatsappWithPDF")}
            </Button>

            <Button
              onClick={() => void handleWhatsAppOnly()}
              disabled={isSharing}
              aria-busy={isSharing}
              variant="outline"
              className="w-full justify-start h-12"
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5 mr-3" />
              )}
              {t("dashboard.share.whatsappOnly")}
            </Button>

            {canShareFiles() && (
              <Button
                onClick={() => void handleShare("native")}
                disabled={isSharing}
                aria-busy={isSharing}
                variant="outline"
                className="w-full justify-start h-12"
              >
                {isSharing ? (
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                ) : (
                  <Share2 className="h-5 w-5 mr-3" />
                )}
                {t("dashboard.share.otherApps")}
              </Button>
            )}

            <Button
              onClick={() => void handleShare("download")}
              disabled={isSharing}
              aria-busy={isSharing}
              variant="secondary"
              className="w-full justify-start h-12"
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <Download className="h-5 w-5 mr-3" />
              )}
              {t("dashboard.share.downloadPDF")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
