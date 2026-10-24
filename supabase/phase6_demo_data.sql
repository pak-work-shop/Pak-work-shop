-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 6 DEMO DATA (10 ORDERS, 3 COUPONS, DELIVERY)
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql ... supabase/phase6_orders.sql
--   2. supabase/phase5_demo_data.sql (recommended for demo products)
--
-- All rows inserted here are tagged with is_demo = true and can be cleanly removed
-- by running supabase/remove_demo_data_phase6.sql or supabase/remove_demo_data.sql.
-- =============================================================================

-- 1. Ensure Delivery Settings Defaults exist (id = 1)
insert into public.delivery_settings (
  id,
  flat_rate,
  free_cities,
  free_over_amount,
  min_order_amount,
  cod_enabled,
  cod_max_amount,
  cod_blocked_cities,
  online_payment_enabled
)
values (
  1,
  300.00,
  array['Sadiqabad'],
  null,
  0.00,
  true,
  50000.00,
  array[]::text[],
  false
)
on conflict (id) do update
set
  flat_rate = excluded.flat_rate,
  free_cities = excluded.free_cities,
  free_over_amount = null;

-- 2. Seed 3 Demo Coupons (DEMO10, WELCOME500, EXPIRED20)
insert into public.coupons (
  code,
  discount_type,
  value,
  min_order,
  max_discount,
  starts_at,
  expires_at,
  usage_limit,
  used_count,
  is_active,
  is_demo
)
values
  (
    'DEMO10',
    'percent',
    10.00,
    2000.00,
    2000.00,
    now() - interval '30 days',
    now() + interval '180 days',
    500,
    6,
    true,
    true
  ),
  (
    'WELCOME500',
    'fixed',
    500.00,
    5000.00,
    500.00,
    now() - interval '30 days',
    now() + interval '180 days',
    200,
    3,
    true,
    true
  ),
  (
    'EXPIRED20',
    'percent',
    20.00,
    1000.00,
    2000.00,
    now() - interval '90 days',
    now() - interval '5 days',
    100,
    12,
    true,
    true
  )
on conflict (code) do update
set
  discount_type = excluded.discount_type,
  value = excluded.value,
  min_order = excluded.min_order,
  max_discount = excluded.max_discount,
  starts_at = excluded.starts_at,
  expires_at = excluded.expires_at,
  usage_limit = excluded.usage_limit,
  is_active = excluded.is_active,
  is_demo = excluded.is_demo;

-- 3. Seed 10 Realistic Demo Orders (ORD-000201 to ORD-000210)
do $$
declare
  v_ord1_id  uuid := '77000000-0000-4000-8000-000000000201';
  v_ord2_id  uuid := '77000000-0000-4000-8000-000000000202';
  v_ord3_id  uuid := '77000000-0000-4000-8000-000000000203';
  v_ord4_id  uuid := '77000000-0000-4000-8000-000000000204';
  v_ord5_id  uuid := '77000000-0000-4000-8000-000000000205';
  v_ord6_id  uuid := '77000000-0000-4000-8000-000000000206';
  v_ord7_id  uuid := '77000000-0000-4000-8000-000000000207';
  v_ord8_id  uuid := '77000000-0000-4000-8000-000000000208';
  v_ord9_id  uuid := '77000000-0000-4000-8000-000000000209';
  v_ord10_id uuid := '77000000-0000-4000-8000-000000000210';
  v_p1 public.products%rowtype;
  v_p2 public.products%rowtype;
  v_p3 public.products%rowtype;
