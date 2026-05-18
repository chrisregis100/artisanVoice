import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPaywallStatus } from "@/lib/credits/wallet";
import { listPacks } from "@/lib/credits/packs";
import { PaywallContent } from "./paywall-content";

export function generateMetadata() {
  return {
    title: "Choisissez un pack — Billo",
    robots: { index: false, follow: false },
  };
}

export default async function PaywallPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const status = await getPaywallStatus(user.id);
  if (!status.shouldBlock) redirect("/dashboard");

  const packs = await listPacks();

  return <PaywallContent packs={packs} />;
}
