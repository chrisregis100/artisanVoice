import { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { SettingsInitializer } from "@/components/settings-initializer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Billo" },
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (!subscription) {
    redirect("/subscribe");
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "business_name, phone, business_address, quote_prefix, invoice_prefix, vat_rate_percent, legal_mentions, currency"
    )
    .eq("id", user.id)
    .single();

  const businessName =
    profile?.business_name ||
    user.user_metadata?.business_name ||
    user.user_metadata?.name ||
    null;

  const dbSettings = {
    business_name: profile?.business_name || user.user_metadata?.business_name || "",
    phone: profile?.phone || user.user_metadata?.phone || "",
    business_address: profile?.business_address ?? "",
    quote_prefix: profile?.quote_prefix ?? "DV-",
    invoice_prefix: profile?.invoice_prefix ?? "FAC-",
    vat_rate_percent: profile?.vat_rate_percent ?? 20,
    legal_mentions: profile?.legal_mentions ?? "",
    currency: profile?.currency ?? "XOF",
  };

  return (
    <DashboardShell
      businessName={businessName}
      userEmail={user?.email ?? null}
    >
      <SettingsInitializer settings={dbSettings} />
      {children}
    </DashboardShell>
  );
}
