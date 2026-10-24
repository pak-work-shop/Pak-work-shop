-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 4 DEMO DATA (JOB CARDS & INVOICES)
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--   4. supabase/phase3_demo_data.sql (optional but recommended for booking links)
--   5. supabase/phase4_jobs.sql
--
-- What this script seeds:
--   - 9 Demo Job Cards (JC-000201 to JC-000209) covering all 9 statuses:
--       received, inspection, awaiting_approval, in_progress, quality_check,
--       ready, delivered, on_hold, cancelled
--   - 2 to 4 realistic work items per job (services, parts, labor, other)
--   - Status history timeline and 2 to 4 customer-visible progress notes on active jobs
--   - 5 Demo Invoices (INV-000201 to INV-000205) covering all 5 statuses:
--       paid, partially_paid, issued, draft, void
--   - Demo payments on the paid and partially_paid invoices
--   - Links demo jobs to an existing customer account ONLY if one exists
--     (never creates auth.users records).
--   - All rows are flagged with is_demo = true for one-step removal via
--     supabase/remove_demo_data_phase4.sql
-- =============================================================================

-- Clean up any existing Phase 4 demo rows first (invoices must be deleted before job_cards due to ON DELETE RESTRICT)
delete from public.invoices where is_demo = true;
delete from public.job_cards where is_demo = true;

do $$
declare
  v_j1 uuid := gen_random_uuid();
  v_j2 uuid := gen_random_uuid();
  v_j3 uuid := gen_random_uuid();
  v_j4 uuid := gen_random_uuid();
  v_j5 uuid := gen_random_uuid();
  v_j6 uuid := gen_random_uuid();
  v_j7 uuid := gen_random_uuid();
  v_j8 uuid := gen_random_uuid();
  v_j9 uuid := gen_random_uuid();

  v_inv_partial uuid := gen_random_uuid();
  v_inv_issued  uuid := gen_random_uuid();
  v_inv_paid    uuid := gen_random_uuid();
  v_inv_draft   uuid := gen_random_uuid();
  v_inv_void    uuid := gen_random_uuid();

  v_bk1 uuid;
  v_bk2 uuid;
  v_bk3 uuid;
  v_bk4 uuid;
  v_bk5 uuid;

  v_srv_oil    uuid;
  v_srv_brakes uuid;
  v_srv_ac     uuid;
  v_srv_elec   uuid;
  v_srv_susp   uuid;
  v_srv_align  uuid;
  v_srv_insp   uuid;
  v_srv_trans  uuid;
  v_srv_engine uuid;
  v_srv_dent   uuid;

  v_make_toyota uuid;
  v_make_honda  uuid;
  v_make_suzuki uuid;
  v_make_kia    uuid;

  v_demo_customer_id uuid;
  v_today date := (now() at time zone 'Asia/Karachi')::date;
