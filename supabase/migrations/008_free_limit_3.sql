-- Migration 008: Reduce free plan invoice limit from 5 to 3
-- Updates invoice_limit and features JSON for all free-tier plans

UPDATE public.plans
SET
  invoice_limit = 3,
  features = '["Édition vocale","Export PDF","3 factures/mois","Support email"]'::jsonb
WHERE name IN ('free_xof', 'free_eur', 'free_usd');
