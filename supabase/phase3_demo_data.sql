-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 3 DEMO DATA SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--
-- To remove all demo data in one step, run:
--   supabase/remove_demo_data.sql
-- =============================================================================

-- =============================================================================
-- 1. DEMO SITE_SETTINGS (Trilingual address, working hours, about story, demo_mode = true)
-- =============================================================================
update public.site_settings
set
  demo_mode = true,
  address = jsonb_build_object(
    'en', 'Main Bazaar, Sadiqabad (Demo)',
    'ur', 'مین بازار، صادق آباد (ڈیمو)',
    'ur-roman', 'Main Bazaar, Sadiqabad (Demo)'
  ),
  working_hours = jsonb_build_object(
    'monday',    jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'tuesday',   jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'wednesday', jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'thursday',  jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'friday',    jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'saturday',  jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
    'sunday',    jsonb_build_object('isOpen', false, 'openTime', '10:00', 'closeTime', '18:00')
  ),
  about_title = jsonb_build_object(
    'en', 'Dependable Car Care & Genuine Auto Parts Under One Roof',
    'ur', 'قابلِ اعتماد کار ورکشاپ اور اصلی آٹو پارٹس ایک ہی چھت کے نیچے',
    'ur-roman', 'Qabil-e-Etimad Car Workshop Aur Asli Auto Parts Aik Hi Chhat Ke Neechay'
  ),
  about_body = jsonb_build_object(
    'en', E'## Built for Everyday Drivers in Pakistan\n\n**Pak Auto Works & Parts** brings modern computerized diagnostics, experienced mechanical care, and quality replacement parts together in one clean, organized facility.\n\n### Our Workshop Principles\n- **Upfront Inspection First**: Every vehicle receives a structured check before we recommend repairs or parts.\n- **Genuine & Verified Parts**: We clearly separate OEM and high-grade aftermarket options so you always know what goes into your car.\n- **Clear Timelines & Updates**: From online appointment booking to final road testing, our team keeps you informed at every step.',
    'ur', E'## پاکستان کے روزمرہ ڈرائیورز کے لیے جدید ورکشاپ\n\n**پاک آٹو ورکس اینڈ پارٹس** جدید کمپیوٹرائزڈ ڈائیگناسٹکس، تجربہ کار مکینیکل سروس اور معیاری سپیئر پارٹس کو ایک ہی منظم مرکز میں یکجا کرتا ہے۔\n\n### ہمارے اصول\n- **واضح معائنہ اور تخمینہ**: کسی بھی مرمت یا پرزے کی تبدیلی سے پہلے مکمل چیک اپ اور واضح معلومات فراہم کی جاتی ہیں۔\n- **اصلی اور تصدیق شدہ پارٹس**: ہم جینوئن اور معیاری آفٹر مارکیٹ پارٹس کی واضح درجہ بندی کرتے ہیں۔\n- **برقت اپ ڈیٹس**: آن لائن بکنگ سے لے کر فائنل روڈ ٹیسٹ تک ہر مرحلے پر آپ کو باخبر رکھا جاتا ہے۔',
    'ur-roman', E'## Pakistan Ke Rozmarra Drivers Ke Liye Jadeed Workshop\n\n**Pak Auto Works & Parts** jadeed computerized diagnostics, tajrubakar mechanical service aur معیاری spare parts ko aik hi munazzam markaz mein yakja karta hai.\n\n### Hamaray Usool\n- **Wazeh Inspection Aur Estimate**: Kisi bhi repair ya part tabdeeli se pehle mukammal check-up aur wazeh maloomat faraham ki jati hain.\n- **Asli Aur Tasdeeq Shuda Parts**: Hum genuine aur high-grade aftermarket parts ki wazeh tafreeq rakhte hain.\n- **Barwaqt Updates**: Online booking se le kar final road test tak har marhalay par aap ko bakhabar rakha jata hai.'
  ),
  announcement_enabled = true,
  announcement = jsonb_build_object(
    'en', 'Online Service Booking is live — book your slot or call 03126776844 (Demo Mode)',
    'ur', 'آن لائن سروس بکنگ دستیاب ہے — اپنا وقت بک کریں یا 03126776844 پر کال کریں (ڈیمو موڈ)',
    'ur-roman', 'Online Service Booking dastiyab hai — apna slot book karein ya 03126776844 par call karein (Demo Mode)'
  )
