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
  HelpCircle,
  Users,
  FolderOpen,
  ChevronRight,
  ChevronLeft
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/customers", label: "Clients", icon: Users },
  { href: "/invoices", label: "Documents", icon: FolderOpen },
  { href: "/settings", label: "Paramètres", icon: Settings },
];

interface SidebarNavProps {
  businessName?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarNav({ businessName, isExpanded, onToggle }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col gap-6 w-full">
      <div className="flex px-1 mt-2 mb-4 justify-between items-center">
        <Link href="/" className="flex items-center gap-3 min-w-0 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2e3165] shadow-sm">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <span
            className={cn(
              "text-lg font-bold tracking-tight text-[#2e3165] whitespace-nowrap transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0 w-auto" : "opacity-0 -translate-x-4 w-0"
            )}
          >
            ArtisanVoice
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2" aria-label="Navigation principale">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap",
              pathname === item.href
                ? "bg-indigo-50/80 text-[#2e3165]"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
            title={!isExpanded ? item.label : undefined}
          >
            <item.icon className={cn("h-6 w-6 shrink-0", pathname === item.href ? "text-[#2e3165]" : "text-muted-foreground")} strokeWidth={2} />
            <span
              className={cn(
                "transition-all duration-300",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
              )}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-4 pb-2">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200 overflow-hidden whitespace-nowrap"
          title={!isExpanded ? "Aide" : undefined}
        >
          <HelpCircle className="h-6 w-6 shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
            )}
          >
            Aide
          </span>
        </Link>

        <button
          className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-all duration-200 overflow-hidden whitespace-nowrap"
          onClick={handleSignOut}
          title={!isExpanded ? "Déconnexion" : undefined}
        >
          <LogOut className="h-6 w-6 shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "transition-all duration-300",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 w-0"
            )}
          >
            Déconnexion
          </span>
        </button>

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-all duration-200 mt-2"
          aria-label={isExpanded ? "Réduire le menu" : "Agrandir le menu"}
        >
          {isExpanded ? <ChevronLeft className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
        </button>
      </div>
    </div>
  );
}
