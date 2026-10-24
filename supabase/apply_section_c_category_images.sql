-- =============================================================================
-- PAK AUTO WORKS & PARTS — SECTION C: PARTS STORE CATEGORY IMAGES & SEED
-- =============================================================================
-- Sets official Section C category photos (C1–C16) on public.product_categories.
-- Safe to re-run multiple times (idempotent).
-- =============================================================================

-- 1. Ensure any new category rows exist
insert into public.product_categories (
  slug, name, description, icon, sort_order, is_active, is_demo, image_url
) values
  (
    'tyres-wheels',
    '{"en":"Tyres & Wheels","ur":"ٹائرز اور ویلز","ur-roman":"Tyres & Wheels"}'::jsonb,
    '{"en":"Radial tyres, alloy rims, steel wheels, and accessories.","ur":"معیاری ٹائر، الائے رم اور ویل کے دیگر لوازمات۔","ur-roman":"Radial tyres, alloy rims aur wheel accessories."}'::jsonb,
    'CircleDot', 1, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/ytnfvcA70GNdIDyZfAMq/image.png'
  ),
  (
    'batteries',
    '{"en":"Batteries","ur":"بیٹریاں","ur-roman":"Batteries"}'::jsonb,
    '{"en":"Maintenance-free dry and lead-acid automotive batteries.","ur":"مینٹیننس فری ڈرائی اور تیزاب والی کار بیٹریاں۔","ur-roman":"Maintenance-free dry aur lead-acid car batteries."}'::jsonb,
    'BatteryCharging', 2, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/o3W5EwwTRxsH9rffpR6v/image.png'
  ),
  (
    'oils-lubricants',
    '{"en":"Engine Oil & Fluids","ur":"انجن آئل اور فلوئڈز","ur-roman":"Engine Oil & Fluids"}'::jsonb,
    '{"en":"Fully synthetic motor oils, transmission oils, and coolants.","ur":"سنتھیٹک انجن آئل، گیئر آئل اور کولنٹس۔","ur-roman":"Synthetic engine oil, gear oil aur coolants."}'::jsonb,
    'Droplet', 3, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/Bnh6KN8yADd6hcSesOdk/image.png'
  ),
  (
    'filters',
    '{"en":"Filters","ur":"فلٹرز","ur-roman":"Filters"}'::jsonb,
    '{"en":"Genuine oil, air, AC cabin, and fuel filters.","ur":"اصلی آئل، ایئر، کیبن اور فیول فلٹرز۔","ur-roman":"Asli oil, air, cabin aur fuel filters."}'::jsonb,
    'Filter', 4, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/W2rQDvxbMhm7JcAT4nbG/image.png'
  ),
  (
    'brakes',
    '{"en":"Braking System","ur":"بریکنگ سسٹم","ur-roman":"Braking System"}'::jsonb,
    '{"en":"Ceramic brake pads, ventilated discs, and brake fluids.","ur":"سیرامک بریک پیڈز، بریک ڈسک اور بریک آئل۔","ur-roman":"Ceramic brake pads, brake discs aur brake fluid."}'::jsonb,
    'Disc3', 5, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/98q54OUL7nKF5GujnAhZ/image.png'
  ),
  (
    'electrical-lighting',
    '{"en":"Lighting & Bulbs","ur":"لائٹنگ اور بلب","ur-roman":"Lighting & Bulbs"}'::jsonb,
    '{"en":"LED & halogen bulbs, headlights, fog lamps, and taillights.","ur":"ایل ای ڈی اور ہیلوجن بلب، ہیڈ لائٹس اور فوگ لائٹس۔","ur-roman":"LED aur halogen bulbs, headlights aur fog lights."}'::jsonb,
    'Zap', 6, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/99JTVbuDfcuzyPiokHq5/image.png'
  ),
  (
    'wipers',
    '{"en":"Wipers","ur":"وائپرز","ur-roman":"Wipers"}'::jsonb,
    '{"en":"All-weather silicone and hybrid windscreen wiper blades.","ur":"سلیکون اور ہائبرڈ ونڈ اسکرین وائپر بلیڈز۔","ur-roman":"Silicone aur hybrid windscreen wiper blades."}'::jsonb,
    'Shield', 7, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/VGawU65tPKznMuC0HDo5/image.png'
  ),
  (
    'suspension-steering',
    '{"en":"Suspension & Steering","ur":"سسپنشن اور اسٹیئرنگ","ur-roman":"Suspension & Steering"}'::jsonb,
    '{"en":"Shock absorbers, control arms, ball joints, and tie rods.","ur":"شاک ایبزاربرز، کنٹرول آرمز اور ٹائی راڈ اینڈز۔","ur-roman":"Shock absorbers, control arms aur tie rods."}'::jsonb,
    'Wrench', 8, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/VRctkVPtkhZQtm9LTFNx/image.webp'
  ),
  (
    'ac-cooling',
    '{"en":"AC Parts","ur":"اے سی پارٹس","ur-roman":"AC Parts"}'::jsonb,
    '{"en":"Compressors, condensers, expansion valves, and gas.","ur":"اے سی کمپریسر، کنڈینسر اور ریفریجرینٹ گیس۔","ur-roman":"AC compressors, condensers aur gas."}'::jsonb,
    'Snowflake', 9, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/IpxAx5ArH5Ouc5BLBRt6/image.png'
  ),
  (
    'engine-parts',
    '{"en":"Ignition & Electrical","ur":"اگنیشن اور الیکٹریکل","ur-roman":"Ignition & Electrical"}'::jsonb,
    '{"en":"Spark plugs, ignition coils, sensors, relays, and alternators.","ur":"اسپارک پلگ، اگنیشن کوائلز، سینسرز اور ریلے۔","ur-roman":"Spark plugs, ignition coils, sensors aur relays."}'::jsonb,
    'Cog', 10, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/WFNTPDUDIXM7GYFLZJa7/image.png'
  ),
  (
    'belts-cooling',
    '{"en":"Belts & Cooling","ur":"بیلٹس اور کولنگ","ur-roman":"Belts & Cooling"}'::jsonb,
    '{"en":"Timing belts, serpentine fan belts, water pumps, and radiators.","ur":"ٹائمنگ بیلٹ، فین بیلٹ، واٹر پمپ اور ریڈی ایٹر۔","ur-roman":"Timing belts, fan belts, water pumps aur radiators."}'::jsonb,
    'Cog', 11, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/nFh1IXIrxq8VTMN6YGWu/image.jpg'
  ),
  (
    'exhaust-intake',
    '{"en":"Exhaust & Intake","ur":"ایگزاسٹ اور انٹیک","ur-roman":"Exhaust & Intake"}'::jsonb,
    '{"en":"Exhaust silencers, catalytic converters, and air intake hoses.","ur":"ایگزاسٹ سائلنسر، کیٹلیٹک کنورٹر اور انٹیک ہوز۔","ur-roman":"Exhaust silencer, catalytic converter aur intake pipes."}'::jsonb,
    'Shield', 12, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/UFeavmffaJiDQlmB9lmu/image.webp'
  ),
  (
    'body-exterior-accessories',
    '{"en":"Body & Trim","ur":"باڈی اور ٹرم","ur-roman":"Body & Trim"}'::jsonb,
    '{"en":"Door handles, side mirrors, visors, bumper guards, and trim.","ur":"ڈور ہینڈلز، سائیڈ مررز، ببل وائزرز اور بمپر گارڈز۔","ur-roman":"Door handles, side mirrors aur bumper trim."}'::jsonb,
    'Shield', 13, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/XnNdMfRGwEFdCfnWP0oj/image.png'
  ),
  (
    'seat-covers-mats',
    '{"en":"Seat Covers & Mats","ur":"سیٹ کورز اور میٹس","ur-roman":"Seat Covers & Mats"}'::jsonb,
    '{"en":"Custom fit seat covers, 7D floor mats, and trunk trays.","ur":"کسٹم سیٹ کورز، 7D فلور میٹس اور ڈگی ٹرے۔","ur-roman":"Custom seat covers, 7D floor mats aur trunk liners."}'::jsonb,
    'Armchair', 14, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/2z20LsklqwlO39dSpX53/image.png'
  ),
  (
    'tools-equipment',
    '{"en":"Tools & Equipment","ur":"اوزار اور آلات","ur-roman":"Tools & Equipment"}'::jsonb,
    '{"en":"Hydraulic bottle jacks, socket sets, tyre inflators, and wrenches.","ur":"ہائیڈرولک جیک، اسپیڈ پمپ، ٹائر پریشر گیج اور ٹول سیٹس۔","ur-roman":"Hydraulic jacks, tyre inflators aur tool sets."}'::jsonb,
    'Wrench', 15, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/ITol4athZdM3YPigZ8Uh/image.png'
  ),
  (
    'interior-car-care',
    '{"en":"Car Care & Accessories","ur":"کار کیئر اور لوازمات","ur-roman":"Car Care & Accessories"}'::jsonb,
    '{"en":"Ceramic shampoo, dashboard polish, microfiber cloths, and fresheners.","ur":"کار شیمپو، ڈیش بورڈ پالش، مائیکرو فائبر اور ایئر فریشنرز۔","ur-roman":"Car shampoo, dashboard polish aur air fresheners."}'::jsonb,
    'Sparkles', 16, true, false,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/P0MbpOozfG0KF1lCnECW/image.png'
  )
