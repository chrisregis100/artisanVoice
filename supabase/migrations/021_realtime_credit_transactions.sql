-- Migration 021: Enable Supabase Realtime for credit_transactions
-- and add an RLS policy for admin users to read all transactions.
--
-- IMPORTANT: The admin realtime policy requires the admin user's app_metadata
-- to have `is_admin: true`. After running this migration, set it via:
--
--   supabase.auth.admin.updateUserById(adminUserId, {
--     app_metadata: { is_admin: true }
--   })
--
-- Or via the Supabase Dashboard → Authentication → Users → select admin user
-- → "Edit" → add `{ "is_admin": true }` to App Metadata.

-- Add the table to the realtime publication so events are broadcast
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_transactions;

-- Allow admin users (app_metadata.is_admin = true) to read ALL transactions
-- This is required for the realtime subscription to receive all INSERT events
-- in the admin monitoring dashboard.
CREATE POLICY "Admin can read all credit_transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true
  );
