import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const initials = getInitials(userEmail, businessName);
  const accountLabel =
    businessName?.trim() ||
    userEmail?.trim() ||
    "Compte utilisateur";

  return (
    <header
      className={cn(
        "hidden h-16 shrink-0 items-center justify-between border-b border-border/60 bg-white px-5 md:flex lg:px-8",
        className
      )}
    >
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-[#111827]">
          Assistant vocal
        </h1>
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-4">
        {/* Mockup shows a "Mode Hors Ligne" badge in green - let's add it as a status indicator */}
        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          Mode Connecté
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" aria-hidden />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-border/60">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e1e40] text-xs font-medium text-white"
            aria-label={`Compte : ${accountLabel}`}
          >
            <span aria-hidden>{initials}</span>
          </div>
          <span className="text-sm font-medium text-[#111827]">
            {businessName || userEmail || "Jean Bernard"}
          </span>
        </div>
      </div>
    </header>
  );
}
