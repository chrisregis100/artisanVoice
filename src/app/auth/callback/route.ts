import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { clientEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

const ALLOWED_REDIRECTS = new Set([
  "/dashboard",
  "/subscribe",
  "/invoices",
  "/settings",
  "/customers",
  "/welcome",
  "/reset-password",
  "/",
]);

function sanitizeNext(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/")) return null;
  if (next.startsWith("//")) return null;
  const path = next.split("?")[0] ?? next;
  if (ALLOWED_REDIRECTS.has(path)) return next;
  return null;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = sanitizeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/", origin));
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server context may forbid setting cookies; middleware can refresh session.
          }
        },
      },
    },
  );

  const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !exchangeData.session) {
    console.error(
      "auth callback exchangeCodeForSession:",
      error?.message ?? "no session returned",
    );
    return NextResponse.redirect(new URL("/login?error=recovery", origin));
  }

  if (requestedNext) {
    return NextResponse.redirect(new URL(requestedNext, origin));
  }

  const userId = exchangeData.session.user.id;
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const target = subscription ? "/dashboard" : "/subscribe";
  return NextResponse.redirect(new URL(target, origin));
}
