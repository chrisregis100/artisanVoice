import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const getCurrentMonthYear = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export async function GET() {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: "Non authentifié" },
      { status: 401 },
    );
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      payment_provider,
      current_period_start,
      current_period_end,
      plans (
        name,
        display_name,
        price_amount,
        currency,
        invoice_limit,
        features
      )
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!subscription) {
    return NextResponse.json({
      hasSubscription: false,
      plan: null,
      usage: { count: 0, limit: null },
    });
  }

  const plan = Array.isArray(subscription.plans)
    ? subscription.plans[0]
    : subscription.plans;

  const monthYear = getCurrentMonthYear();
  const { data: usage } = await supabase
    .from("invoice_usage")
    .select("invoice_count")
    .eq("user_id", user.id)
    .eq("month_year", monthYear)
    .single();

  const invoiceCount = usage?.invoice_count ?? 0;

  return NextResponse.json({
    hasSubscription: true,
    plan: plan
      ? {
          name: plan.name,
          displayName: plan.display_name,
          priceAmount: plan.price_amount,
          currency: plan.currency,
          invoiceLimit: plan.invoice_limit,
          features: plan.features,
        }
      : null,
    subscription: {
      id: subscription.id,
      status: subscription.status,
      paymentProvider: subscription.payment_provider,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
    },
    usage: {
      count: invoiceCount,
      limit: plan?.invoice_limit ?? null,
    },
  });
}
