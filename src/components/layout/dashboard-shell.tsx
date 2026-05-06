"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { SidebarNav } from "./sidebar-nav";
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
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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
        </div>
      </header>

      {/* Mobile backdrop — closes drawer when tapped outside */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity duration-300",
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Sidebar Drawer — slides in from the left, overlays content */}
      <aside
        className={cn(
          "fixed top-14 left-0 bottom-0 z-50 w-64 flex flex-col border-r border-border/60 bg-background p-3 transition-transform duration-300 ease-in-out md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label={t("dashboard.nav.home")}
      >
        <SidebarNav
          businessName={businessName}
          isExpanded={true}
          onToggle={() => setIsMobileMenuOpen(false)}
        />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex md:shrink-0 md:flex-col md:border-r md:border-border/60 md:bg-background md:p-3 md:text-foreground transition-all duration-300 ease-in-out",
          isDesktopExpanded ? "md:w-64" : "md:w-[4.5rem]",
        )}
      >
        <SidebarNav
          businessName={businessName}
          isExpanded={isDesktopExpanded}
          onToggle={() => setIsDesktopExpanded(!isDesktopExpanded)}
        />
      </aside>

      {/* Main column — always full width on mobile, flex-1 on desktop */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <DashboardHeader userEmail={userEmail} businessName={businessName} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