where id = 1;

-- =============================================================================
-- 2. DEMO SAMPLE PRICES & ESTIMATED TIMES ON PHASE 2 SERVICES (PKR estimates)
-- Uses exact Phase 2 public.services columns:
--   price_from, price_to, price_note, estimated_time
-- =============================================================================
with sample_services (slug, price_from, price_to, est_en, est_ur, est_roman) as (
  values
    -- Phase 2 seeded service slugs (14 services)
    ('engine',                    3500::numeric,  45000::numeric, '2 – 6 hours (Demo)',     '2 تا 6 گھنٹے (ڈیمو)',   '2 – 6 ghantay (Demo)'),
    ('denting-painting',          6000::numeric,  60000::numeric, '1 – 4 days (Demo)',      '1 تا 4 دن (ڈیمو)',      '1 – 4 din (Demo)'),
    ('ac-repair',                 3000::numeric,  22000::numeric, '1 – 3 hours (Demo)',     '1 تا 3 گھنٹے (ڈیمو)',   '1 – 3 ghantay (Demo)'),
    ('electrical',                1500::numeric,  12000::numeric, '45 – 90 mins (Demo)',    '45 تا 90 منٹ (ڈیمو)',   '45 – 90 mins (Demo)'),
    ('tyres',                     1500::numeric,   8000::numeric, '30 – 60 mins (Demo)',    '30 تا 60 منٹ (ڈیمو)',   '30 – 60 mins (Demo)'),
    ('car-wash-detailing',        3500::numeric,  18000::numeric, '2 – 5 hours (Demo)',     '2 تا 5 گھنٹے (ڈیمو)',   '2 – 5 ghantay (Demo)'),
    ('brakes',                    2500::numeric,  18000::numeric, '1 – 2 hours (Demo)',     '1 تا 2 گھنٹے (ڈیمو)',   '1 – 2 ghantay (Demo)'),
    ('suspension-steering',       4000::numeric,  35000::numeric, '2 – 4 hours (Demo)',     '2 تا 4 گھنٹے (ڈیمو)',   '2 – 4 ghantay (Demo)'),
    ('oil-change-service',        4500::numeric,  14000::numeric, '45 – 60 mins (Demo)',    '45 تا 60 منٹ (ڈیمو)',   '45 – 60 mins (Demo)'),
    ('battery',                   1500::numeric,   6000::numeric, '30 – 45 mins (Demo)',    '30 تا 45 منٹ (ڈیمو)',   '30 – 45 mins (Demo)'),
    ('wheel-alignment-balancing', 2000::numeric,   4500::numeric, '45 – 60 mins (Demo)',    '45 تا 60 منٹ (ڈیمو)',   '45 – 60 mins (Demo)'),
    ('transmission-gearbox',      8000::numeric,  55000::numeric, '3 – 6 hours (Demo)',     '3 تا 6 گھنٹے (ڈیمو)',   '3 – 6 ghantay (Demo)'),
    ('exhaust',                   2000::numeric,  15000::numeric, '1 – 2 hours (Demo)',     '1 تا 2 گھنٹے (ڈیمو)',   '1 – 2 ghantay (Demo)'),
    ('general-inspection',        3000::numeric,   6000::numeric, '60 – 90 mins (Demo)',    '60 تا 90 منٹ (ڈیمو)',   '60 – 90 mins (Demo)'),
    -- Alternate / alias slugs (if present)
    ('periodic-maintenance',      4500::numeric,  14000::numeric, '45 – 60 mins (Demo)',    '45 تا 60 منٹ (ڈیمو)',   '45 – 60 mins (Demo)'),
    ('computerized-diagnostics',  1500::numeric,   3500::numeric, '30 – 45 mins (Demo)',    '30 تا 45 منٹ (ڈیمو)',   '30 – 45 mins (Demo)'),
    ('engine-repair',             3500::numeric,  45000::numeric, '2 – 6 hours (Demo)',     '2 تا 6 گھنٹے (ڈیمو)',   '2 – 6 ghantay (Demo)'),
    ('brake-service',             2500::numeric,  18000::numeric, '1 – 2 hours (Demo)',     '1 تا 2 گھنٹے (ڈیمو)',   '1 – 2 ghantay (Demo)'),
    ('ac-heating-service',        3000::numeric,  22000::numeric, '1 – 3 hours (Demo)',     '1 تا 3 گھنٹے (ڈیمو)',   '1 – 3 ghantay (Demo)'),
    ('electrical-battery',        1500::numeric,  12000::numeric, '45 – 90 mins (Demo)',    '45 تا 90 منٹ (ڈیمو)',   '45 – 90 mins (Demo)'),
    ('transmission-clutch',       8000::numeric,  55000::numeric, '3 – 6 hours (Demo)',     '3 تا 6 گھنٹے (ڈیمو)',   '3 – 6 ghantay (Demo)'),
    ('detailing-cleaning',        3500::numeric,  18000::numeric, '2 – 5 hours (Demo)',     '2 تا 5 گھنٹے (ڈیمو)',   '2 – 5 ghantay (Demo)'),
    ('pre-purchase-inspection',   3000::numeric,   6000::numeric, '60 – 90 mins (Demo)',    '60 تا 90 منٹ (ڈیمو)',   '60 – 90 mins (Demo)'),
    ('hybrid-ev-care',            4000::numeric,  28000::numeric, '1 – 3 hours (Demo)',     '1 تا 3 گھنٹے (ڈیمو)',   '1 – 3 ghantay (Demo)'),
    ('roadside-pickup',           2000::numeric,   8000::numeric, '30 – 60 mins (Demo)',    '30 تا 60 منٹ (ڈیمو)',   '30 – 60 mins (Demo)')
)
update public.services s
set
  price_from = v.price_from,
  price_to = v.price_to,
  price_note = jsonb_build_object(
    'en', 'Sample estimate — final quote after inspection',
    'ur', 'نمونہ تخمینہ — حتمی قیمت معائنے کے بعد',
    'ur-roman', 'Sample estimate — final quote inspection ke baad'
  ),
  estimated_time = jsonb_build_object(
    'en', v.est_en,
    'ur', v.est_ur,
    'ur-roman', v.est_roman
  )