begin
  -- Clean up previously seeded demo orders with these deterministic IDs or order_nos
  delete from public.orders
  where id in (
    v_ord1_id, v_ord2_id, v_ord3_id, v_ord4_id, v_ord5_id,
    v_ord6_id, v_ord7_id, v_ord8_id, v_ord9_id, v_ord10_id
  )
  or order_no in (
    'ORD-000101', 'ORD-000102', 'ORD-000103', 'ORD-000104', 'ORD-000105',
    'ORD-000201', 'ORD-000202', 'ORD-000203', 'ORD-000204', 'ORD-000205',
    'ORD-000206', 'ORD-000207', 'ORD-000208', 'ORD-000209', 'ORD-000210'
  );

  select * into v_p1 from public.products where is_active = true order by sku asc limit 1 offset 0;
  select * into v_p2 from public.products where is_active = true order by sku asc limit 1 offset 1;
  select * into v_p3 from public.products where is_active = true order by sku asc limit 1 offset 2;

  -- 1. ORD-000201: Sadiqabad, Delivered & COD Collected (Free local delivery Rs. 0)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at, delivered_at
  ) values (
    v_ord1_id, 'ORD-000201', 'Tariq Mehmood (Demo)', '03000000001', 'tariq.demo@example.com',
    'Sadiqabad', 'House 14, Block B, Model Town, Sadiqabad', 'Near Jamia Masjid',
    9200.00, 0.00, 0.00, 9200.00, null,
    'cod', 'cod_collected', 'delivered',
    'Workshop Rider', 'SDQ-RIDER-01', null,
    'Please call before arrival.', 'Delivered and cash collected.',
    'en', true, now() - interval '6 days', now() - interval '5 days'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord1_id, v_p1.id, coalesce(v_p1.sku, 'PAW-OIL-001'),
    'Toyota Genuine Motor Oil 5W-30 (4L)',
    '{"en": "Toyota Genuine Motor Oil 5W-30 (4L)", "ur": "ٹویوٹا جینوئن انجن آئل 5W-30", "ur-roman": "Toyota Genuine Engine Oil 5W-30"}'::jsonb,
    7800.00, 1, 7800.00
  ), (
    v_ord1_id, v_p2.id, coalesce(v_p2.sku, 'PAW-FLT-001'),
    'Genuine Oil Filter 90915-YZZE1',
    '{"en": "Genuine Oil Filter 90915-YZZE1", "ur": "اصلی آئل فلٹر", "ur-roman": "Genuine Oil Filter"}'::jsonb,
    1400.00, 1, 1400.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord1_id, null, 'placed', 'Order placed via COD', now() - interval '6 days'),
    (v_ord1_id, 'placed', 'confirmed', 'Address verified', now() - interval '5 days 20 hours'),
    (v_ord1_id, 'confirmed', 'packed', 'Packed at workshop', now() - interval '5 days 16 hours'),
    (v_ord1_id, 'packed', 'shipped', 'Dispatched with local rider', now() - interval '5 days 10 hours'),
    (v_ord1_id, 'shipped', 'delivered', 'Cash collected: Rs. 9,200', now() - interval '5 days');

  -- 2. ORD-000202: Lahore, Shipped via TCS Express (Rs. 300 flat delivery)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord2_id, 'ORD-000202', 'Usman Farooq (Demo)', '03000000002', 'usman.demo@example.com',
    'Lahore', 'Plot 82, Block G, Johar Town, Lahore', 'Near Expo Centre',
    12500.00, 0.00, 300.00, 12800.00, null,
    'cod', 'cod_pending', 'shipped',
    'TCS', 'TCS-9988776655', 'https://www.tcsexpress.com/track/TCS-9988776655',
    'Fragile ceramic pads.', 'Dispatched via TCS Overnight.',
    'en', true, now() - interval '2 days'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord2_id, v_p3.id, coalesce(v_p3.sku, 'PAW-BRK-001'),
    'Akebono Front Ceramic Brake Pads Set',
    '{"en": "Akebono Front Ceramic Brake Pads Set", "ur": "فرنٹ بریک پیڈز سیٹ", "ur-roman": "Front Brake Pads Set"}'::jsonb,
    12500.00, 1, 12500.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord2_id, null, 'placed', 'Order placed via COD', now() - interval '2 days'),
    (v_ord2_id, 'placed', 'confirmed', 'Confirmed by phone', now() - interval '1 day 20 hours'),
    (v_ord2_id, 'confirmed', 'packed', 'Securely packed', now() - interval '1 day 14 hours'),
    (v_ord2_id, 'packed', 'shipped', 'Booked on TCS CN #TCS-9988776655', now() - interval '1 day');

  -- 3. ORD-000203: Rahim Yar Khan, Packed with Leopards Courier (WELCOME500 coupon applied)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord3_id, 'ORD-000203', 'Bilal Ahmed (Demo)', '03000000003', null,
    'Rahim Yar Khan', 'Street 4, Abbasia Town, Rahim Yar Khan', 'Near Canal Bridge',
    6400.00, 500.00, 300.00, 6200.00, 'WELCOME500',
    'cod', 'cod_pending', 'packed',
    'Leopards Courier', 'LEO-44556677', 'https://leopardscourier.com/tracking?track_number=LEO-44556677',
    null, 'Ready for Leopards evening pickup.',
    'en', true, now() - interval '20 hours'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord3_id, v_p2.id, 'PAW-SPK-001',
    'Denso Iridium TT Spark Plugs (Set of 4)',
    '{"en": "Denso Iridium TT Spark Plugs (Set of 4)", "ur": "ڈینسو اسپارک پلگز", "ur-roman": "Denso Spark Plugs"}'::jsonb,
    6400.00, 1, 6400.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord3_id, null, 'placed', 'Order placed with WELCOME500 coupon', now() - interval '20 hours'),
    (v_ord3_id, 'placed', 'confirmed', 'Confirmed via WhatsApp', now() - interval '14 hours'),
    (v_ord3_id, 'confirmed', 'packed', 'Boxed and labeled', now() - interval '6 hours');

  -- 4. ORD-000204: Islamabad, Confirmed (DEMO10 coupon applied)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord4_id, 'ORD-000204', 'Kamran Shah (Demo)', '03000000004', 'kamran.demo@example.com',
    'Islamabad', 'House 29, Street 18, F-11/2, Islamabad', null,
    8500.00, 850.00, 300.00, 7950.00, 'DEMO10',
    'cod', 'cod_pending', 'confirmed',
    'For Toyota Yaris 1.3 GLi.', 'Stock verified in bay 2.',
    'en', true, now() - interval '10 hours'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord4_id, v_p1.id, 'PAW-OIL-002',
    'Havoline ProDS Full Synthetic 0W-20 (4L) + Air Filter Combo',
    '{"en": "Havoline ProDS Full Synthetic 0W-20 Combo", "ur": "ہیولین سنتھیٹک آئل کومبو", "ur-roman": "Havoline Synthetic Oil Combo"}'::jsonb,
    8500.00, 1, 8500.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord4_id, null, 'placed', 'Order placed via COD', now() - interval '10 hours'),
    (v_ord4_id, 'placed', 'confirmed', 'Confirmed by phone agent', now() - interval '5 hours');

  -- 5. ORD-000205: Sadiqabad, Placed (Newly placed by customer)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord5_id, 'ORD-000205', 'Hafiz Salman (Demo)', '03000000005', null,
    'Sadiqabad', 'Shop 12, Old Grain Market Road, Sadiqabad', 'Opposite National Bank',
    4200.00, 0.00, 0.00, 4200.00, null,
    'cod', 'cod_pending', 'placed',
    'Suzuki Alto 660cc cabin and air filter.', null,
    'ur-roman', true, now() - interval '1 hour'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord5_id, v_p2.id, 'PAW-FLT-005',
    'Suzuki Alto 660cc Genuine Maintenance Filter Kit',
    '{"en": "Suzuki Alto 660cc Maintenance Kit", "ur": "سوزوکی آلٹو فلٹر کٹ", "ur-roman": "Suzuki Alto Filter Kit"}'::jsonb,
    2100.00, 2, 4200.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values (v_ord5_id, null, 'placed', 'Order placed via web store', now() - interval '1 hour');

  -- 6. ORD-000206: Karachi, Cancelled (Cancelled before shipping, stock restored)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord6_id, 'ORD-000206', 'Rashid Minhas (Demo)', '03000000006', 'rashid.demo@example.com',
    'Karachi', 'Apartment 4B, Clifton Block 5, Karachi', null,
    5500.00, 0.00, 300.00, 5800.00, null,
    'cod', 'cod_pending', 'cancelled',
    'Customer cancelled — sold car.', 'Order cancelled upon customer request. Stock restored.',
    'en', true, now() - interval '4 days'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord6_id, v_p1.id, 'PAW-IGN-001',
    'Ignition Coil Set (Pack of 4)',
    '{"en": "Ignition Coil Set", "ur": "اگنیشن کوائل سیٹ", "ur-roman": "Ignition Coil Set"}'::jsonb,
    5500.00, 1, 5500.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord6_id, null, 'placed', 'Order placed', now() - interval '4 days'),
    (v_ord6_id, 'placed', 'cancelled', 'Cancelled by customer before dispatch', now() - interval '3 days 18 hours');

  -- 7. ORD-000207: Rawalpindi, Returned & Refunded (Customer returned item, Trax courier)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at, delivered_at
  ) values (
    v_ord7_id, 'ORD-000207', 'Zubair Qureshi (Demo)', '03000000007', 'zubair.demo@example.com',
    'Rawalpindi', 'House 55, Street 12, Satellite Town, Rawalpindi', null,
    7200.00, 0.00, 300.00, 7500.00, null,
    'cod', 'refunded', 'returned',
    'Trax', 'TRX-55443322', 'https://trax.pk/tracking?tracking_number=TRX-55443322',
    'Wrong model part requested by buyer.', 'Received back into workshop inventory. Stock restored and refund settled.',
    'en', true, now() - interval '7 days', now() - interval '5 days'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord7_id, v_p2.id, 'PAW-BELT-001',
    'Bando Serpentine Fan Belt 6PK2100',
    '{"en": "Bando Serpentine Fan Belt 6PK2100", "ur": "بانڈو فین بیلٹ", "ur-roman": "Bando Fan Belt"}'::jsonb,
    7200.00, 1, 7200.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord7_id, null, 'placed', 'Placed via COD', now() - interval '7 days'),
    (v_ord7_id, 'placed', 'confirmed', 'Confirmed', now() - interval '6 days 18 hours'),
    (v_ord7_id, 'confirmed', 'packed', 'Packed', now() - interval '6 days 12 hours'),
    (v_ord7_id, 'packed', 'shipped', 'Shipped via Trax', now() - interval '6 days'),
    (v_ord7_id, 'shipped', 'delivered', 'Delivered', now() - interval '5 days'),
    (v_ord7_id, 'delivered', 'returned', 'Returned by customer (incorrect model fitment) — stock returned', now() - interval '3 days');

  -- 8. ORD-000208: Faisalabad, Manual Bank Transfer Advance Payment (Delivered, Paid)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at, delivered_at
  ) values (
    v_ord8_id, 'ORD-000208', 'Naveed Akhtar (Demo)', '03000000008', 'naveed.demo@example.com',
    'Faisalabad', 'Factory 14, Small Industrial Estate, Faisalabad', 'Near Mill Road',
    18000.00, 0.00, 300.00, 18300.00, null,
    'manual', 'paid', 'delivered',
    'M&P', 'MNP-11223344', 'https://mulphilog.com/tracking?consignment=MNP-11223344',
    'Paid via Meezan Bank online transfer.', 'Bank transfer verified in workshop Meezan account before dispatch.',
    'en', true, now() - interval '8 days', now() - interval '6 days'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord8_id, v_p3.id, 'PAW-SHK-001',
    'KYB Excel-G Gas Shock Absorbers Pair (Rear)',
    '{"en": "KYB Excel-G Rear Shock Absorbers Pair", "ur": "کے وائی بی ریئر شاکس پیئر", "ur-roman": "KYB Rear Shock Absorbers Pair"}'::jsonb,
    18000.00, 1, 18000.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord8_id, null, 'placed', 'Placed with manual bank transfer', now() - interval '8 days'),
    (v_ord8_id, 'placed', 'confirmed', 'Payment verified in Meezan Bank', now() - interval '7 days 20 hours'),
    (v_ord8_id, 'confirmed', 'packed', 'Packed in heavy crate', now() - interval '7 days 12 hours'),
    (v_ord8_id, 'packed', 'shipped', 'Shipped via M&P', now() - interval '7 days'),
    (v_ord8_id, 'shipped', 'delivered', 'Delivered safely in Faisalabad', now() - interval '6 days');

  -- 9. ORD-000209: Multan, Online Card Payment (Phase 7 forward compatibility example, Shipped, Paid)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    courier_name, tracking_number, tracking_url,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord9_id, 'ORD-000209', 'Shahid Raza (Demo)', '03000000009', 'shahid.demo@example.com',
    'Multan', 'Bungalow 7, Officers Colony, Bosan Road, Multan', null,
    11000.00, 0.00, 300.00, 11300.00, null,
    'online', 'paid', 'shipped',
    'PostEx', 'PEX-99881122', 'https://postex.pk/tracking?order_id=PEX-99881122',
    'Paid online via Visa Debit Card.', 'Online payment captured via payment gateway gateway_txn_demo_987.',
    'en', true, now() - interval '1 day 12 hours'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord9_id, v_p1.id, 'PAW-LUB-001',
    'Aisin CVT Fluid NS-3 Synthetic (4L Tin)',
    '{"en": "Aisin CVT Fluid NS-3 (4L)", "ur": "آئسن سی وی ٹی فلوئڈ 4 لیٹر", "ur-roman": "Aisin CVT Fluid 4L"}'::jsonb,
    11000.00, 1, 11000.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values
    (v_ord9_id, null, 'placed', 'Placed via Online Card Payment', now() - interval '1 day 12 hours'),
    (v_ord9_id, 'placed', 'confirmed', 'Online payment verified', now() - interval '1 day 6 hours'),
    (v_ord9_id, 'confirmed', 'packed', 'Packed at store', now() - interval '1 day 2 hours'),
    (v_ord9_id, 'packed', 'shipped', 'Handed over to PostEx courier', now() - interval '18 hours');

  -- 10. ORD-000210: Peshawar, Placed via COD (Rs. 300 flat delivery)
  insert into public.orders (
    id, order_no, customer_name, customer_phone, customer_email,
    city, address_line, address_notes,
    subtotal, discount, delivery_charge, total, coupon_code,
    payment_method, payment_status, status,
    customer_notes, admin_notes, language, is_demo, placed_at
  ) values (
    v_ord10_id, 'ORD-000210', 'Arbab Jehangir (Demo)', '03000000010', null,
    'Peshawar', 'Hayatabad Phase 3, Sector D, Peshawar', 'Near Tatara Park',
    3500.00, 0.00, 300.00, 3800.00, null,
    'cod', 'cod_pending', 'placed',
    'Please send latest batch oil filter.', null,
    'en', true, now() - interval '30 minutes'
  );

  insert into public.order_items (order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total)
  values (
    v_ord10_id, v_p2.id, 'PAW-FLT-009',
    'Wix Air Filter WA1044',
    '{"en": "Wix Air Filter WA1044", "ur": "وکس ایئر فلٹر", "ur-roman": "Wix Air Filter"}'::jsonb,
    3500.00, 1, 3500.00
  );

  insert into public.order_status_history (order_id, from_status, to_status, note, created_at)
  values (v_ord10_id, null, 'placed', 'Order placed via COD to Peshawar', now() - interval '30 minutes');

  -- Ensure sequence is ahead of 210 so real orders start at ORD-000211+
  perform setval('public.order_no_seq', greatest(currval('public.order_no_seq'), 211), true);
exception when others then
  perform setval('public.order_no_seq', 211, true);
end;
$$;
