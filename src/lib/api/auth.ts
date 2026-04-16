import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { env } from "@/lib/env";

interface AuthSuccess {
  ok: true;
  user: User;
  supabase: SupabaseClient<Database>;
}

interface AuthFailure {
  ok: false;
  response: NextResponse;
}

export type AuthResult = AuthSuccess | AuthFailure;

export const requireAuth = async (
  _request: NextRequest
): Promise<AuthResult> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Non authentifié." },
        { status: 401 }
      ),
    };
  }

  return { ok: true, user, supabase };
};

export const requireAdmin = async (
  request: NextRequest
): Promise<AuthResult> => {
  const result = await requireAuth(request);

  if (!result.ok) return result;

  if (result.user.email !== env.ADMIN_EMAIL) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Accès refusé." },
        { status: 403 }
      ),
    };
  }

  return result;
};
