-- Track which draft document IDs already consumed monthly quota (dedupe re-downloads / re-shares)

CREATE TABLE IF NOT EXISTS public.invoice_usage_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  document_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, month_year, document_id)
);

CREATE INDEX IF NOT EXISTS idx_invoice_usage_documents_user_month
  ON public.invoice_usage_documents (user_id, month_year);

ALTER TABLE public.invoice_usage_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invoice usage documents"
  ON public.invoice_usage_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own invoice usage documents"
  ON public.invoice_usage_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoice usage documents"
  ON public.invoice_usage_documents
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all invoice usage documents"
  ON public.invoice_usage_documents
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
