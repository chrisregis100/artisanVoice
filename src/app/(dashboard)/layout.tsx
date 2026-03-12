import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TESTING: Skip auth check
  const businessName = "Test Artisan";

  return (
    <DashboardShell businessName={businessName}>
      {children}
    </DashboardShell>
  );
}
