import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { AdminShell } from "@/components/layout/admin-shell";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s | Billo Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
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

  if (user.email !== env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return <AdminShell userEmail={user.email}>{children}</AdminShell>;
}
