"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { clientEnv } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const schema = z.object({
    email: z
      .string()
      .min(1, t("auth.forgotPassword.errorEmailRequired"))
      .email(t("auth.forgotPassword.errorEmailInvalid")),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setIsLoading(true);
    const supabase = createClient();
    const redirectTo = `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(
      parsed.data.email,
      { redirectTo },
    );

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsSent(true);
    toast.success(t("auth.forgotPassword.successToast"));
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t("auth.forgotPassword.backToLogin")}
        </Link>

        <div className="mb-8 flex items-center gap-2.5">
          <BilloLogoMark className="h-9 w-9" size={36} />
          <span className="text-lg font-bold text-brand">Billo</span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("auth.forgotPassword.title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.forgotPassword.subtitle")}
        </p>

        {isSent ? (
          <div
            className="mt-8 flex flex-col items-center gap-4 rounded-lg border bg-muted/40 px-6 py-10 text-center"
            role="status"
          >
            <Mail className="h-12 w-12 text-brand" aria-hidden />
            <p className="text-sm text-muted-foreground">
              {t("auth.forgotPassword.sentHint")}
            </p>
            <Button variant="outline" asChild>
              <Link href="/login">{t("auth.forgotPassword.backToLogin")}</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.forgotPassword.emailLabel")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                aria-required
              />
            </div>
            <Button type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              {isLoading
                ? t("auth.forgotPassword.submitting")
                : t("auth.forgotPassword.submit")}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
