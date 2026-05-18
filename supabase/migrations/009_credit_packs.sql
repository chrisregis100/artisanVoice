-- Migration 009: Credit packs catalogue (pay-as-you-go)

CREATE TABLE IF NOT EXISTS public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  bonus_credits INTEGER NOT NULL DEFAULT 0,
  price_usd_cents INTEGER NOT NULL,
  price_xof INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the 3 initial packs
INSERT INTO public.credit_packs (slug, display_name, credits_amount, bonus_credits, price_usd_cents, price_xof, sort_order)
VALUES
  ('starter',   'Starter',   10,  0,  400,   2400,  1),
  ('populaire', 'Populaire', 30,  0,  900,   5400,  2),
  ('pro',       'Pro',       100, 10, 2400, 14400,  3)
ON CONFLICT (slug) DO NOTHING;

-- RLS: public read for active packs, writes via service_role only
ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packs"
  ON public.credit_packs
  FOR SELECT
  USING (is_active = true);
