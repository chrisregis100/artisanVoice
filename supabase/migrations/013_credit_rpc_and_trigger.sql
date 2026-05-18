-- Migration 013: Credit RPC functions + signup bonus trigger

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: debit_credit
-- Atomically deducts 1 credit for generating a document.
-- Returns: 'duplicate' | 'insufficient_balance' | 'charged'
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.debit_credit(
  p_user_id     UUID,
  p_document_id TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance     INTEGER;
  v_new_balance INTEGER;
  v_tx_id       UUID;
BEGIN
  -- 1. Idempotence check — has this document already been charged?
  IF EXISTS (
    SELECT 1 FROM public.invoice_charges
    WHERE user_id = p_user_id AND document_id = p_document_id
  ) THEN
    RETURN 'duplicate';
  END IF;

  -- 2. Lock the wallet row to prevent concurrent debits (serialise access)
  SELECT balance INTO v_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 3. Wallet must exist and have a positive balance
  IF v_balance IS NULL OR v_balance <= 0 THEN
    RETURN 'insufficient_balance';
  END IF;

  -- 4. Decrement balance
  v_new_balance := v_balance - 1;

  UPDATE public.credit_wallets
  SET balance    = v_new_balance,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- 5. Append ledger entry
  INSERT INTO public.credit_transactions (user_id, kind, delta, balance_after)
  VALUES (p_user_id, 'debit', -1, v_new_balance)
  RETURNING id INTO v_tx_id;

  -- 6. Record charge for deduplication
  INSERT INTO public.invoice_charges (user_id, document_id, transaction_id)
  VALUES (p_user_id, p_document_id, v_tx_id);

  RETURN 'charged';
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: grant_credits
-- Adds credits to a wallet (purchase, refund, admin adjustment, etc.).
-- Returns the new balance.
-- ─────────────────────────────────────────────────────────────────────────────
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
  -- Lock wallet row to serialise concurrent grants
  SELECT balance INTO v_new_balance
  FROM public.credit_wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Wallet not found for user %', p_user_id;
  END IF;

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


-- ─────────────────────────────────────────────────────────────────────────────
-- Trigger: extend handle_new_user to also create a wallet + signup bonus
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create public user profile
  INSERT INTO public.users (id, business_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  -- Create credit wallet with signup bonus (3 credits)
  INSERT INTO public.credit_wallets (user_id, balance, signup_bonus_granted)
  VALUES (NEW.id, 3, true);

  -- Record the signup bonus transaction
  INSERT INTO public.credit_transactions (user_id, kind, delta, balance_after)
  VALUES (NEW.id, 'signup_bonus', 3, 3);

  RETURN NEW;
END;
$$;

-- The trigger itself already exists (created in migration 001); replacing the
-- function body above is sufficient — no need to recreate the trigger.
