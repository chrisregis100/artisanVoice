import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";

export default function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="flex flex-col items-center gap-8 max-w-md text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-brand">
          <Mic className="w-10 h-10 text-brand-foreground" />
        </div>
        
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            ArtisanVoice
          </h1>
          <p className="text-lg text-muted-foreground">
            Créez vos devis et factures par la voix, sans saisie au clavier
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link href="/login" className="w-full">
            <Button className="w-full h-12 text-lg" size="lg">
              Connexion
            </Button>
          </Link>
          <Link href="/register" className="w-full">
            <Button variant="outline" className="w-full h-12 text-lg" size="lg">
              Créer un compte
            </Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Assistant intelligent pour artisans à Cotonou et partout ailleurs
        </p>
      </div>
    </main>
  );
}
