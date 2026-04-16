import { createClient } from "@/lib/supabase/server";

export interface UserSubscription {
  id: string;
  planName: string;
  planDisplayName: string;
  invoiceLimit: number | null;
  status: string;
  currentPeriodEnd: string | null;
}

export interface InvoiceLimitCheck {
  allowed: boolean;
  remaining: number | null;
  plan: string;
}

export const getUserSubscription = async (
  userId: string,
): Promise<UserSubscription | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      current_period_end,
      plans (
        name,
        display_name,
        invoice_limit
      )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const plan = Array.isArray(data.plans) ? data.plans[0] : data.plans;
  if (!plan) return null;

  return {
    id: data.id,
    planName: plan.name,
    planDisplayName: plan.display_name,
    invoiceLimit: plan.invoice_limit,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
  };
};

const getCurrentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export const canCreateInvoice = async (
  userId: string,
): Promise<InvoiceLimitCheck> => {
  const subscription = await getUserSubscription(userId);

  if (!subscription) {
    return { allowed: false, remaining: 0, plan: "none" };
  }

  if (subscription.invoiceLimit === null) {
    return { allowed: true, remaining: null, plan: subscription.planName };
  }

  const supabase = createClient();
  const monthYear = getCurrentMonthYear();

  const { data: usage } = await supabase
    .from("invoice_usage")
    .select("invoice_count")
    .eq("user_id", userId)
    .eq("month_year", monthYear)
    .single();

  const currentCount = usage?.invoice_count ?? 0;
  const remaining = subscription.invoiceLimit - currentCount;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    plan: subscription.planName,
  };
};

export const incrementInvoiceCount = async (userId: string): Promise<void> => {
  const supabase = createClient();
  const monthYear = getCurrentMonthYear();

  const { data: existing } = await supabase
    .from("invoice_usage")
    .select("id, invoice_count")
    .eq("user_id", userId)
    .eq("month_year", monthYear)
    .single();

  if (existing) {
    await supabase
      .from("invoice_usage")
      .update({ invoice_count: existing.invoice_count + 1 })
      .eq("id", existing.id);
  } else {
    await supabase.from("invoice_usage").insert({
      user_id: userId,
      month_year: monthYear,
      invoice_count: 1,
    });
  }
};
