"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const schema = z
    .object({
      password: z
        .string()
        .min(8, t("auth.resetPassword.errorMinLength")),
      confirm: z.string(),
    })
    .refine((data) => data.password === data.confirm, {
      message: t("auth.resetPassword.errorMismatch"),
      path: ["confirm"],
    });

  useEffect(() => {
    const run = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setHasSession(!!session);
      setIsReady(true);
    };
    void run();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse({ password, confirm });
    if (!result.success) {
      const msg =
        result.error.flatten().fieldErrors.password?.[0] ??
        result.error.flatten().fieldErrors.confirm?.[0] ??
        result.error.issues[0]?.message;
      toast.error(msg);
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      password: result.data.password,
    });
    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(t("auth.resetPassword.successToast"));
    router.push("/login");
    router.refresh();
  };

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <BilloLogoMark className="mx-auto h-10 w-10" size={40} />
          <h1 className="mt-6 text-xl font-semibold">
            {t("auth.resetPassword.noSessionTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.resetPassword.noSessionDesc")}
          </p>
          <Button className="mt-6" asChild>
            <Link href="/forgot-password">
              {t("auth.resetPassword.requestNewLink")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2.5">
          <BilloLogoMark className="h-9 w-9" size={36} />
          <span className="text-lg font-bold text-brand">Billo</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("auth.resetPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.resetPassword.subtitle")}
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="password">{t("auth.resetPassword.passwordLabel")}</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="pr-10"
                aria-required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? t("auth.login.hidePassword")
                    : t("auth.login.showPassword")
                }
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">{t("auth.resetPassword.confirmLabel")}</Label>
            <Input
              id="confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={isLoading}
              aria-required
            />
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : null}
            {isLoading
              ? t("auth.resetPassword.submitting")
              : t("auth.resetPassword.submit")}
          </Button>
        </form>
      </div>
    </div>
  );
}
