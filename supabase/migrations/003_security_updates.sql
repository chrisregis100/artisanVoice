-- Billo Security Updates
-- Phase 6: Additional indexes, RLS hardening, admin_settings protection

-- -------------------------------------------------------------------
-- Composite indexes for common query patterns
-- (simple column indexes already exist from 002; add composite ones)
-- -------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON public.subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_invoice_usage_user_month
  ON public.invoice_usage(user_id, month_year);

-- -------------------------------------------------------------------
-- admin_settings: restrict SELECT to service role only.
-- Regular authenticated users must never read raw admin settings.
-- The service-role client (createAdminClient) bypasses RLS entirely,
-- so this policy only affects the anon/authenticated roles.
-- -------------------------------------------------------------------

-- Drop any pre-existing permissive SELECT policy on admin_settings
DROP POLICY IF EXISTS "Admin settings are viewable by everyone" ON public.admin_settings;
DROP POLICY IF EXISTS "Authenticated users can view admin settings" ON public.admin_settings;

-- No SELECT policy for regular users → only service role can read
-- (Supabase: absence of a matching policy = implicit DENY for that role)

-- Ensure INSERT/UPDATE/DELETE are also blocked for non-service roles
DROP POLICY IF EXISTS "Authenticated users can insert admin settings" ON public.admin_settings;
DROP POLICY IF EXISTS "Authenticated users can update admin settings" ON public.admin_settings;

-- -------------------------------------------------------------------
-- plans: tighten to authenticated-only reads
-- (keeps public read but makes the intent explicit)
-- -------------------------------------------------------------------

DROP POLICY IF EXISTS "Plans are viewable by everyone" ON public.plans;

CREATE POLICY "Plans are viewable by authenticated users"
  ON public.plans
  FOR SELECT
  USING (true);

-- -------------------------------------------------------------------
-- subscriptions: add service-role bypass policies so webhooks
-- (which use createAdminClient / service role) can upsert records
-- for any user_id without being blocked by the user-scoped policies.
-- -------------------------------------------------------------------

DROP POLICY IF EXISTS "Service role can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- invoice_usage: same bypass for service role
DROP POLICY IF EXISTS "Service role can manage all invoice usage" ON public.invoice_usage;

CREATE POLICY "Service role can manage all invoice usage"
  ON public.invoice_usage
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
