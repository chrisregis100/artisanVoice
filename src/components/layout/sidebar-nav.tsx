"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/context";
import { cn } from "@/lib/utils";
import {
  Settings,
  LogOut,
  Home,
  HelpCircle,
  Users,
  FolderOpen,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { BilloLogoMark } from "@/components/brand/billo-logo";

export function useNavItems() {
  const { t } = useLanguage();
  return [
    { href: "/dashboard", labelKey: "dashboard.nav.home", icon: Home },
    { href: "/customers", labelKey: "dashboard.nav.customers", icon: Users },
    { href: "/invoices", labelKey: "dashboard.nav.documents", icon: FolderOpen },
    { href: "/settings", labelKey: "dashboard.nav.settings", icon: Settings },
  ];
}

interface SidebarNavProps {
  businessName?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function SidebarNav({
  businessName,
  isExpanded,
  onToggle,
}: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const navLinks = useNavItems();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="flex h-full flex-col gap-6 w-full">
      <div className="flex px-1 mt-2 mb-4 justify-between items-center">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 min-w-0 overflow-hidden"
        >
          <BilloLogoMark className="h-10 w-10" size={40} />
          <span
            className={cn(
              "text-lg font-bold tracking-tight text-brand whitespace-nowrap transition-all duration-300",
              isExpanded
                ? "opacity-100 translate-x-0 w-auto"
                : "opacity-0 -translate-x-4 w-0",
            )}
          >
            Billo
          </span>
        </Link>
      </div>

      <nav
        className="flex flex-col gap-2"
        aria-label={t("dashboard.nav.home")}
      >
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition-all duration-200 group overflow-hidden whitespace-nowrap",
              pathname === item.href
                ? "bg-brand-muted text-brand"
                : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            title={!isExpanded ? t(item.labelKey) : undefined}
          >
            <item.icon
              className={cn(
                "h-6 w-6 shrink-0",
                pathname === item.href
                  ? "text-brand"
                  : "text-muted-foreground",
              )}
              strokeWidth={2}
            />
            <span
              className={cn(
                "transition-all duration-300",
                isExpanded
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-4 w-0",
              )}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-border/60 pt-4 pb-2">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-all duration-200 overflow-hidden whitespace-nowrap"
          title={!isExpanded ? t("dashboard.nav.help") : undefined}
        >
          <HelpCircle className="h-6 w-6 shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "transition-all duration-300",
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4 w-0",
            )}
          >
            {t("dashboard.nav.help")}
          </span>
        </Link>

        <button
          className="flex w-full items-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 overflow-hidden whitespace-nowrap"
          onClick={handleSignOut}
          title={!isExpanded ? t("dashboard.nav.logout") : undefined}
        >
          <LogOut className="h-6 w-6 shrink-0" strokeWidth={2} />
          <span
            className={cn(
              "transition-all duration-300",
              isExpanded
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-4 w-0",
            )}
          >
            {t("dashboard.nav.logout")}
          </span>
        </button>

        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-3 rounded-xl p-3 text-sm font-medium text-muted-foreground hover:bg-muted/80 transition-all duration-200 mt-2"
          aria-label={
            isExpanded
              ? t("dashboard.nav.collapse")
              : t("dashboard.nav.expand")
          }
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronRight className="h-5 w-5 shrink-0" />
          )}
        </button>
      </div>
    </div>
  );
}
