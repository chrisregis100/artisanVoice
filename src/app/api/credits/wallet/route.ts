import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/auth";
import { getWallet } from "@/lib/credits/wallet";

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  const { user } = auth;

  const wallet = await getWallet(user.id);
  if (!wallet) {
    return NextResponse.json({ balance: 0, signupBonusGranted: false });
  }
  return NextResponse.json(wallet);
}
