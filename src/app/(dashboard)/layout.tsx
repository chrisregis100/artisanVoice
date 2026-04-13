import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const businessName = user?.user_metadata?.business_name || user?.user_metadata?.name || null;

  return (
    <DashboardShell
      businessName={businessName}
      userEmail={user?.email ?? null}
    >
      {children}
    </DashboardShell>
  );
}
