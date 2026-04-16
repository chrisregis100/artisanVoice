import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client.
 *
 * ⚠️  BYPASSES ALL Row Level Security policies.
 * Every query made with this client has unrestricted access to every table and row.
 *
 * Only use when ALL of the following are true:
 *  1. The file is server-only (API route handler or server component — never "use client").
 *  2. The operation genuinely requires cross-user access or system-level mutations
 *     (e.g. aggregate queries across all users, writing to admin-only tables, webhook handlers).
 *  3. Caller identity has already been verified (e.g. requireAdmin() / webhook HMAC check).
 *
 * If you only need the current authenticated user's own data, use the cookie-based
 * server client from `@/lib/supabase/server` instead — it respects RLS automatically.
 */
export const createAdminClient = () =>
  createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
