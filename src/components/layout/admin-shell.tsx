"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Bot,
  CreditCard,
  Key,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/admin/users", label: "Utilisateurs", icon: Users },
  { href: "/admin/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/admin/payments", label: "Paiements", icon: CreditCard },
  { href: "/admin/ai", label: "Fournisseur IA", icon: Bot },
  { href: "/admin/plans", label: "Plans tarifaires", icon: Package },
  { href: "/admin/keys", label: "Clés API", icon: Key },
] as const;

export function AdminShell({ children, userEmail }: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const renderNavLinks = (onNavigate?: () => void) => (
    <ul className="flex flex-col gap-1 p-2">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" aria-hidden />
          </div>
          <span className="font-semibold">Admin</span>
        </div>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          aria-expanded={isMobileNavOpen}
          aria-label={isMobileNavOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {isMobileNavOpen ? (
        <nav
          className="border-b bg-background md:hidden"
          aria-label="Navigation administration"
        >
          {renderNavLinks(() => setIsMobileNavOpen(false))}
          <div className="border-t p-2">
            <Link
              href="/dashboard"
              onClick={() => setIsMobileNavOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Retour au tableau de bord
            </Link>
          </div>
        </nav>
      ) : null}

      <aside className="hidden w-56 shrink-0 flex-col border-r border-border/60 bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border/60 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Settings className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Administration</p>
            {userEmail ? (
              <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
            ) : null}
          </div>
        </div>
        <nav className="flex-1 py-2" aria-label="Navigation administration">
          {renderNavLinks()}
        </nav>
        <div className="border-t border-border/60 p-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Retour au tableau de bord
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
