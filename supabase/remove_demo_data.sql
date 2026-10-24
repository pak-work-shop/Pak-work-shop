-- =============================================================================
-- PAK AUTO WORKS & PARTS — ONE-STEP DEMO DATA REMOVAL SCRIPT
-- =============================================================================
-- Run this script in the Supabase SQL Editor when switching from Demo Mode
-- to real workshop operations.
--
-- What this script does:
--   1. Deletes all demo products, demo brands, and demo categories (is_demo = true)
--      — cascades to product_images, product_vehicles, product_services, and stock_movements.
--   2. Deletes all demo invoices and demo job cards (is_demo = true) — cascades to
--      job_items, job_status_history, and invoice_payments.
--   3. Deletes all demo bookings (is_demo = true) — cascades to booking_services
--      and booking_status_history.
--   4. Deletes all demo blocked slots (is_demo = true).
--   5. Deletes all demo contact messages (is_demo = true).
--   6. Resets services' price_from, price_to, price_note, estimated_time, and
--      image_url on public.services ONLY where they still equal the demo values.
--   7. Resets site_settings fields (address, about_title, about_body,
--      working_hours, announcement, hero/about/cta/og image URLs) ONLY where
--      they still equal the demo values, and sets demo_mode = false.
-- =============================================================================

-- 0. Remove Phase 6 demo orders & coupons and Phase 5 demo catalogue data
  if to_regclass('public.chat_messages') is not null then
    delete from public.chat_messages where session_id in (select id from public.chat_sessions where is_demo = true);
  end if;

  if to_regclass('public.chat_sessions') is not null then
    delete from public.chat_sessions where is_demo = true;
  end if;

  if to_regclass('public.chatbot_knowledge') is not null then
    delete from public.chatbot_knowledge where is_demo = true;
  end if;

  if to_regclass('public.blog_posts') is not null then
    delete from public.blog_posts where is_demo = true;
  end if;

  if to_regclass('public.reviews') is not null then
    delete from public.reviews where is_demo = true;
  end if;

  if to_regclass('public.gallery_items') is not null then
    delete from public.gallery_items where is_demo = true;
  end if;

  if to_regclass('public.payments') is not null then
    delete from public.payment_logs where payment_id in (select id from public.payments where is_demo = true);
    delete from public.payments where is_demo = true;
  end if;

  if to_regclass('public.payment_accounts') is not null then
    delete from public.payment_accounts where is_demo = true;
  end if;

  if to_regclass('public.orders') is not null then
    -- Deleting demo orders cascades to order_items and order_status_history
    delete from public.orders where is_demo = true;
  end if;

  if to_regclass('public.coupons') is not null then
    delete from public.coupons where is_demo = true;
  end if;

  if to_regclass('public.products') is not null then
    -- Deleting demo products cascades to product_images, product_vehicles,
    -- product_services, and stock_movements
    delete from public.products where is_demo = true;
  end if;

  if to_regclass('public.brands') is not null then
    delete from public.brands where is_demo = true;
  end if;

  if to_regclass('public.product_categories') is not null then
    delete from public.product_categories where is_demo = true;
  end if;

  if to_regclass('public.invoices') is not null then
    delete from public.invoices where is_demo = true;
  end if;

  if to_regclass('public.job_cards') is not null then
    delete from public.job_cards where is_demo = true;
  end if;
end;
$$;

-- 1. Remove demo bookings (cascades to booking_services & booking_status_history)
delete from public.bookings
where is_demo = true;

-- 2. Remove demo blocked slots
delete from public.blocked_slots
where is_demo = true;

-- 3. Remove demo contact messages
delete from public.contact_messages
where is_demo = true;

-- 4. Reset services' price_from, price_to, price_note, estimated_time, and image_url
--    ONLY where they still equal the demo values
with demo_services (slug, price_from, price_to, est_en, est_ur, est_roman) as (
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
  price_from = case
    when s.price_from = d.price_from
      then null
    else s.price_from
  end,
  price_to = case
    when s.price_to = d.price_to
      then null
    else s.price_to
  end,
  price_note = case
    when s.price_note->>'en' like 'Sample estimate%'
      then null
    else s.price_note
  end,
  estimated_time = case
    when s.estimated_time = jsonb_build_object('en', d.est_en, 'ur', d.est_ur, 'ur-roman', d.est_roman)
      then null
    else s.estimated_time
  end,
  image_url = case
    when s.image_url like '/demo/%'
      then ''
    else s.image_url
  end
from demo_services d
where s.slug = d.slug;

-- 5. Reset site_settings demo fields ONLY where they still equal the demo seed values
update public.site_settings
set
  demo_mode = false,
  address = case
    when address = jsonb_build_object(
      'en', 'Main Bazaar, Sadiqabad (Demo)',
      'ur', 'مین بازار، صادق آباد (ڈیمو)',
      'ur-roman', 'Main Bazaar, Sadiqabad (Demo)'
    ) or address->>'en' = 'Main Bazaar, Sadiqabad (Demo)'
      then '{"en": "", "ur": "", "ur-roman": ""}'::jsonb
    else address
  end,
  working_hours = case
    when working_hours = jsonb_build_object(
      'monday',    jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'tuesday',   jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'wednesday', jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'thursday',  jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'friday',    jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'saturday',  jsonb_build_object('isOpen', true,  'openTime', '09:00', 'closeTime', '18:00'),
      'sunday',    jsonb_build_object('isOpen', false, 'openTime', '10:00', 'closeTime', '18:00')
    )
      then '{}'::jsonb
    else working_hours
  end,
  about_title = case
    when about_title->>'en' = 'Dependable Car Care & Genuine Auto Parts Under One Roof'
      then '{"en": "", "ur": "", "ur-roman": ""}'::jsonb
    else about_title
  end,
  about_body = case
    when about_body->>'en' like '## Built for Everyday Drivers in Pakistan%'
      then '{"en": "", "ur": "", "ur-roman": ""}'::jsonb
    else about_body
  end,
  announcement_enabled = case
    when announcement->>'en' like '%(Demo Mode)%'
      then false
    else announcement_enabled
  end,
  announcement = case
    when announcement->>'en' like '%(Demo Mode)%'
      then '{"en": "", "ur": "", "ur-roman": ""}'::jsonb
    else announcement
  end,
  hero_image_url = case
    when hero_image_url like '/demo/%' then ''
    else hero_image_url
  end,
  about_image_url = case
    when about_image_url like '/demo/%' then ''
    else about_image_url
  end,
  cta_banner_url = case
    when cta_banner_url like '/demo/%' then ''
    else cta_banner_url
  end,
  og_image_url = case
    when og_image_url like '/demo/%' then ''
    else og_image_url
  end
where id = 1;