from sample_services v
where s.slug = v.slug;

-- =============================================================================
-- 3. DEMO BOOKINGS (9 realistic sample bookings with is_demo = true)
--    Uses obviously fake phones 03000000001..03000000009
--    Leaves ample free capacity on Today and the next 3 working days
-- =============================================================================
do $$
declare
  v_today date := (now() at time zone 'Asia/Karachi')::date;
  v_d0 date;
  v_d1 date;
  v_d2 date;
  v_past1 date;
  v_past2 date;
  v_b1 uuid;
  v_b2 uuid;
  v_b3 uuid;
  v_b4 uuid;
  v_b5 uuid;
  v_b6 uuid;
  v_b7 uuid;
  v_b8 uuid;
  v_b9 uuid;
  v_srv_oil uuid;
  v_srv_diag uuid;
  v_srv_brake uuid;
  v_srv_ac uuid;
  v_srv_susp uuid;
  v_srv_align uuid;
  v_srv_hybrid uuid;
  v_srv_insp uuid;
  v_srv_detail uuid;
begin
  -- Remove previous demo rows before re-seeding so script is 100% idempotent
  delete from public.bookings where is_demo = true;
  delete from public.blocked_slots where is_demo = true;
  delete from public.contact_messages where is_demo = true;

  -- Compute working days (skip Sundays where dow = 0)
  v_d0 := case when extract(dow from v_today)::int = 0 then v_today + 1 else v_today end;
  v_d1 := v_d0 + 1;
  if extract(dow from v_d1)::int = 0 then v_d1 := v_d1 + 1; end if;
  v_d2 := v_d1 + 1;
  if extract(dow from v_d2)::int = 0 then v_d2 := v_d2 + 1; end if;

  v_past1 := v_today - 2;
  v_past2 := v_today - 4;

  select id into v_srv_oil    from public.services where slug in ('oil-change-service', 'periodic-maintenance') limit 1;
  select id into v_srv_diag   from public.services where slug in ('electrical', 'computerized-diagnostics') limit 1;
  select id into v_srv_brake  from public.services where slug in ('brakes', 'brake-service') limit 1;
  select id into v_srv_ac     from public.services where slug in ('ac-repair', 'ac-heating-service') limit 1;
  select id into v_srv_susp   from public.services where slug = 'suspension-steering' limit 1;
  select id into v_srv_align  from public.services where slug = 'wheel-alignment-balancing' limit 1;
  select id into v_srv_hybrid from public.services where slug in ('engine', 'hybrid-ev-care') limit 1;
  select id into v_srv_insp   from public.services where slug in ('general-inspection', 'pre-purchase-inspection') limit 1;
  select id into v_srv_detail from public.services where slug in ('car-wash-detailing', 'detailing-cleaning') limit 1;

  -- Booking 1: Today 10:00 (in_progress) — Phone: 03000000001
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000101', 'Tariq Mahmood (Demo)', '03000000001', 'tariq.demo@example.com',
    'Toyota', 'Corolla', 2021, 'LEA-21-4401', 'petrol', 48500,
    v_d0, '10:00'::time, '11:00'::time,
    '10,000 km synthetic oil change and front brake pad check (slight squeak on braking).',
    false, null, 'in_progress', 'Bay 1 assigned — oil filter & front ceramic brake pads inspected.', true
  ) returning id into v_b1;

  -- Booking 2: Today 12:00 (confirmed) — Phone: 03000000002
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000102', 'Usman Sheikh (Demo)', '03000000002', 'usman.demo@example.com',
    'Honda', 'Civic', 2022, 'LEB-22-8910', 'petrol', 31200,
    v_d0, '12:00'::time, '13:00'::time,
    'A/C cooling weak in afternoon traffic; please check cabin filter and refrigerant pressure.',
    true, 'House 42, Block G, Model Town, Lahore (Demo)', 'confirmed', 'Pickup driver scheduled for 11:15 AM.', true
  ) returning id into v_b2;

  -- Booking 3: Next Working Day 1 10:00 (pending) — Phone: 03000000003
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000103', 'Bilal Ahmed (Demo)', '03000000003', 'bilal.demo@example.com',
    'Suzuki', 'Alto', 2023, 'LEC-23-1120', 'petrol', 19400,
    v_d1, '10:00'::time, '11:00'::time,
    'Periodic maintenance, throttle body cleaning and wheel balancing.',
    false, null, 'pending', null, true
  ) returning id into v_b3;

  -- Booking 4: Next Working Day 1 14:00 (confirmed) — Phone: 03000000004
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000104', 'Kamran Siddiqui (Demo)', '03000000004', 'kamran.demo@example.com',
    'Kia', 'Sportage', 2021, 'LED-21-7755', 'petrol', 54000,
    v_d1, '14:00'::time, '15:00'::time,
    'Steering pulls slightly left on highway; 3D wheel alignment and front suspension bush check.',
    false, null, 'confirmed', 'Confirmed via WhatsApp.', true
  ) returning id into v_b4;

  -- Booking 5: Next Working Day 2 11:00 (pending) — Phone: 03000000005
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000105', 'Farhan Qureshi (Demo)', '03000000005', 'farhan.demo@example.com',
    'Toyota', 'Yaris', 2022, 'LEF-22-3309', 'petrol', 27800,
    v_d2, '11:00'::time, '12:00'::time,
    'Pre-purchase full inspection before buying used Yaris ATIV X.',
    false, null, 'pending', null, true
  ) returning id into v_b5;

  -- Booking 6: Past Day 1 11:00 (completed) — Phone: 03000000006
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000106', 'Zainab Malik (Demo)', '03000000006', 'zainab.demo@example.com',
    'Toyota', 'Aqua', 2019, 'LEG-19-6042', 'hybrid', 76500,
    v_past1, '11:00'::time, '12:00'::time,
    'Hybrid battery cooling fan cleaning and OBD-II health report.',
    false, null, 'completed', 'HV fan filter cleaned; all battery block voltages balanced.', true
  ) returning id into v_b6;

  -- Booking 7: Past Day 2 15:00 (completed) — Phone: 03000000007
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000107', 'Salman Haider (Demo)', '03000000007', 'salman.demo@example.com',
    'Changan', 'Alsvin', 2022, 'LEH-22-9182', 'petrol', 36000,
    v_past2, '15:00'::time, '16:00'::time,
    'Complete interior & exterior detailing and engine bay degreasing.',
    false, null, 'completed', 'Completed and delivered on time.', true
  ) returning id into v_b7;

  -- Booking 8: Next Working Day 2 16:00 (rescheduled) — Phone: 03000000008
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000108', 'Adeel Raza (Demo)', '03000000008', null,
    'Hyundai', 'Tucson', 2021, 'LEJ-21-5050', 'petrol', 44200,
    v_d2, '16:00'::time, '17:00'::time,
    'Check engine light came on after highway trip; scan requested.',
    false, null, 'rescheduled', 'Moved to 4:00 PM slot per customer phone request.', true
  ) returning id into v_b8;

  -- Booking 9: Past Day 1 16:00 (cancelled) — Phone: 03000000009
  insert into public.bookings (
    booking_no, customer_name, customer_phone, customer_email,
    make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_km,
    booking_date, slot_start, slot_end, problem_description,
    pickup_requested, pickup_address, status, admin_notes, is_demo
  ) values (
    'BK-000109', 'Noman Butt (Demo)', '03000000009', null,
    'Suzuki', 'Cultus', 2020, 'LEK-20-2190', 'petrol', 62000,
    v_past1, '16:00'::time, '17:00'::time,
    'Front shock absorber noise over speed breakers.',
    false, null, 'cancelled', 'Customer travelling out of city; will rebook next week.', true
  ) returning id into v_b9;

  -- Link booking_services
  insert into public.booking_services (booking_id, service_id, service_name)
  values
    (v_b1, v_srv_oil,    'Periodic Maintenance & Oil Service'),
    (v_b1, v_srv_brake,  'Brake Service & Overhaul'),
    (v_b2, v_srv_ac,     'AC & Heating Service'),
    (v_b3, v_srv_oil,    'Periodic Maintenance & Oil Service'),
    (v_b3, v_srv_align,  'Wheel Alignment & Balancing'),
    (v_b4, v_srv_align,  'Wheel Alignment & Balancing'),
    (v_b4, v_srv_susp,   'Suspension & Steering Repair'),
    (v_b5, v_srv_insp,   'Pre-Purchase Car Inspection'),
    (v_b6, v_srv_hybrid, 'Hybrid & EV Care'),
    (v_b6, v_srv_diag,   'Computerized Engine Diagnostics'),
    (v_b7, v_srv_detail, 'Car Detailing & Interior Cleaning'),
    (v_b8, v_srv_diag,   'Computerized Engine Diagnostics'),
    (v_b9, v_srv_susp,   'Suspension & Steering Repair');

  -- Link booking_status_history
  insert into public.booking_status_history (booking_id, from_status, to_status, note)
  values
    (v_b1, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b1, 'pending', 'confirmed', 'Confirmed by workshop advisor (Demo)'),
    (v_b1, 'confirmed', 'in_progress', 'Vehicle received on Bay 1 (Demo)'),
    (v_b2, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b2, 'pending', 'confirmed', 'Pickup confirmed for 11:15 AM (Demo)'),
    (v_b3, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b4, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b4, 'pending', 'confirmed', 'Slot confirmed (Demo)'),
    (v_b5, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b6, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b6, 'pending', 'confirmed', 'Slot confirmed (Demo)'),
    (v_b6, 'confirmed', 'in_progress', 'HV battery fan inspection started (Demo)'),
    (v_b6, 'in_progress', 'completed', 'Service completed and diagnostic report handed over (Demo)'),
    (v_b7, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b7, 'pending', 'completed', 'Detailing completed (Demo)'),
    (v_b8, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b8, 'pending', 'rescheduled', 'Rescheduled to 16:00 per customer request (Demo)'),
    (v_b9, null, 'pending', 'Online booking submitted (Demo)'),
    (v_b9, 'pending', 'cancelled', 'Cancelled by customer prior to slot (Demo)');

  -- Advance sequence past demo numbers so new user bookings start cleanly
  perform setval('public.booking_no_seq', greatest(currval('public.booking_no_seq'), 110), true);
