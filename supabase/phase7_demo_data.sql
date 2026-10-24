-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 7 DEMO DATA (PAYMENT ACCOUNTS, SETTINGS & PAYMENTS)
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql ... supabase/phase7_payments.sql
--   2. supabase/phase6_demo_data.sql (for demo orders ORD-000201 to ORD-000210)
--
-- All rows inserted here are tagged with is_demo = true and can be cleanly removed
-- by running supabase/remove_demo_data_phase7.sql.
-- =============================================================================

-- 1. Configure Payment Settings for Demo
insert into public.payment_settings (
  id,
  manual_enabled,
  mock_gateway_enabled,
  gateway_provider,
  require_proof
)
values (1, true, true, null, true)
on conflict (id) do update
set
  manual_enabled = true,
  mock_gateway_enabled = true,
  require_proof = true;

-- Update delivery_settings.online_payment_enabled
update public.delivery_settings
   set online_payment_enabled = true
 where id = 1;

-- 2. Seed 3 Clearly Marked Demo Payment Accounts
insert into public.payment_accounts (
  id,
  method,
  title,
  account_title,
  account_number,
  iban,
  bank_name,
  instructions,
  is_active,
  sort_order,
  is_demo
)
values
  (
    '88000000-0000-4000-8000-000000000001',
    'bank_transfer',
    '{"en": "Demo Bank (Online Transfer)", "ur": "ڈیمو بینک (آن لائن ٹرانسفر)", "ur-roman": "Demo Bank (Online Transfer)"}'::jsonb,
    'DEMO ACCOUNT - not real',
    '0000-0000000000',
    'PK00DEMO0000000000000000',
    'Demo Bank Pakistan',
    '{"en": "Transfer the exact order total to our Demo Bank account. Enter your Order Number as payment reference and upload screenshot proof below.", "ur": "آرڈر کی کل رقم ڈیمو بینک اکاؤنٹ میں منتقل کریں۔ آرڈر نمبر ریفرنس کے طور پر درج کریں اور نیچے اسکرین شاٹ اپ لوڈ کریں۔", "ur-roman": "Order total Demo Bank account mein transfer karein. Order No reference mein darj karein aur screenshot upload karein."}'::jsonb,
    true,
    1,
    true
  ),
  (
    '88000000-0000-4000-8000-000000000002',
    'jazzcash',
    '{"en": "Demo Wallet 1 (JazzCash)", "ur": "ڈیمو موبائل والٹ 1 (جاز کیش)", "ur-roman": "Demo Wallet 1 (JazzCash)"}'::jsonb,
    'DEMO ACCOUNT - not real',
    '03000000001',
    null,
    'Demo Mobile Wallet',
    '{"en": "Send money via JazzCash App or Till ID to 03000000001. Note down the 11-digit TID from 8558 SMS and submit with screenshot.", "ur": "جاز کیش ایپ سے 03000000001 پر رقم بھیجیں۔ 8558 ایس ایم ایس سے ٹرانزیکشن آئی ڈی درج کریں اور اسکرین شاٹ اپ لوڈ کریں۔", "ur-roman": "JazzCash app se 03000000001 par raqam transfer karein aur 8558 SMS se TID darj karein."}'::jsonb,
    true,
    2,
    true
  ),
  (
    '88000000-0000-4000-8000-000000000003',
    'easypaisa',
    '{"en": "Demo Wallet 2 (Easypaisa)", "ur": "ڈیمو موبائل والٹ 2 (ایزی پیسہ)", "ur-roman": "Demo Wallet 2 (Easypaisa)"}'::jsonb,
    'DEMO ACCOUNT - not real',
    '03000000002',
    null,
    'Demo Mobile Wallet',
    '{"en": "Transfer payment via Easypaisa App or *786# to 03000000002. Submit the 11-digit TRX ID from 3737 SMS confirmation.", "ur": "ایزی پیسہ ایپ سے 03000000002 پر ادائیگی کریں اور 3737 ایس ایم ایس سے ٹرانزیکشن نمبر درج کریں۔", "ur-roman": "Easypaisa se 03000000002 par payment karein aur 3737 SMS se TRX ID submit karein."}'::jsonb,
    true,
    3,
    true
  )
on conflict (id) do update
set
  title = excluded.title,
  account_title = excluded.account_title,
  account_number = excluded.account_number,
  iban = excluded.iban,
  bank_name = excluded.bank_name,
  instructions = excluded.instructions,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

-- 3. Seed Realistic Demo Payments Attached to Existing Demo Orders
do $$
declare
  v_o204 public.orders%rowtype;
  v_o205 public.orders%rowtype;
  v_o206 public.orders%rowtype;
  v_o207 public.orders%rowtype;
  v_o208 public.orders%rowtype;
  v_o209 public.orders%rowtype;