begin
  -- Find an existing customer profile if one exists (do not create auth.users)
  select p.id
    into v_demo_customer_id
    from public.profiles p
   where p.role = 'customer'
   order by
     case when public.normalize_phone_last10(p.phone) in ('3000000001', '3000000004', '3000000005') then 0 else 1 end,
     p.created_at asc
   limit 1;

  -- Lookup optional demo bookings from Phase 3 if present
  select id into v_bk1 from public.bookings where is_demo = true and customer_phone = '03000000001' limit 1;
  select id into v_bk2 from public.bookings where is_demo = true and customer_phone = '03000000002' limit 1;
  select id into v_bk3 from public.bookings where is_demo = true and customer_phone = '03000000003' limit 1;
  select id into v_bk4 from public.bookings where is_demo = true and customer_phone = '03000000004' limit 1;
  select id into v_bk5 from public.bookings where is_demo = true and customer_phone = '03000000005' limit 1;

  -- Lookup Phase 2 service IDs
  select id into v_srv_oil    from public.services where slug = 'oil-change-service' limit 1;
  select id into v_srv_brakes from public.services where slug = 'brakes' limit 1;
  select id into v_srv_ac     from public.services where slug = 'ac-repair' limit 1;
  select id into v_srv_elec   from public.services where slug = 'electrical' limit 1;
  select id into v_srv_susp   from public.services where slug = 'suspension-steering' limit 1;
  select id into v_srv_align  from public.services where slug = 'wheel-alignment-balancing' limit 1;
  select id into v_srv_insp   from public.services where slug = 'general-inspection' limit 1;
  select id into v_srv_trans  from public.services where slug = 'transmission-gearbox' limit 1;
  select id into v_srv_engine from public.services where slug = 'engine' limit 1;
  select id into v_srv_dent   from public.services where slug = 'denting-painting' limit 1;

  -- Lookup Vehicle Makes
  select id into v_make_toyota from public.vehicle_makes where slug = 'toyota' limit 1;
  select id into v_make_honda  from public.vehicle_makes where slug = 'honda' limit 1;
  select id into v_make_suzuki from public.vehicle_makes where slug = 'suzuki' limit 1;
  select id into v_make_kia    from public.vehicle_makes where slug = 'kia' limit 1;

  -- ===========================================================================
  -- 1. INSERT 9 DEMO JOB CARDS (JC-000201 .. JC-000209)
  -- ===========================================================================

  -- JC-000201: IN_PROGRESS (Linked to booking 1 & optional demo customer)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j1, 'JC-000201', v_bk1, v_demo_customer_id,
    'Demo Customer – Ahmed Raza', '03000000001', 'ahmed.demo@example.com',
    v_make_toyota, 'Toyota', 'Corolla', 2021, 'LEA-21-4401', 'petrol', 42500,
    'in_progress',
    '40,000 km periodic maintenance, synthetic oil change, and front brake squeak at low speeds. (Demo)',
    v_today + 1,
    'Synthetic oil service complete; front brake rotors skimmed and ceramic pads being fitted on Bay 1.',
    'Demo internal note: Customer requested old brake pads returned in box.',
    true, now() - interval '6 hours', null, true
  );

  -- JC-000202: INSPECTION (Linked to booking 2)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j2, 'JC-000202', v_bk2, null,
    'Demo Customer – Usman Tariq', '03000000002', 'usman.demo@example.com',
    v_make_honda, 'Honda', 'Civic', 2020, 'LHR-20-8812', 'petrol', 58000,
    'inspection',
    'AC cooling drops in afternoon traffic; cabin airflow weak on fan speed 2. (Demo)',
    v_today + 1,
    'Manifold gauge pressure test and condenser fin inspection currently underway.',
    'Demo internal note: Check compressor clutch relay as well.',
    false, now() - interval '3 hours', null, true
  );

  -- JC-000203: AWAITING_APPROVAL (Linked to booking 3)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j3, 'JC-000203', v_bk3, null,
    'Demo Customer – Bilal Mehmood', '03000000003', 'bilal.demo@example.com',
    v_make_suzuki, 'Suzuki', 'Cultus', 2019, 'LED-19-3309', 'petrol', 67200,
    'awaiting_approval',
    'Check engine light on and slight jerking during 1st-to-2nd AGS gear shift. (Demo)',
    v_today + 2,
    'OBD-II scan and inspection complete. Awaiting your approval on the spark plug set and AGS clutch re-learn estimate.',
    'Demo internal note: Sent estimate summary on WhatsApp.',
    true, now() - interval '1 day', null, true
  );

  -- JC-000204: READY (Linked to booking 4 & optional demo customer)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j4, 'JC-000204', v_bk4, v_demo_customer_id,
    'Demo Customer – Kamran Siddiqui', '03000000004', 'kamran.demo@example.com',
    v_make_kia, 'Kia', 'Sportage', 2022, 'LEB-22-9104', 'petrol', 31000,
    'ready',
    'Front suspension clunking noise over speed breakers and steering pull to left. (Demo)',
    v_today,
    'Road test and 3D wheel alignment passed. Your vehicle is washed and ready for pickup at the workshop.',
    'Demo internal note: Parked in covered delivery bay.',
    true, now() - interval '1 day 4 hours', null, true
  );

  -- JC-000205: DELIVERED (Linked to booking 5 & optional demo customer)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j5, 'JC-000205', v_bk5, v_demo_customer_id,
    'Demo Customer – Faisal Nawaz', '03000000005', 'faisal.demo@example.com',
    v_make_toyota, 'Toyota', 'Yaris', 2022, 'LEC-22-5510', 'petrol', 24000,
    'delivered',
    'Complete pre-purchase inspection and throttle body cleaning before ownership transfer. (Demo)',
    v_today - 3,
    'Vehicle delivered with printed 20-point inspection checklist and paid invoice receipt.',
    'Demo internal note: Completed and handed over.',
    true, now() - interval '4 days', now() - interval '3 days', true
  );

  -- JC-000206: RECEIVED (Standalone walk-in)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j6, 'JC-000206', null, null,
    'Demo Customer – Tariq Javed', '03000000006', 'tariq.demo@example.com',
    v_make_toyota, 'Toyota', 'Corolla', 2020, 'LHR-20-5120', 'petrol', 61500,
    'received',
    'CVT transmission fluid replacement and underbody inspection. (Demo)',
    v_today + 1,
    'Vehicle checked in at reception and queued for transmission bay lift.',
    'Demo internal note: Use genuine Toyota CVT-FE 4L tin.',
    false, now() - interval '90 minutes', null, true
  );

  -- JC-000207: QUALITY_CHECK (Standalone walk-in)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j7, 'JC-000207', null, null,
    'Demo Customer – Hassan Riaz', '03000000007', 'hassan.demo@example.com',
    v_make_toyota, 'Toyota', 'Aqua', 2018, 'ISB-18-7741', 'hybrid', 84300,
    'quality_check',
    'Hybrid battery cooling fan maintenance warning and fuel average check. (Demo)',
    v_today,
    'Hybrid blower duct cleaned and cell voltage balance verified; final quality check in progress.',
    'Demo internal note: All 14 battery blocks balanced within 0.08V.',
    true, now() - interval '8 hours', null, true
  );

  -- JC-000208: ON_HOLD (Standalone walk-in)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j8, 'JC-000208', null, null,
    'Demo Customer – Noman Sheikh', '03000000008', 'noman.demo@example.com',
    v_make_honda, 'Honda', 'City', 2019, 'MUL-19-2290', 'petrol', 93400,
    'on_hold',
    'Cold-start timing chain rattle and valve cover oil seepage. (Demo)',
    v_today + 3,
    'Job temporarily on hold awaiting OEM timing chain tensioner assembly arrival (expected tomorrow morning).',
    'Demo internal note: Customer approved waiting for genuine OEM tensioner.',
    true, now() - interval '2 days', null, true
  );

  -- JC-000209: CANCELLED (Standalone walk-in)
  insert into public.job_cards (
    id, job_no, booking_id, user_id,
    customer_name, customer_phone, customer_email,
    make_id, make_text, model_text, vehicle_year, plate_number, fuel_type, mileage_in,
    status, complaint, estimated_completion, public_note, internal_notes,
    show_cost_to_customer, received_at, delivered_at, is_demo
  ) values (
    v_j9, 'JC-000209', null, null,
    'Demo Customer – Zainab Ali', '03000000009', 'zainab.demo@example.com',
    v_make_suzuki, 'Suzuki', 'Alto', 2022, 'RYK-22-1198', 'petrol', 18900,
    'cancelled',
    'Rear bumper denting and pearl-white paint touchup estimate. (Demo)',
    null,
    'Job cancelled at customer request prior to body shop work (insurance claim deferred).',
    'Demo internal note: No labor charged; car released.',
    false, now() - interval '5 days', null, true
  );

  -- ===========================================================================
  -- 2. INSERT DEMO JOB ITEMS (2 to 4 realistic items per job)
  -- ===========================================================================
  insert into public.job_items (job_id, item_type, description, service_id, quantity, unit_price, sort_order)
  values
    -- JC-000201 (Total = 4500 + 8200 + 2500 + 6800 = 22,000 PKR)
    (v_j1, 'service', 'Periodic Oil & Filter Change Service (Demo)', v_srv_oil, 1, 4500, 10),
    (v_j1, 'part',    '5W-30 Fully Synthetic Engine Oil (4L) + OEM Oil Filter (Demo)', null, 1, 8200, 20),
    (v_j1, 'service', 'Front Brake Servicing & Disc Skimming (Demo)', v_srv_brakes, 1, 2500, 30),
    (v_j1, 'part',    'Front Ceramic Brake Pad Set (Corolla Altis) (Demo)', null, 1, 6800, 40),

    -- JC-000202 (Total = 3000 + 4500 + 1800 = 9,300 PKR)
    (v_j2, 'service', 'AC Pressure Diagnostics & Cooling Service (Demo)', v_srv_ac, 1, 3000, 10),
    (v_j2, 'part',    'R134a Refrigerant Gas Recharge & Schrader Valve Core (Demo)', null, 1, 4500, 20),
    (v_j2, 'part',    'Activated Carbon Cabin Air Filter (Civic X) (Demo)', null, 1, 1800, 30),

    -- JC-000203 (Total = 1500 + 3500 + 6400 = 11,400 PKR)
    (v_j3, 'service', 'OBD-II Computerized Engine & AGS Diagnostics (Demo)', v_srv_elec, 1, 1500, 10),
    (v_j3, 'labor',   'AGS Clutch Actuator Bleed & Shift Point Calibration (Demo)', null, 1, 3500, 20),
    (v_j3, 'part',    'NGK Iridium Spark Plugs (Set of 3 — K10B Engine) (Demo)', null, 3, 2100, 30),

    -- JC-000204 (Total = 4000 + 7600 + 2500 + 1900 = 16,000 PKR)
    (v_j4, 'service', 'Front Suspension Overhaul & Inspection (Demo)', v_srv_susp, 1, 4000, 10),
    (v_j4, 'part',    'Front Stabilizer Link Rods Pair (Sportage AWD) (Demo)', null, 2, 3800, 20),
    (v_j4, 'service', '3D Four-Wheel Alignment & Computerized Balancing (Demo)', v_srv_align, 1, 2500, 30),
    (v_j4, 'labor',   'Sway Bar Bushing Replacement & Torque Check (Demo)', null, 1, 1900, 40),

    -- JC-000205 (Total = 3000 + 1800 + 1200 = 6,000 PKR)
    (v_j5, 'service', 'Comprehensive 20-Point Pre-Purchase Inspection (Demo)', v_srv_insp, 1, 3000, 10),
    (v_j5, 'labor',   'Electronic Throttle Body Cleaning & Idle Relearn (Demo)', null, 1, 1800, 20),
    (v_j5, 'other',   'Paint Thickness & Chassis Frame Verification Report (Demo)', null, 1, 1200, 30),

    -- JC-000206 (Total = 3500 + 11500 = 15,000 PKR)
    (v_j6, 'service', 'CVT Transmission Fluid Drain & Level Calibration (Demo)', v_srv_trans, 1, 3500, 10),
    (v_j6, 'part',    'Toyota Genuine CVT Fluid FE (4L Metal Can) (Demo)', null, 1, 11500, 20),

    -- JC-000207 (Total = 2500 + 3000 + 1500 = 7,000 PKR)
    (v_j7, 'service', 'Hybrid HV Battery Block Health & Thermal Scan (Demo)', v_srv_elec, 1, 2500, 10),
    (v_j7, 'labor',   'HV Battery Cooling Blower Assembly Disassembly & Cleaning (Demo)', null, 1, 3000, 20),
    (v_j7, 'part',    'HV Intake Dust Filter Screen & Clips (Aqua NHP10) (Demo)', null, 1, 1500, 30),

    -- JC-000208 (Total = 6500 + 9800 + 3200 = 19,500 PKR)
    (v_j8, 'service', 'Timing Cover & Valve Train Inspection Service (Demo)', v_srv_engine, 1, 6500, 10),
    (v_j8, 'part',    'OEM Hydraulic Timing Chain Tensioner Assembly (Demo)', null, 1, 9800, 20),
    (v_j8, 'part',    'Valve Cover Gasket & RTV Sealant Kit (Demo)', null, 1, 3200, 30),

    -- JC-000209 (Total = 6000 + 1500 = 7,500 PKR)
    (v_j9, 'service', 'Rear Bumper Denting & Booth Refinishing Estimate (Demo)', v_srv_dent, 1, 6000, 10),
    (v_j9, 'other',   'Bumper Retainer Clips & Primer Materials (Demo)', null, 1, 1500, 20);

  -- ===========================================================================
  -- 3. INSERT DEMO JOB STATUS HISTORY
  -- ===========================================================================
  insert into public.job_status_history (job_id, from_status, to_status, note, created_at)
  values
    -- JC-000201
    (v_j1, null, 'received', 'Vehicle received at workshop bay reception (Demo)', now() - interval '6 hours'),
    (v_j1, 'received', 'inspection', 'Multi-point brake and fluid inspection completed (Demo)', now() - interval '5 hours'),
    (v_j1, 'inspection', 'awaiting_approval', 'Shared brake pad & rotor skimming estimate with customer (Demo)', now() - interval '4 hours'),
    (v_j1, 'awaiting_approval', 'in_progress', 'Customer approved work; synthetic oil change and brake service started (Demo)', now() - interval '2 hours'),

    -- JC-000202
    (v_j2, null, 'received', 'Vehicle checked in for AC cooling complaint (Demo)', now() - interval '3 hours'),
    (v_j2, 'received', 'inspection', 'Connected AC manifold gauges and cabin thermometer (Demo)', now() - interval '90 minutes'),

    -- JC-000203
    (v_j3, null, 'received', 'Vehicle received with check engine indicator on (Demo)', now() - interval '24 hours'),
    (v_j3, 'received', 'inspection', 'OBD-II diagnostic scan retrieved P0302 misfire & AGS learn needed (Demo)', now() - interval '20 hours'),
    (v_j3, 'inspection', 'awaiting_approval', 'Waiting for customer confirmation on spark plugs and actuator calibration (Demo)', now() - interval '16 hours'),

    -- JC-000204
    (v_j4, null, 'received', 'Vehicle checked in for front suspension noise (Demo)', now() - interval '28 hours'),
    (v_j4, 'received', 'inspection', 'Found worn front stabilizer link rods and toe misalignment (Demo)', now() - interval '26 hours'),
    (v_j4, 'inspection', 'awaiting_approval', 'Estimate approved by customer via phone (Demo)', now() - interval '24 hours'),
    (v_j4, 'awaiting_approval', 'in_progress', 'Link rods replaced and 3D wheel alignment performed (Demo)', now() - interval '8 hours'),
    (v_j4, 'in_progress', 'quality_check', 'Road test over uneven road completed — zero clunking noise (Demo)', now() - interval '3 hours'),
    (v_j4, 'quality_check', 'ready', 'Final wash complete; ready for customer collection (Demo)', now() - interval '1 hour'),

    -- JC-000205
    (v_j5, null, 'received', 'Vehicle received for pre-purchase inspection (Demo)', now() - interval '4 days'),
    (v_j5, 'received', 'inspection', 'Compression, OBD-II, paint gauge, and underbody checks started (Demo)', now() - interval '3 days 22 hours'),
    (v_j5, 'inspection', 'in_progress', 'Throttle body cleaning requested and started (Demo)', now() - interval '3 days 20 hours'),
    (v_j5, 'in_progress', 'quality_check', 'Idle RPM relearn and road test verified (Demo)', now() - interval '3 days 18 hours'),
    (v_j5, 'quality_check', 'ready', 'Inspection report prepared and vehicle ready (Demo)', now() - interval '3 days 16 hours'),
    (v_j5, 'ready', 'delivered', 'Vehicle and inspection report handed over to customer (Demo)', now() - interval '3 days'),

    -- JC-000206
    (v_j6, null, 'received', 'Walk-in check-in for CVT fluid service (Demo)', now() - interval '90 minutes'),

    -- JC-000207
    (v_j7, null, 'received', 'Checked in for hybrid battery cooling maintenance (Demo)', now() - interval '8 hours'),
    (v_j7, 'received', 'inspection', 'Inspected HV blower duct — heavy dust accumulation found (Demo)', now() - interval '6 hours'),
    (v_j7, 'inspection', 'in_progress', 'Cleaned HV blower assembly and installed new intake filter screen (Demo)', now() - interval '3 hours'),
    (v_j7, 'in_progress', 'quality_check', 'Verifying battery block temperatures under load (Demo)', now() - interval '45 minutes'),

    -- JC-000208
    (v_j8, null, 'received', 'Checked in for cold-start engine rattle (Demo)', now() - interval '2 days'),
    (v_j8, 'received', 'inspection', 'Diagnosed worn hydraulic timing chain tensioner ratchet (Demo)', now() - interval '42 hours'),
    (v_j8, 'inspection', 'awaiting_approval', 'Customer approved genuine OEM tensioner replacement (Demo)', now() - interval '38 hours'),
    (v_j8, 'awaiting_approval', 'in_progress', 'Valve cover removed and timing assembly prepped (Demo)', now() - interval '30 hours'),
    (v_j8, 'in_progress', 'on_hold', 'Placed on hold awaiting OEM tensioner dispatch from regional depot (Demo)', now() - interval '18 hours'),

    -- JC-000209
    (v_j9, null, 'received', 'Checked in for rear bumper denting/painting quote (Demo)', now() - interval '5 days'),
    (v_j9, 'received', 'inspection', 'Prepared body shop estimate (Demo)', now() - interval '4 days 20 hours'),
    (v_j9, 'inspection', 'cancelled', 'Cancelled by customer to wait for insurance surveyor first (Demo)', now() - interval '4 days 18 hours');

  -- ===========================================================================
  -- 4. INSERT DEMO JOB NOTES (2 to 4 customer-visible progress notes on active jobs)
  -- ===========================================================================
  insert into public.job_notes (job_id, note, is_customer_visible, created_at)
  values
    -- JC-000201 (3 visible + 1 internal)
    (v_j1, 'Vehicle received on Bay 1. Mileage recorded at 42,500 km. (Demo)', true, now() - interval '5 hours 45 minutes'),
    (v_j1, 'Front brake disc thickness measured within safe spec (24.1 mm); rotor skimming and ceramic pad installation approved. (Demo)', true, now() - interval '3 hours 30 minutes'),
    (v_j1, '5W-30 synthetic oil and genuine filter replaced; brake assembly now being torqued and road-tested. (Demo)', true, now() - interval '1 hour'),
    (v_j1, 'Internal technician note: keep old brake pads in trunk per owner request. (Demo)', false, now() - interval '2 hours'),

    -- JC-000202 (2 visible)
    (v_j2, 'Cabin filter removed and found heavily clogged with dust; replacement recommended. (Demo)', true, now() - interval '2 hours'),
    (v_j2, 'AC low-side and high-side pressures being tested at 2,000 RPM to check compressor efficiency. (Demo)', true, now() - interval '45 minutes'),

    -- JC-000203 (3 visible)
    (v_j3, 'OBD-II diagnostic scan completed: cylinder 2 spark plug gap worn and AGS clutch kiss-point requires calibration. (Demo)', true, now() - interval '20 hours'),
    (v_j3, 'Detailed cost breakdown enabled on your tracking page for review. (Demo)', true, now() - interval '17 hours'),
    (v_j3, 'Please reply on WhatsApp or call the workshop to approve the spark plug replacement so we can proceed. (Demo)', true, now() - interval '15 hours'),

    -- JC-000204 (4 visible)
    (v_j4, 'Underbody inspection confirmed worn ball joints on both front stabilizer link rods. (Demo)', true, now() - interval '25 hours'),
    (v_j4, 'New OEM-grade stabilizer link rods and sway bar bushings installed. (Demo)', true, now() - interval '7 hours'),
    (v_j4, '3D wheel alignment completed — front toe and camber set to factory Kia Sportage AWD specs. (Demo)', true, now() - interval '3 hours'),
    (v_j4, 'Road test and exterior wash complete. Invoice INV-000202 is issued and your vehicle is ready for pickup. (Demo)', true, now() - interval '55 minutes'),

    -- JC-000205 (2 visible)
    (v_j5, 'All 20 pre-purchase inspection points completed; engine compression and chassis frame are clean. (Demo)', true, now() - interval '3 days 17 hours'),
    (v_j5, 'Vehicle delivered with full inspection report. Thank you for choosing Pak Auto Works & Parts! (Demo)', true, now() - interval '3 days'),

    -- JC-000206 (2 visible)
    (v_j6, 'Vehicle logged at reception and assigned to Transmission Bay. (Demo)', true, now() - interval '80 minutes'),
    (v_j6, 'Allowing transmission fluid temperature to cool before drain and level calibration procedure. (Demo)', true, now() - interval '30 minutes'),

    -- JC-000207 (3 visible)
    (v_j7, 'Hybrid battery diagnostic scan shows healthy cell delta voltage; cooling fan duct was 70% blocked by lint. (Demo)', true, now() - interval '5 hours'),
    (v_j7, 'Cooling blower fan blades ultrasonically cleaned and protective intake mesh filter fitted. (Demo)', true, now() - interval '2 hours'),
    (v_j7, 'Running final 20-minute thermal load check before marking ready for pickup. (Demo)', true, now() - interval '30 minutes'),

    -- JC-000208 (3 visible)
    (v_j8, 'Cold-start rattle traced to weak hydraulic pressure in the timing chain tensioner. (Demo)', true, now() - interval '40 hours'),
    (v_j8, 'Genuine Honda timing chain tensioner ordered; vehicle is safely covered inside Bay 3. (Demo)', true, now() - interval '20 hours'),
    (v_j8, 'Expected part arrival is tomorrow morning; we will update your status as soon as reassembly starts. (Demo)', true, now() - interval '12 hours'),

    -- JC-000209 (1 visible)
    (v_j9, 'Job card closed without charges as requested. Feel free to book again once insurance survey is complete. (Demo)', true, now() - interval '4 days 18 hours');

  -- ===========================================================================
  -- 5. INSERT 5 DEMO INVOICES (paid, partially_paid, issued, draft, void)
  -- ===========================================================================

  -- 5.1 INV-000201: PARTIALLY_PAID (for JC-000201 — Subtotal 22,000, Discount 1,000, Total 21,000, Paid 8,000)
  insert into public.invoices (
    id, invoice_no, job_id, status, items_snapshot,
    subtotal, discount, total, amount_paid,
    notes, issued_at, due_date, is_demo
  ) values (
    v_inv_partial,
    'INV-000201',
    v_j1,
    'partially_paid',
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', ji.unit_price,
        'line_total', ji.line_total
      ) order by ji.sort_order asc), '[]'::jsonb)
      from public.job_items ji where ji.job_id = v_j1
    ),
    22000, 1000, 21000, 8000,
    'Advance of Rs. 8,000 received via JazzCash; balance Rs. 13,000 payable upon vehicle pickup. (Demo Invoice)',
    now() - interval '2 hours',
    v_today + 1,
    true
  );

  -- 5.2 INV-000202: ISSUED (for JC-000204 — Subtotal 16,000, Discount 500, Total 15,500, Paid 0)
  insert into public.invoices (
    id, invoice_no, job_id, status, items_snapshot,
    subtotal, discount, total, amount_paid,
    notes, issued_at, due_date, is_demo
  ) values (
    v_inv_issued,
    'INV-000202',
    v_j4,
    'issued',
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', ji.unit_price,
        'line_total', ji.line_total
      ) order by ji.sort_order asc), '[]'::jsonb)
      from public.job_items ji where ji.job_id = v_j4
    ),
    16000, 500, 15500, 0,
    'Includes 3D alignment printout and 15-day suspension torque re-check. (Demo Invoice)',
    now() - interval '1 hour',
    v_today,
    true
  );

  -- 5.3 INV-000203: PAID (for JC-000205 — Subtotal 6,000, Discount 0, Total 6,000, Paid 6,000)
  insert into public.invoices (
    id, invoice_no, job_id, status, items_snapshot,
    subtotal, discount, total, amount_paid,
    notes, issued_at, due_date, is_demo
  ) values (
    v_inv_paid,
    'INV-000203',
    v_j5,
    'paid',
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', ji.unit_price,
        'line_total', ji.line_total
      ) order by ji.sort_order asc), '[]'::jsonb)
      from public.job_items ji where ji.job_id = v_j5
    ),
    6000, 0, 6000, 6000,
    'Paid in full upon vehicle delivery. Thank you! (Demo Invoice)',
    now() - interval '3 days',
    v_today - 3,
    true
  );

  -- 5.4 INV-000204: DRAFT (for JC-000203 — Subtotal 11,300, Discount 0, Total 11,300, Paid 0)
  insert into public.invoices (
    id, invoice_no, job_id, status, items_snapshot,
    subtotal, discount, total, amount_paid,
    notes, issued_at, due_date, is_demo
  ) values (
    v_inv_draft,
    'INV-000204',
    v_j3,
    'draft',
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', ji.unit_price,
        'line_total', ji.line_total
      ) order by ji.sort_order asc), '[]'::jsonb)
      from public.job_items ji where ji.job_id = v_j3
    ),
    11300, 0, 11300, 0,
    'Draft estimate prepared pending customer approval on spark plugs. (Demo Draft Invoice)',
    null,
    v_today + 2,
    true
  );

  -- 5.5 INV-000205: VOID (for JC-000209 — Subtotal 7,500, Discount 0, Total 7,500, Paid 0)
  insert into public.invoices (
    id, invoice_no, job_id, status, items_snapshot,
    subtotal, discount, total, amount_paid,
    notes, issued_at, due_date, is_demo
  ) values (
    v_inv_void,
    'INV-000205',
    v_j9,
    'void',
    (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', ji.unit_price,
        'line_total', ji.line_total
      ) order by ji.sort_order asc), '[]'::jsonb)
      from public.job_items ji where ji.job_id = v_j9
    ),
    7500, 0, 7500, 0,
    '[VOID]: Job cancelled prior to work commencement. (Demo Void Invoice)',
    now() - interval '4 days 19 hours',
    v_today - 4,
    true
  );

  -- ===========================================================================
  -- 6. INSERT DEMO PAYMENTS
  -- ===========================================================================
  insert into public.job_payments (invoice_id, amount, method, reference, paid_at, note)
  values
    -- Partial payment on INV-000201
    (v_inv_partial, 8000, 'jazzcash', 'JC-DEMO-998120', now() - interval '90 minutes', 'Advance payment for parts via JazzCash (Demo)'),
    -- Two payments totaling 6,000 on INV-000203
    (v_inv_paid, 4000, 'cash', 'CASH-REC-205A', now() - interval '3 days 1 hour', 'Cash payment at workshop counter (Demo)'),
    (v_inv_paid, 2000, 'easypaisa', 'EP-DEMO-441092', now() - interval '3 days', 'Remaining balance paid via Easypaisa (Demo)');
end;
$$;

-- =============================================================================
-- 7. VERIFICATION BLOCK (Commented out — run manually to verify counts)
-- =============================================================================
-- select status, count(*) from public.job_cards where is_demo = true group by status order by status;
-- select invoice_no, status, subtotal, discount, total, amount_paid from public.invoices where is_demo = true order by invoice_no;
-- select public.lookup_job_status('JC-000201', '03000000001');
-- select public.lookup_job_status('JC-000204', '03000000004');
