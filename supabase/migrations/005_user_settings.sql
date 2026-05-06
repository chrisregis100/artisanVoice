-- User Settings Migration
-- Adds persistent settings columns to the public.users table

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS business_address TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS quote_prefix TEXT NOT NULL DEFAULT 'DV-',
  ADD COLUMN IF NOT EXISTS invoice_prefix TEXT NOT NULL DEFAULT 'FAC-',
  ADD COLUMN IF NOT EXISTS vat_rate_percent NUMERIC(5, 2) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS legal_mentions TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF';
