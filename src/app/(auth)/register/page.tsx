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
import {
  Mic,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  Zap,
  Users,
  FileText,
} from "lucide-react";

type RegisterFormValues = {
  business_name: string;
  email: string;
  phone?: string;
  password: string;
};
type FieldErrors = Partial<Record<keyof RegisterFormValues, string>>;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const registerSchema = z.object({
    business_name: z
      .string()
      .min(2, t("auth.register.errorBusinessNameMin")),
    email: z
      .string()
      .min(1, t("auth.register.errorEmailRequired"))
      .email(t("auth.register.errorEmailInvalid")),
    phone: z.string().optional(),
    password: z
      .string()
      .min(6, t("auth.register.errorPasswordMin")),
  });

  const [values, setValues] = useState<RegisterFormValues>({
    business_name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterFormValues]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterFormValues;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    const supabase = createClient();
    const { data: authData, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          business_name: values.business_name,
          phone: values.phone ?? "",
        },
      },
    });

    if (error) {
      setIsLoading(false);
      toast.error(
        error.message === "User already registered"
          ? t("auth.register.errorUserExists")
          : error.message,
      );
      return;
    }

    if (authData.session) {
      const nextPath = await getPostAuthPath();
      setIsLoading(false);
      toast.success(t("auth.register.successToast"));
      router.push(nextPath);
      router.refresh();
      return;
    }

    setIsLoading(false);
    toast.success(t("auth.register.confirmEmailToast"));
    router.push("/login");
  };

  const perks = [
    {
      icon: Mic,
      title: t("auth.register.perk1Title"),
      desc: t("auth.register.perk1Desc"),
    },
    {
      icon: FileText,
      title: t("auth.register.perk2Title"),
      desc: t("auth.register.perk2Desc"),
    },
    {
      icon: Users,
      title: t("auth.register.perk3Title"),
      desc: t("auth.register.perk3Desc"),
    },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex flex-col items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-10 flex items-center gap-2.5"
            aria-label="ArtisanVoice — Accueil"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand shadow-sm">
              <Mic className="h-5 w-5 text-brand-foreground" aria-hidden />
            </div>
            <span className="text-lg font-bold text-brand">
              ArtisanVoice
            </span>
          </Link>

          <div className="mb-8">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Zap className="h-3 w-3" aria-hidden />
              {t("auth.register.badge")}
            </span>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              {t("auth.register.title")}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {t("auth.register.subtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="business_name" className="text-slate-700">
                {t("auth.register.businessNameLabel")}
              </Label>
              <Input
                id="business_name"
                name="business_name"
                type="text"
                placeholder="Ex: Menuiserie Kossi"
                value={values.business_name}
                onChange={handleChange}
                disabled={isLoading}
                aria-invalid={!!errors.business_name}
                aria-describedby={
                  errors.business_name ? "business-name-error" : undefined
                }
                className={
                  errors.business_name
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                }
              />
              {errors.business_name && (
                <p id="business-name-error" className="text-xs text-red-500">
                  {errors.business_name}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">
                {t("auth.register.emailLabel")}
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
                    ? "border-red-400 focus-visible:ring-red-400"
                    : ""
                }
              />
              {errors.email && (
                <p id="email-error" className="text-xs text-red-500">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-700">
                {t("auth.register.phoneLabel")}{" "}
                <span className="text-slate-400 font-normal">
                  {t("auth.register.phoneOptional")}
                </span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Ex: +229 97 00 00 00"
                value={values.phone}
                onChange={handleChange}
                disabled={isLoading}
                autoComplete="tel"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700">
                {t("auth.register.passwordLabel")}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={values.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  disabled={isLoading}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : "password-hint"
                  }
                  className={
                    errors.password
                      ? "border-red-400 pr-10 focus-visible:ring-red-400"
                      : "pr-10"
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={
                    showPassword
                      ? t("auth.register.hidePassword")
                      : t("auth.register.showPassword")
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
              {errors.password ? (
                <p id="password-error" className="text-xs text-red-500">
                  {errors.password}
                </p>
              ) : (
                <p id="password-hint" className="text-xs text-slate-400">
                  {t("auth.register.passwordHint")}
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
                  {t("auth.register.submitting")}
                </>
              ) : (
                <>
                  {t("auth.register.submit")}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-xs leading-relaxed text-slate-400">
            {t("auth.register.terms1")}{" "}
            <Link href="/legal" className="underline hover:text-slate-600">
              {t("auth.register.terms2")}
            </Link>{" "}
            {t("auth.register.terms3")}{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">
              {t("auth.register.terms4")}
            </Link>
            .
          </p>

          <p className="mt-4 text-center text-sm text-slate-500">
            {t("auth.register.hasAccount")}{" "}
            <Link
              href="/login"
              className="font-semibold text-brand hover:underline"
              tabIndex={0}
            >
              {t("auth.register.loginLink")}
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
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-sm">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <Mic className="h-10 w-10 text-white" aria-hidden />
            </div>
          </div>

          <h2 className="text-center text-3xl font-extrabold leading-tight tracking-tight text-white">
            {t("auth.register.panelTitle")}{" "}
            <span className="text-primary">
              {t("auth.register.panelTitleHighlight")}
            </span>
          </h2>

          <p className="mt-4 text-center text-base leading-relaxed text-slate-300">
            {t("auth.register.panelSubtitle")}
          </p>

          <div className="mt-8 flex flex-col gap-4">
            {perks.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/20">
                  <Icon className="h-4.5 w-4.5 text-primary" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            {t("auth.register.afterRegister")}
          </p>
        </div>
      </div>
    </div>
  );
}
