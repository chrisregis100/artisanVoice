import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PaidBlockMessage() {
  return (
    <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-muted/20 p-4">
      <Card className="w-full max-w-md rounded-xl border shadow-lg">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Lock className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="mb-2 text-xl font-semibold text-foreground">
            Document non modifiable
          </h2>

          <p className="mb-6 text-sm text-muted-foreground">
            Ce document a déjà été marqué comme payé. Les documents payés ne
            peuvent plus être modifiés pour des raisons de conformité
            comptable.
          </p>

          <Button asChild className="rounded-lg bg-brand text-brand-foreground hover:bg-brand/90">
            <Link href="/invoices" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Retour aux documents
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
