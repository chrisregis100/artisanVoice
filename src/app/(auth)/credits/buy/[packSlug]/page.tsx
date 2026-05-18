import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPack } from "@/lib/credits/packs";
import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "./checkout-client";

interface PageProps {
  params: Promise<{ packSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { packSlug } = await params;
  const pack = await getPack(packSlug);
  return {
    title: pack ? `Acheter le pack ${pack.displayName}` : "Pack introuvable",
  };
}

export default async function CreditsBuyPage({ params }: PageProps) {
  const { packSlug } = await params;

  const [pack, supabase] = await Promise.all([
    getPack(packSlug),
    Promise.resolve(createClient()),
  ]);

  if (!pack) {
    redirect("/pricing");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirect=/credits/buy/${packSlug}`);
  }

  return <CheckoutClient pack={pack} userId={user.id} />;
}
