import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { clientEnv } from "@/lib/env";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const limiter = rateLimit({ interval: 60_000, maxRequests: 120 });

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!limiter(ip).success) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          /* public read — no session cookies to persist */
        },
      },
    },
  );

  const { data, error } = await supabase
    .from("plans")
    .select("name, display_name, price_amount, currency, invoice_limit, is_active")
    .eq("is_active", true)
    .order("price_amount", { ascending: true });

  if (error) {
    console.error("public plans:", error);
    return NextResponse.json({ error: "Indisponible." }, { status: 500 });
  }

  return NextResponse.json({ plans: data ?? [] });
}
