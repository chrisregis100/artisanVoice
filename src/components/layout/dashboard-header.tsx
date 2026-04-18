"use client";

import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface DashboardHeaderProps {
  userEmail?: string | null;
  businessName?: string | null;
  className?: string;
}

function getInitials(email?: string | null, name?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    const letters = parts
      .map((p) => p[0]?.toUpperCase())
      .filter(Boolean)
      .join("");
    if (letters.length > 0) return letters;
  }
  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return (local[0] ?? "?").toUpperCase();
  }
  return "?";
}

export function DashboardHeader({
  userEmail,
  businessName,
  className,
}: DashboardHeaderProps) {
  const { t } = useLanguage();
  const initials = getInitials(userEmail, businessName);
  const accountLabel =
    businessName?.trim() ||
    userEmail?.trim() ||
    t("dashboard.header.defaultAccount");

  return (
    <header
      className={cn(
        "hidden h-16 shrink-0 items-center justify-between border-b border-border/60 bg-background px-5 md:flex lg:px-8",
        className,
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          {t("dashboard.header.title")}
        </h1>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          <div className="h-2 w-2 rounded-full bg-primary" />
          {t("dashboard.header.connected")}
        </div>

        <LanguageSwitcher variant="minimal" />

        <ThemeToggle />

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t("dashboard.header.notifications")}
        >
          <Bell className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-medium text-brand-foreground"
            aria-label={`${t("dashboard.header.defaultAccount")} : ${accountLabel}`}
          >
            <span aria-hidden>{initials}</span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {businessName || userEmail || t("dashboard.header.defaultAccount")}
          </span>
        </div>
      </div>
    </header>
  );
}
