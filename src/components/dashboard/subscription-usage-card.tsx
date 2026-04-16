"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SubscriptionStatusPayload } from "@/hooks/use-subscription-status";
import { useLanguage } from "@/i18n/context";
import { AlertCircle, CreditCard, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";

interface SubscriptionUsageCardProps {
  data: SubscriptionStatusPayload | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  className?: string;
}

function formatPeriodEnd(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function SubscriptionUsageCard({
  data,
  isLoading,
  error,
  refetch,
  className,
}: SubscriptionUsageCardProps) {
  const { t, locale } = useLanguage();
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";

  if (isLoading) {
    return (
      <Card className={className} aria-busy="true">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0" aria-hidden />
            {t("dashboard.subscription.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {t("dashboard.subscription.loading")}
        </CardContent>
      </Card>
    );
  }

  if (error === "session") {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("dashboard.subscription.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {t("dashboard.subscription.sessionRequired")}
        </CardContent>
      </Card>
    );
  }

  if (error === "fetch" || !data) {
    return (
      <Card className={`border-destructive/40 ${className ?? ""}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
            {t("dashboard.subscription.title")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {t("dashboard.subscription.loadError")}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            className="shrink-0 gap-2"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {t("dashboard.subscription.retry")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const planLabel =
    data.plan?.displayName ?? t("dashboard.subscription.noPlan");
  const limit = data.usage.limit;
  const count = data.usage.count;
  const isUnlimited = limit === null;
  const ratio =
    !isUnlimited && limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
  const atLimit = !isUnlimited && count >= (limit ?? 0);

  const planDescription = data.hasSubscription
    ? t("dashboard.subscription.planPrefix").replace("{{plan}}", planLabel)
    : t("dashboard.subscription.noActiveSub");

  const usageLine = isUnlimited
    ? t("dashboard.subscription.usageUnlimited").replace(
        "{{count}}",
        String(count),
      )
    : t("dashboard.subscription.usageLimited")
        .replace("{{count}}", String(count))
        .replace("{{limit}}", String(limit));

  const periodLine = data.subscription?.currentPeriodEnd
    ? t("dashboard.subscription.periodEnd").replace(
        "{{date}}",
        formatPeriodEnd(data.subscription.currentPeriodEnd, dateLocale),
      )
    : null;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              {t("dashboard.subscription.title")}
            </CardTitle>
            <CardDescription className="mt-1">
              {planDescription}
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={() => void refetch()}
            aria-label={t("dashboard.subscription.refreshAria")}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {periodLine ? (
          <p className="text-xs text-muted-foreground">{periodLine}</p>
        ) : null}

        <div className="space-y-1.5">
          <p className="text-sm font-medium leading-snug">{usageLine}</p>

          {!isUnlimited && (
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={limit ?? 0}
              aria-label={usageLine}
            >
              <div
                className={`h-full rounded-full transition-all ${
                  atLimit ? "bg-destructive" : "bg-[#2e3165]"
                }`}
                style={{ width: `${ratio}%` }}
              />
            </div>
          )}

          {atLimit && (
            <p className="text-xs text-destructive font-medium">
              {t("dashboard.subscription.limitReached")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link href="/subscribe">{t("dashboard.subscription.managePlan")}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
