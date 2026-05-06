-- Migration 007: Update Pricing Schema
-- Adds interval and tier columns, deactivates old plans, creates new pricing structure

-- ============================================================================
-- 1. ADD NEW COLUMNS
-- ============================================================================

-- Add interval column with check constraint for valid values
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS interval TEXT DEFAULT 'monthly';

-- Add check constraint for interval values (drop first if exists for idempotency)
ALTER TABLE public.plans 
  DROP CONSTRAINT IF EXISTS plans_interval_check;

ALTER TABLE public.plans 
  ADD CONSTRAINT plans_interval_check 
  CHECK (interval IN ('monthly', 'annual', 'lifetime'));

-- Add tier column for plan grouping
ALTER TABLE public.plans 
  ADD COLUMN IF NOT EXISTS tier TEXT;

-- ============================================================================
-- 2. ADD INDEX
-- ============================================================================

-- Index on tier for efficient filtering
CREATE INDEX IF NOT EXISTS idx_plans_tier ON public.plans(tier);

-- ============================================================================
-- 3. DEACTIVATE EXISTING PLANS
-- ============================================================================

-- Deactivate old 'free' and 'pro' plans instead of deleting
-- This preserves historical subscription references
UPDATE public.plans 
  SET is_active = false 
  WHERE name IN ('free', 'pro');

-- ============================================================================
-- 4. INSERT NEW PLAN STRUCTURE
-- ============================================================================

-- Helper comment: Price format
-- XOF: actual amount (no cents)
-- EUR/USD: amount in cents (e.g., 450 = 4.50€/$)

-- FREE TIER (XOF)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('free_xof', 'Gratuit', 0, 'XOF', 5, '["Édition vocale","Export PDF","5 factures/mois","Support email"]'::jsonb, true, 'monthly', 'free')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- FREE TIER (EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('free_eur', 'Gratuit', 0, 'EUR', 5, '["Édition vocale","Export PDF","5 factures/mois","Support email"]'::jsonb, true, 'monthly', 'free')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- FREE TIER (USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('free_usd', 'Gratuit', 0, 'USD', 5, '["Édition vocale","Export PDF","5 factures/mois","Support email"]'::jsonb, true, 'monthly', 'free')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- EARLY BIRD TIER (XOF) - Lifetime
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('early_bird_xof', 'Early Bird', 2500, 'XOF', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Accès à vie"]'::jsonb, true, 'lifetime', 'early_bird')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- EARLY BIRD TIER (EUR) - Lifetime (450 cents = 4.50 EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('early_bird_eur', 'Early Bird', 450, 'EUR', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Accès à vie"]'::jsonb, true, 'lifetime', 'early_bird')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- EARLY BIRD TIER (USD) - Lifetime (450 cents = 4.50 USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('early_bird_usd', 'Early Bird', 450, 'USD', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Accès à vie"]'::jsonb, true, 'lifetime', 'early_bird')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO MONTHLY (XOF)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_monthly_xof', 'Pro Mensuel', 5000, 'XOF', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Paiement mensuel"]'::jsonb, true, 'monthly', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO MONTHLY (EUR) (900 cents = 9.00 EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_monthly_eur', 'Pro Mensuel', 900, 'EUR', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Paiement mensuel"]'::jsonb, true, 'monthly', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO MONTHLY (USD) (900 cents = 9.00 USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_monthly_usd', 'Pro Mensuel', 900, 'USD', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Paiement mensuel"]'::jsonb, true, 'monthly', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO ANNUAL (XOF)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_annual_xof', 'Pro Annuel', 50000, 'XOF', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO ANNUAL (EUR) (9000 cents = 90.00 EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_annual_eur', 'Pro Annuel', 9000, 'EUR', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- PRO ANNUAL (USD) (9000 cents = 90.00 USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('pro_annual_usd', 'Pro Annuel', 9000, 'USD', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'pro')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS MONTHLY (XOF)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_monthly_xof', 'Business Mensuel', 10000, 'XOF', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","Paiement mensuel"]'::jsonb, true, 'monthly', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS MONTHLY (EUR) (1900 cents = 19.00 EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_monthly_eur', 'Business Mensuel', 1900, 'EUR', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","Paiement mensuel"]'::jsonb, true, 'monthly', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS MONTHLY (USD) (1900 cents = 19.00 USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_monthly_usd', 'Business Mensuel', 1900, 'USD', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","Paiement mensuel"]'::jsonb, true, 'monthly', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS ANNUAL (XOF)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_annual_xof', 'Business Annuel', 100000, 'XOF', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS ANNUAL (EUR) (19000 cents = 190.00 EUR)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_annual_eur', 'Business Annuel', 19000, 'EUR', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;

-- BUSINESS ANNUAL (USD) (19000 cents = 190.00 USD)
INSERT INTO public.plans (name, display_name, price_amount, currency, invoice_limit, features, is_active, interval, tier) VALUES
  ('business_annual_usd', 'Business Annuel', 19000, 'USD', NULL, '["Édition vocale","Export PDF","Factures illimitées","Partage WhatsApp","Support prioritaire","Multi-utilisateur","API access","2 mois offerts","Paiement annuel"]'::jsonb, true, 'annual', 'business')
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  price_amount = EXCLUDED.price_amount,
  invoice_limit = EXCLUDED.invoice_limit,
  features = EXCLUDED.features,
  is_active = EXCLUDED.is_active,
  interval = EXCLUDED.interval,
  tier = EXCLUDED.tier;
