-- Migration 017: Revert migration credits
-- Removes all 'migration' transactions and deducts their deltas from wallet balances,
-- then recalculates balance_after on remaining transactions for ledger consistency.

BEGIN;

-- 1) Deduct migration deltas from each wallet (floor at 0)
WITH migration_totals AS (
  SELECT user_id, COALESCE(SUM(delta), 0) AS total
  FROM public.credit_transactions
  WHERE kind = 'migration'
  GROUP BY user_id
)
UPDATE public.credit_wallets cw
SET balance    = GREATEST(cw.balance - mt.total, 0),
    updated_at = NOW()
FROM migration_totals mt
WHERE cw.user_id = mt.user_id;

-- 2) Delete migration transactions
DELETE FROM public.credit_transactions
WHERE kind = 'migration';

-- 3) Recalculate balance_after on remaining transactions (idempotent)
WITH ordered AS (
  SELECT
    id,
    SUM(delta) OVER (
      PARTITION BY user_id
      ORDER BY created_at ASC, id ASC
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running
  FROM public.credit_transactions
)
UPDATE public.credit_transactions ct
SET balance_after = o.running
FROM ordered o
WHERE ct.id = o.id;

COMMIT;
