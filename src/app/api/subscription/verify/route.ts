import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { verifyFedaPayPayment } from "@/lib/payment/fedapay";
import { env } from "@/lib/env";

const VALID_PROVIDERS = ["fedapay", "lemonsqueezy"] as const;

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user, supabase } = auth;

  const provider = request.nextUrl.searchParams.get("provider");
  const transactionId = request.nextUrl.searchParams.get("transaction_id");

  if (!provider || !(VALID_PROVIDERS as readonly string[]).includes(provider)) {
    return NextResponse.json({ error: "Provider invalide" }, { status: 400 });
  }

  // Check DB first — the webhook may have already processed the payment
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select(
      `
      id,
      status,
      plan_id,
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
    .maybeSingle();

  if (subscription) {
    return NextResponse.json({ status: "success", subscription });
  }

  // No active subscription in DB yet — optionally verify with the provider API
  if (provider === "fedapay" && transactionId) {
    try {
      const verification = await verifyFedaPayPayment(transactionId, {
        minimumAmount: 0,
      });
      if (verification.success) {
        // Transaction approved but webhook not yet processed — return pending
        return NextResponse.json({ status: "pending" });
      }
      return NextResponse.json({ status: "failure" });
    } catch {
      return NextResponse.json({ status: "pending" });
    }
  }

  if (provider === "lemonsqueezy" && transactionId) {
    try {
      const apiKey = env.LEMONSQUEEZY_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ status: "pending" });
      }
      const response = await fetch(
        `https://api.lemonsqueezy.com/v1/orders/${transactionId}`,
        {
          headers: {
            Accept: "application/vnd.api+json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );
      if (response.ok) {
        const data = (await response.json()) as {
          data?: { attributes?: { status?: string } };
        };
        const orderStatus = data?.data?.attributes?.status;
        if (orderStatus === "paid" || orderStatus === "refunded") {
          // Order confirmed but webhook not yet processed — return pending
          return NextResponse.json({ status: "pending" });
        }
        return NextResponse.json({ status: "failure" });
      }
      return NextResponse.json({ status: "pending" });
    } catch {
      return NextResponse.json({ status: "pending" });
    }
  }

  // No transactionId provided — DB already checked above with no result
  return NextResponse.json({ status: "pending" });
}
