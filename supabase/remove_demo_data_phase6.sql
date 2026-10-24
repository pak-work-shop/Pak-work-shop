-- =============================================================================
-- PAK AUTO WORKS & PARTS — REMOVE PHASE 6 DEMO DATA ONLY
-- =============================================================================
-- Safe to run multiple times in the Supabase SQL Editor.
-- Deletes demo orders (and child items & status history via CASCADE), demo coupons,
-- and demo carts where is_demo = true. Never touches real non-demo customer orders!
-- =============================================================================

do $$
begin
  -- 1. Delete all demo orders (cascades to order_items & order_status_history)
  delete from public.orders
  where is_demo = true
     or order_no in (
       'ORD-000101', 'ORD-000102', 'ORD-000103', 'ORD-000104', 'ORD-000105',
       'ORD-000201', 'ORD-000202', 'ORD-000203', 'ORD-000204', 'ORD-000205',
       'ORD-000206', 'ORD-000207', 'ORD-000208', 'ORD-000209', 'ORD-000210'
     );

  -- 2. Delete demo coupons
  delete from public.coupons
  where is_demo = true
     or code in ('DEMO10', 'WELCOME500', 'EXPIRED20', 'WELCOME10', 'SADIQABAD500');

  -- 3. Reset rate limit logging for demo phones / test IP hashes if any
  delete from public.order_lookup_attempts
  where phone in ('03000000001', '03000000002', '03000000003', '03000000004', '03000000005', '03000000006', '03000000007', '03000000008', '03000000009', '03000000010');

  raise notice 'Phase 6 demo data removed successfully.';
end;
$$;
