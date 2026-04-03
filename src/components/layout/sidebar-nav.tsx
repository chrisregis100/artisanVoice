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
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary">
            <Mic className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-semibold text-xl tracking-tight">
            ArtisanVoice
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t">
        {businessName && (
          <p className="text-sm font-medium text-muted-foreground mb-4 truncate">
            {businessName}
          </p>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-3"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}
