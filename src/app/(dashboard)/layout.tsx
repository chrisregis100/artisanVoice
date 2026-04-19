import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
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

  const businessName =
    user.user_metadata?.business_name ||
    user.user_metadata?.name ||
    null;

  return (
    <DashboardShell
      businessName={businessName}
      userEmail={user?.email ?? null}
    >
      {children}
    </DashboardShell>
  );
}
