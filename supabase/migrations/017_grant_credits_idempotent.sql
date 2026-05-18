-- Migration 017: grant_credits — idempotent early-exit on duplicate payment
--
-- Previously the function relied on the UNIQUE constraint on
-- (payment_provider, payment_reference) to throw a 23505 error on duplicates,
-- forcing the entire PL/pgSQL transaction (including the wallet UPDATE) to roll back.
-- While correct for preventing double-credits, it produced spurious errors in callers.
--
-- This version:
--   1. Acquires the wallet FOR UPDATE lock FIRST to serialise all concurrent callers.
--   2. Then performs the idempotency EXISTS check — safe from race conditions because
--      no second concurrent call can pass this point until the first one commits.
--   3. Returns the current balance cleanly on duplicates (no exception thrown).
--   The UNIQUE constraint on credit_transactions is kept as a hard safety net.

CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id           UUID,
  p_amount            INTEGER,
  p_kind              TEXT,
  p_pack_id           UUID    DEFAULT NULL,
  p_payment_provider  TEXT    DEFAULT NULL,
  p_payment_reference TEXT    DEFAULT NULL,
  p_metadata          JSONB   DEFAULT '{}'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- ── 1. Lock wallet row FIRST to serialise all concurrent callers ─────────────
  -- This ensures the idempotency check below is race-free: once this lock is
  -- acquired, no other concurrent call can proceed until this transaction commits.
  SELECT balance INTO v_new_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

  -- ── 2. Idempotence guard (safe: inside the wallet lock) ──────────────────────
  -- If a transaction for this (provider, reference) pair already exists, return
  -- the current wallet balance without modifying anything.
  -- NULL provider/reference (signup bonuses, admin adjustments) always proceed.
  IF p_payment_provider IS NOT NULL AND p_payment_reference IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.credit_transactions
      WHERE payment_provider = p_payment_provider
        AND payment_reference = p_payment_reference
    ) THEN
      RETURN v_new_balance;
    END IF;
  END IF;

  -- ── 3. Credit the wallet ─────────────────────────────────────────────────────
  v_new_balance := v_new_balance + p_amount;

  UPDATE public.credit_wallets
  SET balance    = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (
    user_id, kind, delta, balance_after,
    pack_id, payment_provider, payment_reference, metadata
  )
  VALUES (
    p_user_id, p_kind, p_amount, v_new_balance,
    p_pack_id, p_payment_provider, p_payment_reference, p_metadata
  );

  RETURN v_new_balance;
END;
$$;