begin
  select * into v_o204 from public.orders where order_no = 'ORD-000204';
  select * into v_o205 from public.orders where order_no = 'ORD-000205';
  select * into v_o206 from public.orders where order_no = 'ORD-000206';
  select * into v_o207 from public.orders where order_no = 'ORD-000207';
  select * into v_o208 from public.orders where order_no = 'ORD-000208';
  select * into v_o209 from public.orders where order_no = 'ORD-000209';

  -- Clean old demo payments for these orders if re-running
  delete from public.payments where is_demo = true;

  -- 1. ORD-000208: Manual Bank Transfer — VERIFIED & PAID (Delivered order)
  if v_o208.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, proof_path, submitted_at, verified_at, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000208',
      v_o208.id,
      'manual',
      'bank_transfer',
      v_o208.total,
      'PKR',
      'verified',
      'DEMOBANK-FT-88990011',
      'DEMOBANK-FT-88990011',
      'pending/demo_proof_bank_transfer.png',
      now() - interval '8 days',
      now() - interval '7 days 20 hours',
      true
    );

    update public.orders
       set payment_status = 'paid', payment_method = 'manual'
     where id = v_o208.id;
  end if;

  -- 2. ORD-000209: Mock Gateway / Online Card — SUCCEEDED & PAID (Shipped order)
  if v_o209.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, submitted_at, verified_at, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000209',
      v_o209.id,
      'mock',
      'mock_card',
      v_o209.total,
      'PKR',
      'succeeded',
      'MOCK-TX-A7B8C9D0E1',
      'MOCK-REF-99881122',
      now() - interval '1 day 12 hours',
      now() - interval '1 day 12 hours',
      true
    );

    update public.orders
       set payment_status = 'paid', payment_method = 'online'
     where id = v_o209.id;
  end if;

  -- 3. ORD-000204: Bank Transfer — SUBMITTED (Awaiting Verification)
  if v_o204.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, proof_path, submitted_at, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000204',
      v_o204.id,
      'manual',
      'bank_transfer',
      v_o204.total,
      'PKR',
      'submitted',
      'HBL-FT-77665544',
      'HBL-FT-77665544',
      'pending/demo_proof_hbl_slip.png',
      now() - interval '3 hours',
      true
    );

    update public.orders
       set payment_status = 'pending', payment_method = 'online'
     where id = v_o204.id;
  end if;

  -- 4. ORD-000205: JazzCash — SUBMITTED (Awaiting Verification)
  if v_o205.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, proof_path, submitted_at, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000205',
      v_o205.id,
      'manual',
      'jazzcash',
      v_o205.total,
      'PKR',
      'submitted',
      'JC-TID-99221144',
      'JC-TID-99221144',
      'pending/demo_proof_jazzcash_receipt.png',
      now() - interval '45 minutes',
      true
    );

    update public.orders
       set payment_status = 'pending', payment_method = 'online'
     where id = v_o205.id;
  end if;

  -- 5. ORD-000206: Easypaisa — REJECTED (Reason: Transaction ID not found in bank statement)
  if v_o206.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, proof_path, submitted_at, reject_reason, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000206',
      v_o206.id,
      'manual',
      'easypaisa',
      v_o206.total,
      'PKR',
      'rejected',
      'EP-TX-00001122',
      'EP-TX-00001122',
      'pending/demo_proof_easypaisa_blurry.png',
      now() - interval '2 days',
      'Transaction ID not found in Easypaisa workshop account statement. Please verify and resubmit your valid proof receipt.',
      true
    );

    update public.orders
       set payment_status = 'failed', payment_method = 'online'
     where id = v_o206.id;
  end if;

  -- 6. ORD-000207: Returned & REFUNDED Order
  if v_o207.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      transaction_id, provider_reference, proof_path, submitted_at, verified_at, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000207',
      v_o207.id,
      'manual',
      'bank_transfer',
      v_o207.total,
      'PKR',
      'refunded',
      'REFUND-TRX-332211',
      'REFUND-TRX-332211',
      'pending/demo_proof_refund_voucher.png',
      now() - interval '7 days',
      now() - interval '3 days',
      true
    );

    update public.orders
       set payment_status = 'refunded', payment_method = 'manual'
     where id = v_o207.id;
  end if;

  -- 7. Seed one failed mock simulation payment for demonstration
  if v_o205.id is not null then
    insert into public.payments (
      id, order_id, provider, method, amount, currency, status,
      provider_reference, reject_reason, is_demo
    )
    values (
      '88100000-0000-4000-8000-000000000099',
      v_o205.id,
      'mock',
      'mock_card',
      v_o205.total,
      'PKR',
      'failed',
      'MOCK-FAILED-TOKEN-HASH-SAMPLE',
      'Simulated card declined: insufficient funds or simulated fail test',
      true
    );
  end if;

end;
$$;
