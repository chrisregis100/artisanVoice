"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Loader2, LogOut, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useLanguage } from "@/i18n/context";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface MarketingUser {
  id: string;
  email: string | null;
  firstName: string;
}

interface MarketingHeaderProps {
  initialUser: MarketingUser | null;
}

const deriveFirstName = (
  meta: Record<string, unknown>,
  email: string | null,
): string => {
  const candidateKeys = [
    "first_name",
    "given_name",
    "name",
    "full_name",
    "business_name",
  ];
  for (const key of candidateKeys) {
    const value = meta[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim().split(/\s+/)[0] ?? "";
    }
  }
  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local) return local.split(/[._-]/)[0] ?? local;
  }
  return "";
};

export function MarketingHeader({ initialUser }: MarketingHeaderProps) {
  const router = useRouter();
  const { t } = useLanguage();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<MarketingUser | null>(initialUser);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      if (!sessionUser) {
        setUser(null);
        return;
      }
      const meta = (sessionUser.user_metadata ?? {}) as Record<string, unknown>;
      setUser({
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        firstName: deriveFirstName(meta, sessionUser.email ?? null),
      });
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setIsSigningOut(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setUser(null);
    setMobileOpen(false);
    toast.success(t("nav.signOutSuccess"));
    router.refresh();
  };

  const navLinks = [
    { href: "/#features", label: t("nav.features") },
    { href: "/#pricing", label: t("nav.pricing") },
    { href: "/#faq", label: t("nav.faq") },
  ];

  const isAuthenticated = !!user;
  const welcomeLabel = isAuthenticated
    ? t("nav.welcome", { name: user?.firstName || "" }).trim()
    : "";

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-background/95 backdrop-blur-md shadow-sm border-b border-border"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label={t("nav.homeAria")}
        >
          <BilloLogoMark className="h-9 w-9" size={36} />
          <span className="text-lg font-bold text-brand">Billo</span>
        </Link>

        <nav
          className="hidden items-center gap-8 md:flex"
          aria-label={t("nav.mainNav")}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <LanguageSwitcher variant="ghost" />
          {isAuthenticated ? (
            <>
              <span
                className="max-w-[180px] truncate text-sm font-medium text-foreground"
                title={welcomeLabel}
              >
                {welcomeLabel}
              </span>
              <Button
                asChild
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard" aria-label={t("nav.dashboard")}>
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  {t("nav.dashboard")}
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                disabled={isSigningOut}
                aria-label={t("nav.logout")}
                className="gap-2"
              >
                {isSigningOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    {t("nav.signingOut")}
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" aria-hidden />
                    {t("nav.logout")}
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                asChild
                className="text-muted-foreground hover:text-foreground"
              >
                <Link href="/login">{t("nav.login")}</Link>
              </Button>
              <Button
                asChild
                className="bg-brand text-brand-foreground hover:bg-brand/90 shadow-sm"
              >
                <Link href="/register">{t("nav.registerFree")}</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted md:hidden"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" aria-hidden />
          ) : (
            <Menu className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background/98 backdrop-blur-md p-4 flex flex-col gap-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="flex flex-col gap-2 border-t border-border pt-3">
            <div className="flex items-center justify-center gap-2 pb-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
            {isAuthenticated ? (
              <>
                <p
                  className="px-1 text-center text-sm font-medium text-foreground"
                  title={welcomeLabel}
                >
                  {welcomeLabel}
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    {t("nav.dashboard")}
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  aria-label={t("nav.logout")}
                  className="w-full gap-2 bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  {isSigningOut ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      {t("nav.signingOut")}
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" aria-hidden />
                      {t("nav.logout")}
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="w-full">
                  <Link href="/login">{t("nav.login")}</Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                >
                  <Link href="/register">{t("nav.registerFree")}</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
