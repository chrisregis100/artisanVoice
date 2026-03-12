"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Mic,
  FileText,
  Settings,
  LogOut,
  Home,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Nouveau devis", icon: Home },
  { href: "/invoices", label: "Mes documents", icon: FileText },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

export function SidebarNav({ businessName }: { businessName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Mic className="w-5 h-5 text-background" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase">
            ArtisanVoice
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all border-2",
              pathname === item.href
                ? "bg-foreground text-background border-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]"
                : "bg-white text-foreground border-transparent hover:border-foreground hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t-4 border-foreground">
        {businessName && (
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 truncate">
            {businessName}
          </p>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-2 border-foreground font-bold hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
