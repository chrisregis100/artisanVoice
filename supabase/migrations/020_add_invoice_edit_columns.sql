-- Migration: Add columns for invoice editing feature
-- Columns needed for expanded invoice editing capabilities

ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS customer_address TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS customer_phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS document_date TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.invoices.customer_address IS 'Customer address for display on invoice/quote';
COMMENT ON COLUMN public.invoices.customer_phone IS 'Customer phone number (may differ from customer record)';
COMMENT ON COLUMN public.invoices.document_date IS 'Custom document date override (YYYY-MM-DD format)';
