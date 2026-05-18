-- Migration 012: Invoice charges — deduplication table

CREATE TABLE IF NOT EXISTS public.invoice_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  transaction_id UUID NOT NULL REFERENCES public.credit_transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Guarantee each document is charged at most once per user
  CONSTRAINT unique_user_document UNIQUE (user_id, document_id)
);

-- RLS: users can read their own charges; writes via service_role / RPC only
ALTER TABLE public.invoice_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own charges"
  ON public.invoice_charges
  FOR SELECT
  USING (auth.uid() = user_id);
