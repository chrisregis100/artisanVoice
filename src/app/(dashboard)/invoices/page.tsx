import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { CheckCircle, FileText, Send } from "lucide-react";

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
  const displayBusinessName =
    user?.user_metadata?.business_name ||
    user?.user_metadata?.name ||
    "Mon espace";

  return (
    <div className="h-full min-h-0 flex-1 overflow-y-auto bg-muted/20">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-8 lg:py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
          Documents
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Mes documents
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{displayBusinessName}</p>
        <div className="mt-8">

        {typedInvoices.length === 0 ? (
          <Card className="rounded-xl border shadow-sm">
            <CardContent className="py-16 text-center">
              <FileText className="h-16 w-16 mx-auto text-foreground mb-6" />
              <p className="text-xl font-semibold text-foreground">
                Vous n&apos;avez pas encore de documents
              </p>
              <p className="text-base text-muted-foreground mt-2">
                Créez votre premier devis en utilisant la commande vocale
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {typedInvoices.map((invoice) => {
              const StatusIcon =
                statusIcons[invoice.status as keyof typeof statusIcons];
              const statusLabel =
                statusLabels[invoice.status as keyof typeof statusLabels];
              const statusColor =
                statusColors[invoice.status as keyof typeof statusColors];

              return (
                <Card
                  key={invoice.id}
                  className="cursor-pointer rounded-xl border shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-lg truncate">
                            {invoice.customer_name || "Sans nom"}
                          </span>
                          <span className="text-xs font-medium px-2 py-1 rounded bg-primary text-primary-foreground">
                            {invoice.type === "quote" ? "Devis" : "Facture"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{formatDate(invoice.created_at)}</span>
                          <span
                            className={`flex items-center gap-1.5 font-medium ${statusColor}`}
                          >
                            <StatusIcon className="h-4 w-4" />
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      <div className="text-right pl-4">
                        <p className="font-semibold text-xl">
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
      </div>
    </div>
  );
}
