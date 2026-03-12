import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Send, CheckCircle } from "lucide-react";
import type { Database } from "@/lib/supabase/types";

type Invoice = Database["public"]["Tables"]["invoices"]["Row"];

const statusIcons = {
  draft: FileText,
  sent: Send,
  paid: CheckCircle,
};

const statusLabels = {
  draft: "Brouillon",
  sent: "Envoyé",
  paid: "Payé",
};

const statusColors = {
  draft: "text-muted-foreground",
  sent: "text-blue-600",
  paid: "text-green-600",
};

export default async function InvoicesPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", user?.id || "")
    .order("created_at", { ascending: false });

  const typedInvoices = (invoices || []) as Invoice[];

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Mes documents</h1>

      {typedInvoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Vous n&apos;avez pas encore de documents
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez votre premier devis en utilisant la commande vocale
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {typedInvoices.map((invoice) => {
            const StatusIcon = statusIcons[invoice.status as keyof typeof statusIcons];
            const statusLabel = statusLabels[invoice.status as keyof typeof statusLabels];
            const statusColor = statusColors[invoice.status as keyof typeof statusColors];

            return (
              <Card key={invoice.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {invoice.customer_name || "Sans nom"}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted">
                          {invoice.type === "quote" ? "Devis" : "Facture"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{formatDate(invoice.created_at)}</span>
                        <span className={`flex items-center gap-1 ${statusColor}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(invoice.total)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
