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

/** Below this width (px) the sidebar collapses to icons and overlays on expand. */
const NARROW_BREAKPOINT = 1300;

interface DashboardShellProps {
  children: React.ReactNode;
  businessName?: string;
  userEmail?: string | null;
  isAdmin?: boolean;
}

export function DashboardShell({
  children,
  businessName,
  userEmail,
  isAdmin,
}: DashboardShellProps) {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  /**
   * true when viewport is between the md breakpoint and NARROW_BREAKPOINT.
   * Initialised to false (SSR-safe); set by a MediaQueryList listener after
   * hydration to avoid hydration mismatches.
   */
  const [isNarrowDesktop, setIsNarrowDesktop] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Detect narrow-desktop range and auto-collapse when entering it
  useEffect(() => {
    const handleChange = (matches: boolean) => {
      setIsNarrowDesktop(matches);
      // Auto-collapse whenever we cross into the narrow range
      if (matches) setIsDesktopExpanded(false);
    };

    const mq = window.matchMedia(`(max-width: ${NARROW_BREAKPOINT - 1}px)`);
    handleChange(mq.matches);

    const listener = (e: MediaQueryListEvent) => handleChange(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  /**
   * Overlay mode: narrow desktop AND the user has explicitly expanded the sidebar.
   * In this state the sidebar is lifted out of the flex flow (absolute) so the
   * main content width never changes.
   */
  const isOverlay = isNarrowDesktop && isDesktopExpanded;

  return (
    <div className="relative flex h-screen flex-col md:flex-row bg-background overflow-hidden">
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
          isAdmin={isAdmin}
        />
      </aside>

      {/* Narrow-desktop overlay backdrop — dismisses the expanded sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 hidden md:block bg-black/30 transition-opacity duration-300",
          isOverlay
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsDesktopExpanded(false)}
        aria-hidden="true"
      />

      {/* Desktop Sidebar
          - Wide desktop (≥ 1300 px): in flex flow, pushes content.
          - Narrow desktop (< 1300 px, collapsed): thin icon rail, in flex flow.
          - Narrow desktop (< 1300 px, expanded): absolute overlay, no layout shift.
      */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col md:border-r md:border-border/60 md:bg-background md:p-3 md:text-foreground transition-all duration-300 ease-in-out",
          isOverlay
            ? // Lifted out of flex flow → overlays content, no layout shift
              "md:absolute md:inset-y-0 md:left-0 md:z-50 md:w-64 md:shrink-0 md:shadow-xl"
            : isDesktopExpanded
              ? "md:w-64 md:shrink-0"
              : "md:w-[4.5rem] md:shrink-0",
        )}
      >
        <SidebarNav
          businessName={businessName}
          isExpanded={isDesktopExpanded}
          onToggle={() => setIsDesktopExpanded(!isDesktopExpanded)}
          isAdmin={isAdmin}
        />
      </aside>

      {/* Main column — never resizes when the sidebar is in overlay mode */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface">
        <DashboardHeader userEmail={userEmail} businessName={businessName} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
