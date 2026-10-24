-- =============================================================================
-- PAK AUTO WORKS & PARTS — REMOVE PHASE 7 DEMO DATA ONLY
-- =============================================================================
-- Safe to run multiple times in the Supabase SQL Editor.
-- Deletes demo payment accounts and demo payments where is_demo = true.
-- Restores affected demo orders to their baseline payment_status.
-- Never touches real non-demo customer orders or payments!
-- =============================================================================

do $$
begin
  -- 1. Delete demo payments and associated logs
  delete from public.payment_logs
   where payment_id in (select id from public.payments where is_demo = true);

  delete from public.payments
   where is_demo = true
      or id in (
        '88100000-0000-4000-8000-000000000208',
        '88100000-0000-4000-8000-000000000209',
        '88100000-0000-4000-8000-000000000204',
        '88100000-0000-4000-8000-000000000205',
        '88100000-0000-4000-8000-000000000206',
        '88100000-0000-4000-8000-000000000207',
        '88100000-0000-4000-8000-000000000099'
      );

  -- 2. Delete demo payment accounts
  delete from public.payment_accounts
   where is_demo = true
      or id in (
        '88000000-0000-4000-8000-000000000001',
        '88000000-0000-4000-8000-000000000002',
        '88000000-0000-4000-8000-000000000003'
      );

  -- 3. Reset demo orders payment statuses to their baseline
  update public.orders
     set payment_status = 'cod_pending',
         payment_method = 'cod'
   where order_no in ('ORD-000204', 'ORD-000205')
     and is_demo = true;

  update public.orders
     set payment_status = 'paid'
   where order_no in ('ORD-000208', 'ORD-000209')
     and is_demo = true;

  update public.orders
     set payment_status = 'failed'
   where order_no = 'ORD-000206'
     and is_demo = true;

  -- 4. Reset payment settings to default
  update public.payment_settings
     set manual_enabled = true,
         mock_gateway_enabled = false,
         gateway_provider = null,
         require_proof = true
   where id = 1;

  raise notice 'Phase 7 demo data removed successfully.';
end;
$$;
