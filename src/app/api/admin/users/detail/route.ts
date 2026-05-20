import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/api/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const querySchema = z.object({
  userId: z.string().uuid("userId doit être un UUID valide."),
});

export async function GET(request: NextRequest) {
  const check = await requireAdmin(request);
  if (!check.ok) return check.response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ userId: searchParams.get("userId") });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "userId invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { userId } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json(data.user);
}
