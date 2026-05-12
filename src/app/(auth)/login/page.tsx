"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getPostAuthPath } from "@/lib/subscription/post-auth-redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/i18n/context";
import { BilloLogoMark } from "@/components/brand/billo-logo";
import {
  Mic,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

type LoginFormValues = { email: string; password: string };

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t("auth.login.errorEmailRequired"))
      .email(t("auth.login.errorEmailInvalid")),
    password: z.string().min(1, t("auth.login.errorPasswordRequired")),
  });

  const [values, setValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<LoginFormValues>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<LoginFormValues> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof LoginFormValues;
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setIsLoading(false);
      toast.error(
        error.message === "Invalid login credentials"
          ? t("auth.login.errorInvalidCredentials")
          : error.message,
      );
      return;
    }

    const nextPath = await getPostAuthPath();
    setIsLoading(false);
    toast.success(t("auth.login.successToast"));
    router.push(nextPath);
    router.refresh();
  };

  const highlights = [
    t("auth.login.panelH1"),
    t("auth.login.panelH2"),
    t("auth.login.panelH3"),
    t("auth.login.panelH4"),
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5"
            aria-label="Billo — Accueil"
          >
            <BilloLogoMark className="h-9 w-9" size={36} />
            <span className="text-lg font-bold text-brand">
              Billo
            </span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {t("auth.login.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("auth.login.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <GoogleSignInButton />

            <div className="relative flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-foreground/80">
                {t("auth.login.emailLabel")}
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="votre@email.com"
                value={values.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={isLoading}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={
                  errors.email
                    ? "border-red-400 focus-visible:ring-red-400 dark:border-red-500 dark:focus-visible:ring-red-500"
                    : ""
                }
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80">
                  {t("auth.login.passwordLabel")}
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-brand hover:underline"
                  tabIndex={0}
                >
                  {t("auth.login.forgotPassword")}
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className={
                  errors.password
                    ? "border-red-400 pr-10 focus-visible:ring-red-400 dark:border-red-500 dark:focus-visible:ring-red-500"
                    : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? t("auth.login.hidePassword")
                      : t("auth.login.showPassword")
                  }
                  tabIndex={0}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs text-red-500 dark:text-red-400">
                  {errors.password}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full gap-2 rounded-xl bg-brand text-brand-foreground shadow-sm hover:bg-brand/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  {t("auth.login.submitting")}
                </>
              ) : (
                <>
                  {t("auth.login.submit")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.login.noAccount")}{" "}
            <Link
              href="/register"
              className="font-semibold text-brand hover:underline"
              tabIndex={0}
            >
              {t("auth.login.registerLink")}
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Brand panel */}
      <div
        className="hidden bg-brand lg:flex lg:flex-col lg:items-center lg:justify-center lg:px-12"
        aria-hidden
      >
        <div
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(128,128,128,0.25) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-sm text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-brand-foreground/10 backdrop-blur-sm ring-1 ring-brand-foreground/20">
              <Mic className="h-10 w-10 text-brand-foreground" aria-hidden />
            </div>
          </div>

          <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-brand-foreground">
            {t("auth.login.panelTitle1")}{" "}
            <span className="text-primary">
              {t("auth.login.panelTitle2")}
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-brand-foreground/70">
            {t("auth.login.panelSubtitle")}
          </p>

          <ul className="mt-8 flex flex-col gap-3 text-left">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm text-brand-foreground/80">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 rounded-2xl border border-brand-foreground/10 bg-brand-foreground/5 p-5 text-left backdrop-blur-sm">
            <p className="text-sm italic leading-relaxed text-brand-foreground/70">
              &ldquo;{t("auth.login.panelQuote")}&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2.5 border-t border-brand-foreground/10 pt-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-foreground/10 text-xs font-bold text-brand-foreground">
                IK
              </div>
              <div>
                <p className="text-xs font-semibold text-brand-foreground">
                  {t("auth.login.panelAuthor")}
                </p>
                <p className="text-xs text-brand-foreground/50">
                  {t("auth.login.panelAuthorRole")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
