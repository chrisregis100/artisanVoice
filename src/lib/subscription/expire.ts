import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * If the user has an active Pro subscription whose paid period has ended,
 * downgrade the row to the free plan so quotas and UI stay consistent.
 */
export async function downgradeExpiredProIfNeeded(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      current_period_end,
      plans ( name, tier, interval, currency )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !sub) return false;

  const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans;
  const periodEnd = sub.current_period_end;

  if (plan?.tier === "free") return false;
  if (plan?.interval === "lifetime") return false;
  if (!periodEnd) return false;

  if (new Date(periodEnd).getTime() >= Date.now()) return false;

  const currency = plan?.currency ?? "xof";
  const { data: freePlan, error: freeErr } = await supabase
    .from("plans")
    .select("id")
    .eq("name", `free_${currency.toLowerCase()}`)
    .eq("is_active", true)
    .single();

  if (freeErr || !freePlan) return false;

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan_id: freePlan.id,
      payment_provider: null,
      payment_reference: null,
      current_period_start: new Date().toISOString(),
      current_period_end: null,
    })
    .eq("id", sub.id);

  return !updateError;
}

/** Immediate downgrade from Pro to Free (user-initiated cancellation). */
export async function downgradeProToFree(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const { data: sub, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      plans ( name, tier, interval, currency )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !sub) {
    return { ok: false, error: "no_subscription" };
  }

  const plan = Array.isArray(sub.plans) ? sub.plans[0] : sub.plans;
  if (plan?.tier === "free" || plan?.interval === "lifetime") {
    return { ok: false, error: "not_pro" };
  }

  const currency = plan?.currency ?? "xof";
  const { data: freePlan, error: freeErr } = await supabase
    .from("plans")
    .select("id")
    .eq("name", `free_${currency.toLowerCase()}`)
    .eq("is_active", true)
    .single();

  if (freeErr || !freePlan) {
    return { ok: false, error: "free_plan_missing" };
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({
      plan_id: freePlan.id,
      payment_provider: null,
      payment_reference: null,
      current_period_start: new Date().toISOString(),
      current_period_end: null,
    })
    .eq("id", sub.id);

  if (updateError) {
    return { ok: false, error: "update_failed" };
  }

  return { ok: true };
}
