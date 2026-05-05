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
  /** Identifiant du document courant (store) — sert au décompte quota / déduplication mensuelle */
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

  const QUOTA_ERROR: Record<"quota_exceeded" | "no_subscription", string> = {
    quota_exceeded: t("dashboard.share.quotaExceeded"),
    no_subscription: t("dashboard.share.noSubscription"),
  };

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

  const formatShareError = (err: unknown, context: "pdf" | "whatsapp") => {
    console.error("Share error:", err);
    return context === "pdf"
      ? t("dashboard.share.pdfShareError")
      : t("dashboard.share.whatsappShareError");
  };

  const runWithUsageGate = async (
    shareAction: () => Promise<void>,
    errorContext: "pdf" | "whatsapp",
  ) => {
    setIsSharing(true);
    setError(null);

    try {
      const preRes = await fetch("/api/subscription/document-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: "precheck", documentId }),
      });
      const preData = (await preRes.json()) as {
        canExport?: boolean;
        duplicate?: boolean;
        reason?: "no_subscription" | "quota_exceeded";
      };

      if (!preRes.ok) {
        setError(t("dashboard.share.checkQuotaError"));
        return;
      }

      if (!preData.canExport) {
        const reason = preData.reason;
        setError(
          reason && reason in QUOTA_ERROR
            ? QUOTA_ERROR[reason]
            : QUOTA_ERROR.quota_exceeded,
        );
        return;
      }

      const duplicate = preData.duplicate === true;

      await shareAction();

      if (userId) {
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
      }

      if (!duplicate) {
        const commitRes = await fetch("/api/subscription/document-export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phase: "commit", documentId }),
        });
        const commitData = (await commitRes.json()) as {
          outcome?: string;
          error?: string;
        };

        if (commitRes.status === 403) {
          setError(t("dashboard.share.quotaReached"));
          return;
        }

        if (!commitRes.ok) {
          console.error("commit document export failed:", commitData);
          setError(t("dashboard.share.commitError"));
          return;
        }
      }

      onOpenChange(false);
    } catch (err) {
      setError(formatShareError(err, errorContext));
    } finally {
      setIsSharing(false);
    }
  };

  const handleShare = async (method: ShareMethod) => {
    await runWithUsageGate(async () => {
      await shareWithPDF(shareParams, method);
    }, "pdf");
  };

  const handleWhatsAppOnly = async () => {
    await runWithUsageGate(async () => {
      await shareViaWhatsApp(shareParams, customerPhone);
    }, "whatsapp");
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
              onClick={() => handleShare("whatsapp")}
              disabled={isSharing}
              aria-busy={isSharing}
              className="w-full justify-start h-12 bg-green-600 hover:bg-green-700"
            >
              {isSharing ? (
                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              ) : (
                <MessageCircle className="h-5 w-5 mr-3" />
              )}
              {t("dashboard.share.whatsappWithPDF")}
            </Button>

            <Button
              onClick={handleWhatsAppOnly}
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
                onClick={() => handleShare("native")}
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
              onClick={() => handleShare("download")}
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
