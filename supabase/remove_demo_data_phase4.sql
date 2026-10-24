-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 4 DEMO DATA REMOVAL SCRIPT
-- =============================================================================
-- Removes ONLY Phase 4 demo rows (is_demo = true) without touching real workshop
-- job cards, invoices, or payments.
--
-- Note:
--   - Deleting from public.invoices (where is_demo = true) automatically
--     cascades to public.job_payments.
--   - Deleting from public.job_cards (where is_demo = true) automatically
--     cascades to public.job_items, public.job_status_history, and public.job_notes.
-- =============================================================================

-- 1. Delete demo invoices first (since invoices.job_id uses ON DELETE RESTRICT)
delete from public.invoices
where is_demo = true
   or job_id in (select id from public.job_cards where is_demo = true);

-- 2. Delete demo job cards (cascades to job_items, job_status_history, job_notes)
delete from public.job_cards
where is_demo = true;
