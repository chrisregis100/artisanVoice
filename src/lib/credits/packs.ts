import { createClient } from "@/lib/supabase/server";

export interface CreditPack {
  id: string;
  slug: string;
  displayName: string;
  creditsAmount: number;
  bonusCredits: number;
  priceUsdCents: number;
  priceXof: number;
  isActive: boolean;
  sortOrder: number;
}

export async function listPacks(): Promise<CreditPack[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_packs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(`Failed to list credit packs: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    creditsAmount: row.credits_amount,
    bonusCredits: row.bonus_credits,
    priceUsdCents: row.price_usd_cents,
    priceXof: row.price_xof,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function getPack(slug: string): Promise<CreditPack | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_packs")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    displayName: data.display_name,
    creditsAmount: data.credits_amount,
    bonusCredits: data.bonus_credits,
    priceUsdCents: data.price_usd_cents,
    priceXof: data.price_xof,
    isActive: data.is_active,
    sortOrder: data.sort_order,
  };
}
