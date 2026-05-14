import { createClient } from "@/lib/supabase/server";

export interface CreditTransaction {
  id: string;
  kind: string;
  delta: number;
  balanceAfter: number;
  packId: string | null;
  paymentProvider: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export async function getWallet(
  userId: string,
): Promise<{ balance: number; signupBonusGranted: boolean } | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_wallets")
    .select("balance, signup_bonus_granted")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  return {
    balance: data.balance,
    signupBonusGranted: data.signup_bonus_granted,
  };
}

export async function getBalance(userId: string): Promise<number> {
  const wallet = await getWallet(userId);
  return wallet?.balance ?? 0;
}

export async function listTransactions(
  userId: string,
  limit = 50,
): Promise<CreditTransaction[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("credit_transactions")
    .select(
      "id, kind, delta, balance_after, pack_id, payment_provider, metadata, created_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Failed to list transactions: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    delta: row.delta,
    balanceAfter: row.balance_after,
    packId: row.pack_id,
    paymentProvider: row.payment_provider,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
  }));
}
