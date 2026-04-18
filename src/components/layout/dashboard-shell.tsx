"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { useNavItems, SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { DashboardHeader } from "./dashboard-header";
import { useLanguage } from "@/i18n/context";

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
  userEmail?: string | null;
}

export function DashboardShell({
  children,
  businessName,
  userEmail,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  const navLinks = useNavItems();

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
              aria-label={
                isMobileMenuOpen
                  ? t("dashboard.nav.closeMenu")
                  : t("dashboard.nav.openMenu")
              }
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <BilloLogoMark size={32} />
              <span className="font-semibold text-lg">Billo</span>
            </Link>
          </div>
          <ThemeToggle />
        </div>

        {isMobileMenuOpen && (
          <nav
            className="flex flex-col gap-1 border-t border-border/60 bg-background p-2"
            aria-label={t("nav.mainNav")}
          >
            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {t(item.labelKey)}
              </Link>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex w-full items-center gap-3 rounded-lg border-t border-border/60 px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-muted"
            >
              {t("dashboard.main.signOut")}
            </button>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:shrink-0 md:flex-col md:border-r md:border-border/60 md:bg-white md:p-3 md:text-foreground transition-all duration-300 ease-in-out",
          isDesktopExpanded ? "md:w-64" : "md:w-[4.5rem]",
        )}
      >
        <SidebarNav
          businessName={businessName}
          isExpanded={isDesktopExpanded}
          onToggle={() => setIsDesktopExpanded(!isDesktopExpanded)}
        />
      </aside>

      {/* Main column: header + content */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <DashboardHeader userEmail={userEmail} businessName={businessName} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
