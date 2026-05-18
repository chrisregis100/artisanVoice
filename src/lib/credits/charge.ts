import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ChargeResult = "charged" | "duplicate" | "insufficient_balance";

export async function precheckCharge(
  userId: string,
  documentId: string,
): Promise<{ canCharge: boolean; duplicate: boolean; balance: number }> {
  const supabase = createClient();

  const { data: existingCharge } = await supabase
    .from("invoice_charges")
    .select("id")
    .eq("user_id", userId)
    .eq("document_id", documentId)
    .maybeSingle();

  const { data: wallet } = await supabase
    .from("credit_wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  const balance = wallet?.balance ?? 0;

  if (existingCharge) {
    return { canCharge: true, duplicate: true, balance };
  }

  return { canCharge: balance > 0, duplicate: false, balance };
}

export async function commitCharge(
  userId: string,
  documentId: string,
): Promise<ChargeResult> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("debit_credit", {
    p_user_id: userId,
    p_document_id: documentId,
  });

  if (error) throw new Error(`Failed to commit charge: ${error.message}`);

  return data as ChargeResult;
}
