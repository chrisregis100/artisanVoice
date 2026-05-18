import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPaywallStatus } from "@/lib/credits/wallet";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ hasSubscription: false });
  }

  const status = await getPaywallStatus(user.id);
  return NextResponse.json({ hasSubscription: !status.shouldBlock });
}
