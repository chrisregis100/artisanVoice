-- Migration 011: Credit transactions — append-only ledger

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('purchase', 'signup_bonus', 'debit', 'refund', 'admin_adjust', 'migration')),
  delta INTEGER NOT NULL, -- positive = credit, negative = debit
  balance_after INTEGER NOT NULL,
  pack_id UUID REFERENCES public.credit_packs(id),
  payment_provider TEXT, -- 'fedapay' | 'lemonsqueezy'
  payment_reference TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Idempotence: one credit per payment.
  -- NULL values are treated as distinct by PostgreSQL UNIQUE, so debits/bonuses
  -- (which have no provider) never conflict with each other.
  CONSTRAINT unique_payment UNIQUE (payment_provider, payment_reference)
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user
  ON public.credit_transactions(user_id, created_at DESC);

-- RLS: users can read their own transactions; writes via service_role only
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own transactions"
  ON public.credit_transactions
  FOR SELECT
  USING (auth.uid() = user_id);
