import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/supabase/types";

export async function grantCredits(params: {
  userId: string;
  amount: number;
  kind: "purchase" | "signup_bonus" | "refund" | "admin_adjust" | "migration";
  packId?: string;
  paymentProvider?: string;
  paymentReference?: string;
  metadata?: Record<string, unknown>;
}): Promise<number> {
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc("grant_credits", {
    p_user_id: params.userId,
    p_amount: params.amount,
    p_kind: params.kind,
    p_pack_id: params.packId ?? null,
    p_payment_provider: params.paymentProvider ?? null,
    p_payment_reference: params.paymentReference ?? null,
    p_metadata: (params.metadata ?? {}) as Json,
  });

  if (error) throw new Error(`Failed to grant credits: ${error.message}`);

  return data as number;
}
