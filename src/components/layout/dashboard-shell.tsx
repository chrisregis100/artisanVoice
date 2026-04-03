"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Mic, Menu, X } from "lucide-react";
import { navItems, SidebarNav } from "./sidebar-nav";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
}

export function DashboardShell({ children, businessName }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-screen flex-col md:flex-row bg-background overflow-hidden">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -ml-2"
              aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary">
                <Mic className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-lg">ArtisanVoice</span>
            </Link>
          </div>
        </div>

        {isMobileMenuOpen && (
          <nav className="border-t p-2 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left mt-2 border-t"
            >
              Se déconnecter
            </button>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r bg-background p-4">
        <SidebarNav businessName={businessName} />
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
