import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client (legacy alias — prefer `createAdminClient` from `./admin`).
 *
 * ⚠️  BYPASSES ALL Row Level Security policies.
 * Every query made with this client has unrestricted access to every table and row.
 *
 * Only use in server-only files for operations that genuinely require cross-user access
 * or system-level mutations. Never import this in "use client" files.
 *
 * NOTE: Unlike `createAdminClient`, this client does not disable token auto-refresh or
 * session persistence — prefer `createAdminClient` for new server-side code.
 */
export const createServiceClient = () =>
  createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  );
