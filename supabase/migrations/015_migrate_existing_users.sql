-- Migration 015: Migrate existing users from legacy subscriptions to credit system
-- Idempotent script: safe to re-run, won't duplicate credits

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ensure all existing users have a credit wallet
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO public.credit_wallets (user_id, balance, signup_bonus_granted)
SELECT u.id, 0, false
FROM public.users u
LEFT JOIN public.credit_wallets cw ON cw.user_id = u.id
WHERE cw.user_id IS NULL;


-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE (retroactive-bonus rollback): The former blocks 5-7 (signup bonus for
-- free/no-subscription users) have been removed. Existing free-plan users keep
-- balance = 0 and signup_bonus_granted = false — they are treated as free-plan
-- (has_purchased = false, per migration 016 default) and will hit the paywall.
-- New signups still receive their 3-credit trial via the trigger in migration 013.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- 2-4 + 8. Update wallets for paid subscriptions (Pro, Business, Early Bird)
-- ─────────────────────────────────────────────────────────────────────────────
WITH already_migrated AS (
  SELECT DISTINCT user_id
  FROM public.credit_transactions
  WHERE kind = 'migration'
),
active_subscriptions AS (
  SELECT
    s.id AS subscription_id,
    s.user_id,
    s.current_period_end,
    p.name AS plan_name,
    CASE
      WHEN p.name LIKE 'free%' THEN 'free'
      WHEN p.name LIKE 'pro_monthly%' THEN 'pro_monthly'
      WHEN p.name LIKE 'pro_annual%' THEN 'pro_annual'
      WHEN p.name LIKE 'business_monthly%' THEN 'business_monthly'
      WHEN p.name LIKE 'business_annual%' THEN 'business_annual'
      WHEN p.name LIKE 'early_bird%' THEN 'early_bird'
      ELSE 'unknown'
    END AS tier
  FROM public.subscriptions_legacy s
  JOIN public.plans_legacy p ON s.plan_id = p.id
  WHERE s.status = 'active'
    AND s.user_id NOT IN (SELECT user_id FROM already_migrated)
),
subscriptions_with_credits AS (
  SELECT
    subscription_id,
    user_id,
    plan_name,
    tier,
    current_period_end,
    GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int) AS months_remaining,
    CASE
      WHEN tier = 'free' THEN 3
      WHEN tier IN ('pro_monthly', 'pro_annual') THEN 30 * GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int)
      WHEN tier IN ('business_monthly', 'business_annual') THEN 100 * GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int)
      WHEN tier = 'early_bird' THEN 500
      ELSE 0
    END AS credits_to_grant
  FROM active_subscriptions
)
UPDATE public.credit_wallets cw
SET
  balance = cw.balance + sc.credits_to_grant,
  updated_at = now()
FROM subscriptions_with_credits sc
WHERE cw.user_id = sc.user_id
  AND sc.credits_to_grant > 0;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2-4 + 9. Insert migration transactions for all migrated subscriptions
-- ─────────────────────────────────────────────────────────────────────────────
WITH already_migrated AS (
  SELECT DISTINCT user_id
  FROM public.credit_transactions
  WHERE kind = 'migration'
),
active_subscriptions AS (
  SELECT
    s.id AS subscription_id,
    s.user_id,
    s.current_period_end,
    p.name AS plan_name,
    CASE
      WHEN p.name LIKE 'free%' THEN 'free'
      WHEN p.name LIKE 'pro_monthly%' THEN 'pro_monthly'
      WHEN p.name LIKE 'pro_annual%' THEN 'pro_annual'
      WHEN p.name LIKE 'business_monthly%' THEN 'business_monthly'
      WHEN p.name LIKE 'business_annual%' THEN 'business_annual'
      WHEN p.name LIKE 'early_bird%' THEN 'early_bird'
      ELSE 'unknown'
    END AS tier
  FROM public.subscriptions_legacy s
  JOIN public.plans_legacy p ON s.plan_id = p.id
  WHERE s.status = 'active'
    AND s.user_id NOT IN (SELECT user_id FROM already_migrated)
),
subscriptions_with_credits AS (
  SELECT
    subscription_id,
    user_id,
    plan_name,
    tier,
    current_period_end,
    GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int) AS months_remaining,
    CASE
      WHEN tier = 'free' THEN 3
      WHEN tier IN ('pro_monthly', 'pro_annual') THEN 30 * GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int)
      WHEN tier IN ('business_monthly', 'business_annual') THEN 100 * GREATEST(1, EXTRACT(MONTH FROM AGE(current_period_end, NOW()))::int)
      WHEN tier = 'early_bird' THEN 500
      ELSE 0
    END AS credits_to_grant
  FROM active_subscriptions
)
INSERT INTO public.credit_transactions (
  user_id,
  kind,
  delta,
  balance_after,
  metadata
)
SELECT
  sc.user_id,
  'migration',
  sc.credits_to_grant,
  cw.balance,
  jsonb_build_object(
    'legacy_subscription_id', sc.subscription_id,
    'legacy_plan', sc.plan_name,
    'tier', sc.tier,
    'months_remaining', sc.months_remaining,
    'current_period_end', sc.current_period_end,
    'note', CASE
      WHEN sc.tier = 'early_bird' THEN 'lifetime_to_credits'
      ELSE 'subscription_to_credits'
    END
  )
FROM subscriptions_with_credits sc
JOIN public.credit_wallets cw ON cw.user_id = sc.user_id
WHERE sc.credits_to_grant > 0;

COMMIT;

-- ─────────────────────────────────────────────────────────────────────────────
-- Migration summary (run separately to see results)
-- ─────────────────────────────────────────────────────────────────────────────
-- Uncomment the following to verify migration:
-- SELECT
--   'Wallets created' AS metric,
--   COUNT(*) AS count
-- FROM public.credit_wallets
-- UNION ALL
-- SELECT
--   'Signup bonuses granted' AS metric,
--   COUNT(*) AS count
-- FROM public.credit_transactions
-- WHERE kind = 'signup_bonus' AND metadata->>'note' = 'migration_signup_bonus_for_free_users'
-- UNION ALL
-- SELECT
--   'Paid subscriptions migrated' AS metric,
--   COUNT(*) AS count
-- FROM public.credit_transactions
-- WHERE kind = 'migration';