on conflict (slug) do update set
  image_url = excluded.image_url,
  updated_at = now();

-- 2. Explicitly update existing slugs in case name/slug variations exist
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/ytnfvcA70GNdIDyZfAMq/image.png' where slug = 'tyres-wheels';
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/o3W5EwwTRxsH9rffpR6v/image.png' where slug = 'batteries';
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/Bnh6KN8yADd6hcSesOdk/image.png' where slug in ('oils-lubricants', 'engine-oil-fluids');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/W2rQDvxbMhm7JcAT4nbG/image.png' where slug = 'filters';
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/98q54OUL7nKF5GujnAhZ/image.png' where slug in ('brakes', 'braking-system');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/99JTVbuDfcuzyPiokHq5/image.png' where slug in ('electrical-lighting', 'lighting-bulbs');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/VRctkVPtkhZQtm9LTFNx/image.webp' where slug = 'suspension-steering';
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/IpxAx5ArH5Ouc5BLBRt6/image.png' where slug in ('ac-cooling', 'ac-parts');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/WFNTPDUDIXM7GYFLZJa7/image.png' where slug in ('engine-parts', 'ignition-electrical');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/XnNdMfRGwEFdCfnWP0oj/image.png' where slug in ('body-exterior-accessories', 'body-trim');
update public.product_categories set image_url = 'https://plain-eeur-prod-public.komododecks.com/202610/14/P0MbpOozfG0KF1lCnECW/image.png' where slug in ('interior-car-care', 'car-care-accessories');
