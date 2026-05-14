-- Migration 014: Archive legacy subscription tables (read-only, data preserved)

-- Rename tables to _legacy
ALTER TABLE IF EXISTS public.plans                   RENAME TO plans_legacy;
ALTER TABLE IF EXISTS public.subscriptions           RENAME TO subscriptions_legacy;
ALTER TABLE IF EXISTS public.invoice_usage           RENAME TO invoice_usage_legacy;
ALTER TABLE IF EXISTS public.invoice_usage_documents RENAME TO invoice_usage_documents_legacy;

-- Make legacy tables read-only by revoking write permissions from the public role
REVOKE INSERT, UPDATE, DELETE ON public.plans_legacy                   FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.subscriptions_legacy           FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.invoice_usage_legacy           FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.invoice_usage_documents_legacy FROM PUBLIC;
