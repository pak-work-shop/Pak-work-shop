-- =============================================================================
-- PAK AUTO WORKS & PARTS — PRINT LOGO FOR INVOICES & RECEIPTS
-- =============================================================================
-- Idempotent and safe to run multiple times.
-- Adds optional print_logo_url to site_settings for light-background printing.
-- =============================================================================

alter table public.site_settings
  add column if not exists print_logo_url text null;

comment on column public.site_settings.print_logo_url is 'Optional logo optimized for white paper printing (dark text/transparent).';
