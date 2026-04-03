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
import type { InvoiceItem } from "@/types";
import {
  MessageCircle,
  Download,
  Share2,
  Loader2,
  Phone,
} from "lucide-react";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerPhone?: string;
  items: InvoiceItem[];
  total: number;
  type: "quote" | "invoice";
  businessName: string;
  businessPhone?: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  customerName,
  customerPhone: initialPhone,
  items,
  total,
  type,
  businessName,
  businessPhone,
}: ShareDialogProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [customerPhone, setCustomerPhone] = useState(initialPhone || "");
  const [error, setError] = useState<string | null>(null);

  const shareParams = {
    customerName,
    items,
    total,
    type,
    businessName,
    businessPhone,
    customerPhone,
  };

  const formatShareError = (err: unknown, context: "pdf" | "whatsapp") => {
    console.error("Share error:", err);
    const base =
      context === "pdf"
        ? "Le partage du PDF a échoué."
        : "L’envoi WhatsApp a échoué.";
    return `${base} Réessayez, vérifiez le numéro au format international, ou téléchargez le PDF pour l’envoyer autrement.`;
  };

  const handleShare = async (method: ShareMethod) => {
    setIsSharing(true);
    setError(null);

    try {
      await shareWithPDF(shareParams, method);
      onOpenChange(false);
    } catch (err) {
      setError(formatShareError(err, "pdf"));
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsAppOnly = async () => {
    setIsSharing(true);
    setError(null);

    try {
      await shareViaWhatsApp(shareParams, customerPhone);
      onOpenChange(false);
    } catch (err) {
      setError(formatShareError(err, "whatsapp"));
    } finally {
      setIsSharing(false);
    }
  };

  const documentTitle = type === "quote" ? "devis" : "facture";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Envoyer le {documentTitle}</DialogTitle>
          <DialogDescription>
            Choisissez comment partager ce document avec{" "}
            {customerName || "votre client"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Phone number input */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              <Phone className="h-3 w-3 inline mr-1" />
              Numéro WhatsApp du client (optionnel)
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+229 97 00 00 00"
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
              WhatsApp (avec PDF)
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
              WhatsApp (message uniquement)
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
                Autres applications
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
              Télécharger le PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
