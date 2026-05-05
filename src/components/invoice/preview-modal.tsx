"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice/invoice-preview";
import { useLanguage } from "@/i18n/context";
import type { InvoiceItem } from "@/types";
import { X, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: () => void;
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
}

export function PreviewModal({
  open,
  onOpenChange,
  onShare,
  customerName,
  customerPhone,
  customerAddress,
  documentDate,
  items,
  total,
  type,
  businessName,
  businessAddress,
  businessPhone,
  quotePrefix,
  invoicePrefix,
  vatRatePercent,
}: PreviewModalProps) {
  const { t } = useLanguage();
  const documentTitle = type === "quote" ? t("dashboard.preview.quote") : t("dashboard.preview.invoice");

  const handleShare = () => {
    onOpenChange(false);
    onShare();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "flex flex-col w-full max-w-3xl h-[90dvh] sm:h-[90vh]",
            "bg-background border shadow-xl sm:rounded-xl",
            "duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4 shrink-0">
            <DialogPrimitive.Title className="text-base font-semibold leading-none tracking-tight">
              {t("dashboard.preview.previewTitle", { documentType: documentTitle })}
            </DialogPrimitive.Title>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleShare}
                disabled={items.length === 0}
                className="gap-2"
                aria-label={t("dashboard.preview.shareAria", { documentType: documentTitle })}
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {t("dashboard.preview.shareButton")}
              </Button>
              <DialogPrimitive.Close asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t("dashboard.preview.closeAria")}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" aria-hidden />
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>

          {/* Scrollable preview body */}
          <div className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            <div className="mx-auto max-w-2xl">
              <InvoicePreview
                customerName={customerName}
                customerPhone={customerPhone}
                customerAddress={customerAddress}
                documentDate={documentDate}
                items={items}
                total={total}
                type={type}
                businessName={businessName}
                businessAddress={businessAddress}
                businessPhone={businessPhone}
                quotePrefix={quotePrefix}
                invoicePrefix={invoicePrefix}
                vatRatePercent={vatRatePercent}
              />
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