exception
  when others then
    perform setval('public.booking_no_seq', 110, true);
end $$;

-- =============================================================================
-- 4. DEMO BLOCKED SLOT (1 partial-day lunch/maintenance block on next working day)
-- =============================================================================
insert into public.blocked_slots (block_date, start_time, end_time, reason, is_demo)
values (
  case
    when extract(dow from ((now() at time zone 'Asia/Karachi')::date + 1))::int = 0
      then (now() at time zone 'Asia/Karachi')::date + 2
    else (now() at time zone 'Asia/Karachi')::date + 1
  end,
  '13:00'::time,
  '14:00'::time,
  'Equipment calibration & Friday/lunch break (Demo)',
  true
);

-- =============================================================================
-- 5. DEMO CONTACT MESSAGES (4 realistic inquiries with fake phones 03000000001..04)
-- =============================================================================
insert into public.contact_messages (
  name, phone, email, subject, message, language, status, is_demo
)
values
  (
    'Waqas Ahmad (Demo)',
    '03000000001',
    'waqas.demo@example.com',
    'Honda City 2020 CVT Transmission Fluid Quote',
    'Assalam o Alaikum, do you have genuine Honda HCF-2 CVT fluid in stock for a 2020 Honda City 1.5L, and what is the total cost with labour?',
    'en',
    'new',
    true
  ),
  (
    'Shoaib Akram (Demo)',
    '03000000002',
    null,
    'Corolla Grande Front Shock Absorbers',
    'Meri Corolla Grande 2018 ke front shocks se khadday mein awaz aati hai. Kya aap ke paas KYB ya genuine parts available hain?',
    'ur-roman',
    'new',
    true
  ),
  (
    'Hassan Javed (Demo)',
    '03000000003',
    'hassan.demo@example.com',
    'Pre-Purchase Inspection for Kia Sportage AWD',
    'I am planning to buy a 2021 Kia Sportage AWD this Saturday. Can I bring it in for a full paint thickness + OBD-II + underbody check?',
    'en',
    'read',
    true
  ),
  (
    'عمران خان (ڈیمو)',
    '03000000004',
    null,
    'اے سی سروس اور گیس چارجنگ',
    'السلام علیکم، سوزوکی آلٹو 2022 کے اے سی کی کولنگ کم ہو گئی ہے۔ مکمل اے سی سروس کا وقت اور تخمینہ بتا دیں۔',
    'ur',
    'replied',
    true
  );
