-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 5 DEMO DATA (PARTS & ACCESSORIES CATALOGUE)
-- =============================================================================
-- Content Pack: 16 Categories, 15 Fictional Brands, 48 Products.
-- Runs ONLY if public.site_settings.demo_mode = true.
-- Safe to re-run multiple times (idempotent via upserts and slug/sku matching).
-- =============================================================================

do $$
declare
  v_demo_mode boolean := false;

  -- 16 Category IDs
  v_cat_tyres uuid;
  v_cat_batteries uuid;
  v_cat_oils uuid;
  v_cat_filters uuid;
  v_cat_brakes uuid;
  v_cat_lighting uuid;
  v_cat_wipers uuid;
  v_cat_suspension uuid;
  v_cat_ac uuid;
  v_cat_ignition uuid;
  v_cat_belts uuid;
  v_cat_exhaust uuid;
  v_cat_body uuid;
  v_cat_seatcovers uuid;
  v_cat_tools uuid;
  v_cat_carcare uuid;

  -- 15 Brand IDs
  v_brand_roadmax uuid;
  v_brand_griptech uuid;
  v_brand_powercell uuid;
  v_brand_ecolube uuid;
  v_brand_airpure uuid;
  v_brand_stopwell uuid;
  v_brand_clearview uuid;
  v_brand_coolflow uuid;
  v_brand_torqueworks uuid;
  v_brand_voltedge uuid;
  v_brand_flexdrive uuid;
  v_brand_silentflow uuid;
  v_brand_bodycraft uuid;
  v_brand_shinepro uuid;
  v_brand_cozyride uuid;

  v_prod_id uuid;
begin
  select coalesce(demo_mode, false)
  into v_demo_mode
  from public.site_settings
  where id = 1;

  if not coalesce(v_demo_mode, false) then
    raise notice 'Skipping Phase 5 demo catalogue data because site_settings.demo_mode is false.';
    return;
  end if;

  -- ---------------------------------------------------------------------------
  -- 1. Ensure all 16 Categories exist with trilingual metadata & correct sort orders
  -- ---------------------------------------------------------------------------
  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('tyres-wheels', '{"en":"Tyres & Wheels","ur":"ٹائرز اور ویلز","ur-roman":"Tyres & Wheels"}'::jsonb, '{"en":"Passenger car radial tyres, alloy rims, steel wheels, and tyre accessories.","ur":"گاڑیوں کے ریڈیل ٹائرز، الائے رِمز، اسٹیل ویلز اور ٹائر کے لوازمات۔","ur-roman":"Gaariyon ke radial tyres, alloy rims, steel wheels aur tyre accessories."}'::jsonb, 'CircleDot', 1, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('batteries', '{"en":"Batteries","ur":"بیٹریاں","ur-roman":"Batteries"}'::jsonb, '{"en":"Maintenance-free dry and lead-acid automotive batteries and terminal hardware.","ur":"مینٹیننس فری ڈرائی اور روایتی کار بیٹریاں اور ٹرمینل پرزے۔","ur-roman":"Maintenance-free dry aur car batteries aur terminal hardware."}'::jsonb, 'BatteryCharging', 2, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('oils-lubricants', '{"en":"Engine Oil & Fluids","ur":"انجن آئل اور فلوئڈز","ur-roman":"Engine Oil & Fluids"}'::jsonb, '{"en":"Synthetic and semi-synthetic motor oils, transmission fluids, and radiator coolants.","ur":"سنتھیٹک اور سیمی سنتھیٹک انجن آئل، ٹرانسمیشن فلوئڈز اور کولنٹس۔","ur-roman":"Synthetic aur semi-synthetic engine oil, transmission fluids aur coolants."}'::jsonb, 'Droplet', 3, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('filters', '{"en":"Filters","ur":"فلٹرز","ur-roman":"Filters"}'::jsonb, '{"en":"Engine oil filters, air filter elements, AC cabin filters, and fuel filters.","ur":"انجن آئل فلٹرز، ایئر فلٹر ایلیمنٹس، اے سی کیبن فلٹرز اور فیول فلٹرز۔","ur-roman":"Engine oil filters, air filter elements, AC cabin filters aur fuel filters."}'::jsonb, 'Filter', 4, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('brakes', '{"en":"Braking System","ur":"بریکنگ سسٹم","ur-roman":"Braking System"}'::jsonb, '{"en":"Front brake pad sets, rear brake shoe sets, brake discs, and hydraulic fluids.","ur":"فرنٹ بریک پیڈ سیٹ، ریئر بریک شو سیٹ، بریک ڈسک اور بریک آئل۔","ur-roman":"Front brake pad sets, rear brake shoe sets, brake discs aur brake oil."}'::jsonb, 'Disc3', 5, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('electrical-lighting', '{"en":"Lighting & Bulbs","ur":"لائٹنگ اور بلب","ur-roman":"Lighting & Bulbs"}'::jsonb, '{"en":"Halogen headlight bulbs, LED conversion kits, and vehicle tail light assemblies.","ur":"ہیلوجن ہیڈ لائٹ بلب، ایل ای ڈی کٹس اور پچھلی لائٹس کی اسمبلیاں۔","ur-roman":"Halogen headlight bulbs, LED kits aur tail light assemblies."}'::jsonb, 'Zap', 6, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('wipers', '{"en":"Wipers","ur":"وائپرز","ur-roman":"Wipers"}'::jsonb, '{"en":"Flat wiper blades, paired windscreen wiper sets, and washer fluids.","ur":"فلیٹ وائپر بلیڈز، ونڈ اسکرین وائپر پیئرز اور ونڈ شیلڈ واشر فلوئڈ۔","ur-roman":"Flat wiper blades, windscreen wiper pairs aur washer fluids."}'::jsonb, 'Shield', 7, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('suspension-steering', '{"en":"Suspension & Steering","ur":"سسپنشن اور اسٹیئرنگ","ur-roman":"Suspension & Steering"}'::jsonb, '{"en":"Shock absorbers, sway bar stabilizer links, and steering tie rod ends.","ur":"شاک ایبزاربرز، اسٹیبلائزر لنکس اور اسٹیئرنگ ٹائی راڈ اینڈز۔","ur-roman":"Shock absorbers, stabilizer links aur tie rod ends."}'::jsonb, 'Wrench', 8, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('ac-cooling', '{"en":"AC Parts","ur":"اے سی پارٹس","ur-roman":"AC Parts"}'::jsonb, '{"en":"Automotive air conditioning refill kits, condenser fan motors, and cabin blowers.","ur":"گاڑیوں کے اے سی ری فل کٹس، کنڈینسر فین موٹرز اور کیبن بلور موٹرز۔","ur-roman":"Car AC refill kits, condenser fan motors aur cabin blower motors."}'::jsonb, 'Snowflake', 9, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('engine-parts', '{"en":"Ignition & Electrical","ur":"اگنیشن اور الیکٹریکل","ur-roman":"Ignition & Electrical"}'::jsonb, '{"en":"Iridium spark plug sets, ignition coils, relays, and fuse assortment kits.","ur":"اسپارک پلگ سیٹس، اگنیشن کوائلز، ریلے اور فیوز کٹس۔","ur-roman":"Spark plug sets, ignition coils, relays aur fuse kits."}'::jsonb, 'Cog', 10, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('belts-cooling', '{"en":"Belts & Cooling","ur":"بیلٹس اور کولنگ","ur-roman":"Belts & Cooling"}'::jsonb, '{"en":"Engine timing belt kits, serpentine drive belts, and cooling thermostats with gaskets.","ur":"انجن ٹائمنگ بیلٹ کٹس، ڈرائیو بیلٹس اور تھرموسٹیٹ والوز بمعہ گیسکٹ۔","ur-roman":"Engine timing belt kits, drive belts aur thermostats with gaskets."}'::jsonb, 'Cog', 11, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('exhaust-intake', '{"en":"Exhaust & Intake","ur":"ایگزاسٹ اور انٹیک","ur-roman":"Exhaust & Intake"}'::jsonb, '{"en":"Rear silencer mufflers, flexible exhaust pipes, and oxygen exhaust sensors.","ur":"ریئر سائلنسرز، فلیکسیبل ایگزاسٹ پائپ اور آکسیجن سینسرز۔","ur-roman":"Rear silencer mufflers, flexible exhaust pipes aur oxygen sensors."}'::jsonb, 'Shield', 12, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('body-exterior-accessories', '{"en":"Body & Trim","ur":"باڈی اور ٹرم","ur-roman":"Body & Trim"}'::jsonb, '{"en":"Manual side mirrors, protective mud flap sets, and chrome door handle covers.","ur":"سائیڈ مررز، حفاظتی مڈ فلیپ سیٹ اور کروم ڈور ہینڈل کورز۔","ur-roman":"Side mirrors, mud flap sets aur chrome door handle covers."}'::jsonb, 'Shield', 13, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('seat-covers-mats', '{"en":"Seat Covers & Mats","ur":"سیٹ کورز اور میٹس","ur-roman":"Seat Covers & Mats"}'::jsonb, '{"en":"Fitted leatherette seat cover sets, all-weather rubber floor mats, and steering wheel covers.","ur":"لیدرٹ سیٹ کور سیٹ، ربر فلور میٹس اور اسٹیرنگ ویل کورز۔","ur-roman":"Leatherette seat cover sets, rubber floor mats aur steering wheel covers."}'::jsonb, 'Armchair', 14, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('tools-equipment', '{"en":"Tools & Equipment","ur":"اوزار اور آلات","ur-roman":"Tools & Equipment"}'::jsonb, '{"en":"Mechanic socket sets, hydraulic floor jacks, and portable 12V tyre inflators.","ur":"میکینک ساکٹ سیٹس، ہائیڈرولک فلور جیکس اور پورٹیبل 12 وولٹ ٹائر انفلریٹرز۔","ur-roman":"Mechanic socket sets, hydraulic floor jacks aur portable tyre inflators."}'::jsonb, 'Wrench', 15, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  insert into public.product_categories (slug, name, description, icon, sort_order, is_active, is_demo)
  values ('interior-car-care', '{"en":"Car Care & Accessories","ur":"کار کیئر اور لوازمات","ur-roman":"Car Care & Accessories"}'::jsonb, '{"en":"Automotive wash shampoos, interior dashboard polish, and microfiber cleaning cloth packs.","ur":"کار شیمپو، اندرونی ڈیش بورڈ پالش اور مائیکرو فائبر کلیننگ کپڑے کے پیک۔","ur-roman":"Car wash shampoo, dashboard polish aur microfiber cloth packs."}'::jsonb, 'Sparkles', 16, true, false)
  on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

  -- Category ID lookups
  select id into v_cat_tyres from public.product_categories where slug = 'tyres-wheels';
  select id into v_cat_batteries from public.product_categories where slug = 'batteries';
  select id into v_cat_oils from public.product_categories where slug = 'oils-lubricants';
  select id into v_cat_filters from public.product_categories where slug = 'filters';
  select id into v_cat_brakes from public.product_categories where slug = 'brakes';
  select id into v_cat_lighting from public.product_categories where slug = 'electrical-lighting';
  select id into v_cat_wipers from public.product_categories where slug = 'wipers';
  select id into v_cat_suspension from public.product_categories where slug = 'suspension-steering';
  select id into v_cat_ac from public.product_categories where slug = 'ac-cooling';
  select id into v_cat_ignition from public.product_categories where slug = 'engine-parts';
  select id into v_cat_belts from public.product_categories where slug = 'belts-cooling';
  select id into v_cat_exhaust from public.product_categories where slug = 'exhaust-intake';
  select id into v_cat_body from public.product_categories where slug = 'body-exterior-accessories';
  select id into v_cat_seatcovers from public.product_categories where slug = 'seat-covers-mats';
  select id into v_cat_tools from public.product_categories where slug = 'tools-equipment';
  select id into v_cat_carcare from public.product_categories where slug = 'interior-car-care';

  -- ---------------------------------------------------------------------------
  -- 2. Clean up old real-name demo products and brands before seeding fictional ones
  -- ---------------------------------------------------------------------------
  delete from public.products
  where is_demo = true
    and (sku not like 'DEMO-%' or sku in (
      'PAW-OIL-001', 'PAW-OIL-002', 'PAW-FLT-001', 'PAW-FLT-002', 'PAW-FLT-005', 'PAW-FLT-009',
      'PAW-BRK-001', 'PAW-BRK-002', 'PAW-SPK-001', 'PAW-IGN-001', 'PAW-BELT-001', 'PAW-SHK-001',
      'PAW-LUB-001', 'DEMO-P01', 'DEMO-P02', 'DEMO-P03', 'DEMO-P04', 'DEMO-P05'
    ) or slug in (
      'ngk-laser-iridium-spark-plug-set-4pc', 'toyota-genuine-engine-mount-rh-corolla',
      'denso-ignition-coil-suzuki-r06a-k10b', 'shell-helix-ultra-5w40-fully-synthetic-4l',
      'toyota-genuine-motor-oil-0w20-sp-4l', 'honda-genuine-cvtf-transmission-fluid-4l',
      'toyota-genuine-oil-filter-90915-yzze1', 'guard-engine-air-filter-honda-civic-x',
      'denso-carbon-cabin-ac-filter-toyota-suzuki', 'toyota-genuine-front-ceramic-brake-pads-corolla-yaris',
      'honda-genuine-front-brake-disc-rotors-pair-city-civic', 'suzuki-genuine-front-control-arm-chimta-pair-alto-wagonr',
      'denso-jhorn-power-tone-waterproof-horn-pair-12v', 'denso-multi-flow-ac-condenser-toyota-corolla',
      'toyota-genuine-super-long-life-pink-coolant-4l', 'denso-hybrid-graphite-wiper-blade-pair-universal'
    ));

  delete from public.brands
  where is_demo = true
    and slug in (
      'toyota-genuine', 'honda-genuine', 'suzuki-genuine', 'denso', 'ngk',
      'kyb', 'ags-batteries', 'shell-helix', 'guard-filters', 'general-tyre'
    );

  -- ---------------------------------------------------------------------------
  -- 3. Seed 15 Fictional Brands (is_demo = true)
  -- ---------------------------------------------------------------------------
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('roadmax', 'RoadMax', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('griptech', 'GripTech', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('powercell', 'PowerCell', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('ecolube', 'EcoLube', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('airpure', 'AirPure', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('stopwell', 'StopWell', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('clearview', 'ClearView', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('coolflow', 'CoolFlow', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('torqueworks', 'TorqueWorks', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('voltedge', 'VoltEdge', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('flexdrive', 'FlexDrive', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('silentflow', 'SilentFlow', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('bodycraft', 'BodyCraft', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('shinepro', 'ShinePro', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;
  insert into public.brands (slug, name, logo_url, is_active, is_demo)
  values ('cozyride', 'CozyRide', null, true, true)
  on conflict (slug) do update set name = excluded.name, is_active = true, is_demo = true;

  select id into v_brand_roadmax from public.brands where slug = 'roadmax';
  select id into v_brand_griptech from public.brands where slug = 'griptech';
  select id into v_brand_powercell from public.brands where slug = 'powercell';
  select id into v_brand_ecolube from public.brands where slug = 'ecolube';
  select id into v_brand_airpure from public.brands where slug = 'airpure';
  select id into v_brand_stopwell from public.brands where slug = 'stopwell';
  select id into v_brand_clearview from public.brands where slug = 'clearview';
  select id into v_brand_coolflow from public.brands where slug = 'coolflow';
  select id into v_brand_torqueworks from public.brands where slug = 'torqueworks';
  select id into v_brand_voltedge from public.brands where slug = 'voltedge';
  select id into v_brand_flexdrive from public.brands where slug = 'flexdrive';
  select id into v_brand_silentflow from public.brands where slug = 'silentflow';
  select id into v_brand_bodycraft from public.brands where slug = 'bodycraft';
  select id into v_brand_shinepro from public.brands where slug = 'shinepro';
  select id into v_brand_cozyride from public.brands where slug = 'cozyride';

  -- ---------------------------------------------------------------------------
  -- 4. Seed 48 Products (SKU DEMO-..., Trilingual Names, Descriptions, Specs)
  -- ---------------------------------------------------------------------------
  -- Product DEMO-TYR-01: RoadMax Comfort 185/65 R15 Tyre
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TYR-01',
    'roadmax-comfort-185-65-r15-tyre',
    '{"en":"RoadMax Comfort 185/65 R15 Tyre","ur":"روڈ میکس کمفرٹ 185/65 R15 ٹائر","ur-roman":"RoadMax Comfort 185/65 R15 Tyre"}'::jsonb,
    '{"en":"Passenger car radial tyre engineered for daily highway and urban commutes with balanced tread life.","ur":"روزمرہ ڈرائیونگ اور ہائی وے کے لیے متوازن ٹریڈ لائف والا ریڈیل ٹائر۔","ur-roman":"Rozmarrah driving aur highway ke liye balanced tread life wala radial tyre."}'::jsonb,
    '{"en":"Passenger car radial tyre engineered for daily highway and urban commutes with balanced tread life.","ur":"روزمرہ ڈرائیونگ اور ہائی وے کے لیے متوازن ٹریڈ لائف والا ریڈیل ٹائر۔","ur-roman":"Rozmarrah driving aur highway ke liye balanced tread life wala radial tyre."}'::jsonb,
    '[{"label":{"en":"Size","ur":"سائز","ur-roman":"Size"},"value":{"en":"185/65 R15","ur":"185/65 R15","ur-roman":"185/65 R15"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Comfort touring","ur":"کمفرٹ ٹورنگ","ur-roman":"Comfort touring"}},{"label":{"en":"Use","ur":"استعمال","ur-roman":"Use"},"value":{"en":"Passenger car","ur":"پیسنجر کار","ur-roman":"Passenger car"}}]'::jsonb,
    v_cat_tyres,
    v_brand_roadmax,
    'aftermarket',
    14500,
    null,
    24,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 24, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-TYR-02: GripTech Sport 205/55 R16 Tyre
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TYR-02',
    'griptech-sport-205-55-r16-tyre',
    '{"en":"GripTech Sport 205/55 R16 Tyre","ur":"گرپ ٹیک اسپورٹ 205/55 R16 ٹائر","ur-roman":"GripTech Sport 205/55 R16 Tyre"}'::jsonb,
    '{"en":"Wide contact pattern tyre providing responsive cornering control and firm dry road grip.","ur":"موڑ کاٹنے میں مستحکم کنٹرول اور خشک سڑکوں پر مضبوط گرفت فراہم کرنے والا ٹائر۔","ur-roman":"Cornering control aur khushk sarak par mazboot grip faraham karne wala tyre."}'::jsonb,
    '{"en":"Wide contact pattern tyre providing responsive cornering control and firm dry road grip.","ur":"موڑ کاٹنے میں مستحکم کنٹرول اور خشک سڑکوں پر مضبوط گرفت فراہم کرنے والا ٹائر۔","ur-roman":"Cornering control aur khushk sarak par mazboot grip faraham karne wala tyre."}'::jsonb,
    '[{"label":{"en":"Size","ur":"سائز","ur-roman":"Size"},"value":{"en":"205/55 R16","ur":"205/55 R16","ur-roman":"205/55 R16"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Sport touring","ur":"اسپورٹ ٹورنگ","ur-roman":"Sport touring"}},{"label":{"en":"Use","ur":"استعمال","ur-roman":"Use"},"value":{"en":"Passenger car","ur":"پیسنجر کار","ur-roman":"Passenger car"}}]'::jsonb,
    v_cat_tyres,
    v_brand_griptech,
    'aftermarket',
    16500,
    17800,
    12,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 12, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-TYR-03: RoadMax Chrome Wheel Nut Set (20 pcs)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TYR-03',
    'roadmax-chrome-wheel-nut-set-20-pcs',
    '{"en":"RoadMax Chrome Wheel Nut Set (20 pcs)","ur":"روڈ میکس کروم ویل نٹ سیٹ (20 عدد)","ur-roman":"RoadMax Chrome Wheel Nut Set (20 pcs)"}'::jsonb,
    '{"en":"Triple-plated chrome wheel lug nut pack suitable for aftermarket alloy and steel wheels.","ur":"الائے رمز اور اسٹیل پہیوں کے لیے ٹرپل پلیٹڈ کروم نٹس کا مکمل سیٹ۔","ur-roman":"Alloy rims aur steel wheels ke liye triple-plated chrome nuts ka mukammal set."}'::jsonb,
    '{"en":"Triple-plated chrome wheel lug nut pack suitable for aftermarket alloy and steel wheels.","ur":"الائے رمز اور اسٹیل پہیوں کے لیے ٹرپل پلیٹڈ کروم نٹس کا مکمل سیٹ۔","ur-roman":"Alloy rims aur steel wheels ke liye triple-plated chrome nuts ka mukammal set."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"20","ur":"20","ur-roman":"20"}},{"label":{"en":"Finish","ur":"فنش","ur-roman":"Finish"},"value":{"en":"Chrome","ur":"کروم","ur-roman":"Chrome"}},{"label":{"en":"Includes","ur":"شامل ہے","ur-roman":"Includes"},"value":{"en":"Wheel nut wrench","ur":"ویل نٹ رینچ","ur-roman":"Wheel nut wrench"}}]'::jsonb,
    v_cat_tyres,
    v_brand_roadmax,
    'aftermarket',
    2400,
    null,
    40,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 40, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-BAT-01: PowerCell 12V 45Ah Maintenance-Free Battery
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BAT-01',
    'powercell-12v-45ah-maintenance-free-battery',
    '{"en":"PowerCell 12V 45Ah Maintenance-Free Battery","ur":"پاور سیل 12V 45Ah مینٹیننس فری بیٹری","ur-roman":"PowerCell 12V 45Ah Maintenance-Free Battery"}'::jsonb,
    '{"en":"Sealed starter battery for small cars with consistent cold crank and zero top-up requirements.","ur":"چھوٹی گاڑیوں کے لیے سیل شدہ اسٹارٹر بیٹری جس میں پانی ڈالنے کی ضرورت نہیں ہوتی۔","ur-roman":"Chhoti gaariyon ke liye sealed starter battery jisme paani daalne ki zaroorat nahi."}'::jsonb,
    '{"en":"Sealed starter battery for small cars with consistent cold crank and zero top-up requirements.","ur":"چھوٹی گاڑیوں کے لیے سیل شدہ اسٹارٹر بیٹری جس میں پانی ڈالنے کی ضرورت نہیں ہوتی۔","ur-roman":"Chhoti gaariyon ke liye sealed starter battery jisme paani daalne ki zaroorat nahi."}'::jsonb,
    '[{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}},{"label":{"en":"Capacity","ur":"گنجائش","ur-roman":"Capacity"},"value":{"en":"45Ah","ur":"45 ایمپیئر گھنٹہ","ur-roman":"45Ah"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Maintenance-free","ur":"مینٹیننس فری","ur-roman":"Maintenance-free"}}]'::jsonb,
    v_cat_batteries,
    v_brand_powercell,
    'aftermarket',
    13500,
    null,
    15,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 15, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'H'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BAT-02: PowerCell 12V 65Ah Maintenance-Free Battery
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BAT-02',
    'powercell-12v-65ah-maintenance-free-battery',
    '{"en":"PowerCell 12V 65Ah Maintenance-Free Battery","ur":"پاور سیل 12V 65Ah مینٹیننس فری بیٹری","ur-roman":"PowerCell 12V 65Ah Maintenance-Free Battery"}'::jsonb,
    '{"en":"High reserve capacity maintenance-free battery suited for modern sedans with electronic accessories.","ur":"اضافی الیکٹرانک لوازمات رکھنے والی سیڈان گاڑیوں کے لیے زیادہ گنجائش والی بیٹری۔","ur-roman":"Electronic accessories wali modern sedan gaariyon ke liye high capacity battery."}'::jsonb,
    '{"en":"High reserve capacity maintenance-free battery suited for modern sedans with electronic accessories.","ur":"اضافی الیکٹرانک لوازمات رکھنے والی سیڈان گاڑیوں کے لیے زیادہ گنجائش والی بیٹری۔","ur-roman":"Electronic accessories wali modern sedan gaariyon ke liye high capacity battery."}'::jsonb,
    '[{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}},{"label":{"en":"Capacity","ur":"گنجائش","ur-roman":"Capacity"},"value":{"en":"65Ah","ur":"65 ایمپیئر گھنٹہ","ur-roman":"65Ah"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Maintenance-free","ur":"مینٹیننس فری","ur-roman":"Maintenance-free"}}]'::jsonb,
    v_cat_batteries,
    v_brand_powercell,
    'aftermarket',
    18900,
    19800,
    9,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 9, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-BAT-03: PowerCell Terminal Clamp Pair + Anti-Corrosion Spray
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BAT-03',
    'powercell-terminal-clamp-pair-anti-corrosion-spray',
    '{"en":"PowerCell Terminal Clamp Pair + Anti-Corrosion Spray","ur":"پاور سیل ٹرمینل کلیمپ جوڑا اور اینٹی کروشن اسپرے","ur-roman":"PowerCell Terminal Clamp Pair + Anti-Corrosion Spray"}'::jsonb,
    '{"en":"Heavy brass battery post clamps paired with protective grease aerosol for clean terminal contacts.","ur":"بیٹری کھمبوں پر زنگ سے بچاؤ اور صاف کرنٹ بہاؤ کے لیے براس کلیمپ اور حفاظتی اسپرے۔","ur-roman":"Battery terminals par zang se hifazat aur clean current contact ke liye brass clamps."}'::jsonb,
    '{"en":"Heavy brass battery post clamps paired with protective grease aerosol for clean terminal contacts.","ur":"بیٹری کھمبوں پر زنگ سے بچاؤ اور صاف کرنٹ بہاؤ کے لیے براس کلیمپ اور حفاظتی اسپرے۔","ur-roman":"Battery terminals par zang se hifazat aur clean current contact ke liye brass clamps."}'::jsonb,
    '[{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"2 terminal clamps and 1 anti-corrosion spray","ur":"2 ٹرمینل کلیمپ اور 1 اینٹی کروشن اسپرے","ur-roman":"2 terminal clamps aur 1 anti-corrosion spray"}},{"label":{"en":"Fit","ur":"فٹمنٹ","ur-roman":"Fit"},"value":{"en":"Universal","ur":"یونیورسل","ur-roman":"Universal"}}]'::jsonb,
    v_cat_batteries,
    v_brand_powercell,
    'aftermarket',
    950,
    null,
    60,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 60, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-OIL-01: EcoLube 5W-30 Synthetic Engine Oil 4L
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-OIL-01',
    'ecolube-5w-30-synthetic-engine-oil-4l',
    '{"en":"EcoLube 5W-30 Synthetic Engine Oil 4L","ur":"ایکو لیوب 5W-30 سنتھیٹک انجن آئل 4L","ur-roman":"EcoLube 5W-30 Synthetic Engine Oil 4L"}'::jsonb,
    '{"en":"Multigrade motor lubricant formulated for smooth piston action and high thermal protection in warm climates.","ur":"گرم موسم میں اندرونی انجن پرزوں کے تحفظ اور ہموار کارکردگی کے لیے سنتھیٹک انجن آئل۔","ur-roman":"Garam mosam mein internal engine protection aur smooth performance ke liye synthetic oil."}'::jsonb,
    '{"en":"Multigrade motor lubricant formulated for smooth piston action and high thermal protection in warm climates.","ur":"گرم موسم میں اندرونی انجن پرزوں کے تحفظ اور ہموار کارکردگی کے لیے سنتھیٹک انجن آئل۔","ur-roman":"Garam mosam mein internal engine protection aur smooth performance ke liye synthetic oil."}'::jsonb,
    '[{"label":{"en":"Grade","ur":"گریڈ","ur-roman":"Grade"},"value":{"en":"5W-30","ur":"5W-30","ur-roman":"5W-30"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Synthetic","ur":"سنتھیٹک","ur-roman":"Synthetic"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"4 L","ur":"4 لیٹر","ur-roman":"4 L"}}]'::jsonb,
    v_cat_oils,
    v_brand_ecolube,
    'aftermarket',
    9800,
    null,
    40,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 40, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-OIL-02: EcoLube 10W-40 Semi-Synthetic Engine Oil 4L
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-OIL-02',
    'ecolube-10w-40-semi-synthetic-engine-oil-4l',
    '{"en":"EcoLube 10W-40 Semi-Synthetic Engine Oil 4L","ur":"ایکو لیوب 10W-40 سیمی سنتھیٹک انجن آئل 4L","ur-roman":"EcoLube 10W-40 Semi-Synthetic Engine Oil 4L"}'::jsonb,
    '{"en":"Semi-synthetic lubricant designed for high-mileage engines and mixed stop-and-go driving conditions.","ur":"زیادہ مائلیج والے انجنوں اور روزمرہ ٹریفک کے لیے سیمی سنتھیٹک موٹر لبریکنٹ۔","ur-roman":"Zyada mileage walay engines aur city driving ke liye semi-synthetic lubricant."}'::jsonb,
    '{"en":"Semi-synthetic lubricant designed for high-mileage engines and mixed stop-and-go driving conditions.","ur":"زیادہ مائلیج والے انجنوں اور روزمرہ ٹریفک کے لیے سیمی سنتھیٹک موٹر لبریکنٹ۔","ur-roman":"Zyada mileage walay engines aur city driving ke liye semi-synthetic lubricant."}'::jsonb,
    '[{"label":{"en":"Grade","ur":"گریڈ","ur-roman":"Grade"},"value":{"en":"10W-40","ur":"10W-40","ur-roman":"10W-40"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Semi-synthetic","ur":"سیمی سنتھیٹک","ur-roman":"Semi-synthetic"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"4 L","ur":"4 لیٹر","ur-roman":"4 L"}}]'::jsonb,
    v_cat_oils,
    v_brand_ecolube,
    'aftermarket',
    6800,
    7200,
    3,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 3, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-OIL-03: EcoLube Ready-Mix Coolant 1L
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-OIL-03',
    'ecolube-ready-mix-coolant-1l',
    '{"en":"EcoLube Ready-Mix Coolant 1L","ur":"ایکو لیوب ریڈی مکس کولنٹ 1L","ur-roman":"EcoLube Ready-Mix Coolant 1L"}'::jsonb,
    '{"en":"Pre-diluted radiator fluid providing anti-boil and corrosion defense across the cooling circuit.","ur":"ریڈی ایٹر میں زنگ اور بوائلنگ روکنے کے لیے تیار شدہ پری ڈائلوٹڈ کولنٹ فلوئڈ۔","ur-roman":"Radiator mein rust aur boiling rokne ke liye pre-diluted green coolant fluid."}'::jsonb,
    '{"en":"Pre-diluted radiator fluid providing anti-boil and corrosion defense across the cooling circuit.","ur":"ریڈی ایٹر میں زنگ اور بوائلنگ روکنے کے لیے تیار شدہ پری ڈائلوٹڈ کولنٹ فلوئڈ۔","ur-roman":"Radiator mein rust aur boiling rokne ke liye pre-diluted green coolant fluid."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Ready-mix coolant","ur":"ریڈی مکس کولنٹ","ur-roman":"Ready-mix coolant"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"1 L","ur":"1 لیٹر","ur-roman":"1 L"}},{"label":{"en":"Colour","ur":"رنگ","ur-roman":"Colour"},"value":{"en":"Green","ur":"سبز","ur-roman":"Green"}}]'::jsonb,
    v_cat_oils,
    v_brand_ecolube,
    'aftermarket',
    1100,
    null,
    0,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 0, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-FLT-01: AirPure Spin-On Oil Filter
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-FLT-01',
    'airpure-spin-on-oil-filter',
    '{"en":"AirPure Spin-On Oil Filter","ur":"ایئر پیور اسپن آن آئل فلٹر","ur-roman":"AirPure Spin-On Oil Filter"}'::jsonb,
    '{"en":"Canister oil filter containing dense pleated paper media to trap carbon residue and engine debris.","ur":"انجن آئل سے کاربن اور باریک ذرات صاف کرنے کے لیے پلیٹڈ فلٹریشن فلٹر۔","ur-roman":"Engine oil se carbon aur particles clean karne ke liye pleated filter."}'::jsonb,
    '{"en":"Canister oil filter containing dense pleated paper media to trap carbon residue and engine debris.","ur":"انجن آئل سے کاربن اور باریک ذرات صاف کرنے کے لیے پلیٹڈ فلٹریشن فلٹر۔","ur-roman":"Engine oil se carbon aur particles clean karne ke liye pleated filter."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Spin-on oil filter","ur":"اسپن آن آئل فلٹر","ur-roman":"Spin-on oil filter"}},{"label":{"en":"Fit","ur":"فٹمنٹ","ur-roman":"Fit"},"value":{"en":"Selected petrol engines","ur":"منتخب پیٹرول انجن","ur-roman":"Selected petrol engines"}}]'::jsonb,
    v_cat_filters,
    v_brand_airpure,
    'aftermarket',
    650,
    null,
    80,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 80, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-FLT-02: AirPure Air Filter Element
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-FLT-02',
    'airpure-air-filter-element',
    '{"en":"AirPure Air Filter Element","ur":"ایئر پیور ایئر فلٹر ایلیمنٹ","ur-roman":"AirPure Air Filter Element"}'::jsonb,
    '{"en":"Engine intake filter block designed to catch airborne dust without constricting manifold airflow.","ur":"ہوا سے گرد و غبار روکنے اور انجن تک صاف ہوا پہنچانے والا ایئر فلٹر۔","ur-roman":"Air se dust rok kar engine tak saaf air pohanchane wala intake air filter."}'::jsonb,
    '{"en":"Engine intake filter block designed to catch airborne dust without constricting manifold airflow.","ur":"ہوا سے گرد و غبار روکنے اور انجن تک صاف ہوا پہنچانے والا ایئر فلٹر۔","ur-roman":"Air se dust rok kar engine tak saaf air pohanchane wala intake air filter."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Panel air filter element","ur":"پینل ایئر فلٹر ایلیمنٹ","ur-roman":"Panel air filter element"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Pleated paper","ur":"پلیٹڈ پیپر","ur-roman":"Pleated paper"}}]'::jsonb,
    v_cat_filters,
    v_brand_airpure,
    'aftermarket',
    1250,
    null,
    45,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 45, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-FLT-03: AirPure Carbon Cabin AC Filter
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-FLT-03',
    'airpure-carbon-cabin-ac-filter',
    '{"en":"AirPure Carbon Cabin AC Filter","ur":"ایئر پیور کاربن کیبن اے سی فلٹر","ur-roman":"AirPure Carbon Cabin AC Filter"}'::jsonb,
    '{"en":"Dual-layer cabin filter incorporating activated charcoal to minimize outside road fumes and fine dust.","ur":"باہر کے دھوئیں اور دھول کو کیبن کے اندر آنے سے روکنے کے لیے چارکول کیبن فلٹر۔","ur-roman":"Bahar ke dhuen aur dust ko cabin se door rakhne ke liye charcoal cabin filter."}'::jsonb,
    '{"en":"Dual-layer cabin filter incorporating activated charcoal to minimize outside road fumes and fine dust.","ur":"باہر کے دھوئیں اور دھول کو کیبن کے اندر آنے سے روکنے کے لیے چارکول کیبن فلٹر۔","ur-roman":"Bahar ke dhuen aur dust ko cabin se door rakhne ke liye charcoal cabin filter."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Cabin filter","ur":"کیبن فلٹر","ur-roman":"Cabin filter"}},{"label":{"en":"Layer","ur":"تہہ","ur-roman":"Layer"},"value":{"en":"Activated carbon","ur":"ایکٹیویٹڈ کاربن","ur-roman":"Activated carbon"}}]'::jsonb,
    v_cat_filters,
    v_brand_airpure,
    'aftermarket',
    1290,
    1450,
    30,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 30, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BRK-01: StopWell Front Brake Pad Set
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BRK-01',
    'stopwell-front-brake-pad-set',
    '{"en":"StopWell Front Brake Pad Set","ur":"اسٹاپ ویل فرنٹ بریک پیڈ سیٹ","ur-roman":"StopWell Front Brake Pad Set"}'::jsonb,
    '{"en":"Front axle friction pads with bonded backing plates for consistent deceleration and wear life.","ur":"سامنے والے ایکسل کے لیے یکساں روک تھام فراہم کرنے والے فرنٹ بریک پیڈز۔","ur-roman":"Front axle ke liye balanced stopping aur lambi service life walay brake pads."}'::jsonb,
    '{"en":"Front axle friction pads with bonded backing plates for consistent deceleration and wear life.","ur":"سامنے والے ایکسل کے لیے یکساں روک تھام فراہم کرنے والے فرنٹ بریک پیڈز۔","ur-roman":"Front axle ke liye balanced stopping aur lambi service life walay brake pads."}'::jsonb,
    '[{"label":{"en":"Position","ur":"پوزیشن","ur-roman":"Position"},"value":{"en":"Front","ur":"سامنے","ur-roman":"Front"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Semi-metallic","ur":"سیمی میٹالک","ur-roman":"Semi-metallic"}},{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"1 axle set","ur":"1 ایکسل سیٹ","ur-roman":"1 axle set"}}]'::jsonb,
    v_cat_brakes,
    v_brand_stopwell,
    'aftermarket',
    4200,
    null,
    20,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 20, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BRK-02: StopWell Rear Brake Shoe Set
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BRK-02',
    'stopwell-rear-brake-shoe-set',
    '{"en":"StopWell Rear Brake Shoe Set","ur":"اسٹاپ ویل ریئر بریک شو سیٹ","ur-roman":"StopWell Rear Brake Shoe Set"}'::jsonb,
    '{"en":"Curved friction shoes engineered for passenger vehicle rear drum brake enclosures.","ur":"پچھلے وہیل ڈرم بریک سسٹم کے لیے معیاری فرکشن مٹیریل والے بریک شوز۔","ur-roman":"Rear drum brake system ke liye durable friction material walay brake shoes."}'::jsonb,
    '{"en":"Curved friction shoes engineered for passenger vehicle rear drum brake enclosures.","ur":"پچھلے وہیل ڈرم بریک سسٹم کے لیے معیاری فرکشن مٹیریل والے بریک شوز۔","ur-roman":"Rear drum brake system ke liye durable friction material walay brake shoes."}'::jsonb,
    '[{"label":{"en":"Position","ur":"پوزیشن","ur-roman":"Position"},"value":{"en":"Rear","ur":"پیچھے","ur-roman":"Rear"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Drum brake shoe set","ur":"ڈرم بریک شو سیٹ","ur-roman":"Drum brake shoe set"}}]'::jsonb,
    v_cat_brakes,
    v_brand_stopwell,
    'aftermarket',
    3600,
    null,
    14,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 14, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'H'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BRK-03: StopWell DOT 4 Brake Fluid 500ml
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BRK-03',
    'stopwell-dot-4-brake-fluid-500ml',
    '{"en":"StopWell DOT 4 Brake Fluid 500ml","ur":"اسٹاپ ویل DOT 4 بریک فلوئڈ 500ml","ur-roman":"StopWell DOT 4 Brake Fluid 500ml"}'::jsonb,
    '{"en":"Hydraulic fluid with high wet-boiling resistance formulated for modern ABS disc and drum brake setups.","ur":"ہائیڈرولک پریشر اور ہائی بوائلنگ پوائنٹ کے حامل ڈسک اور ڈرم بریک سسٹمز کے لیے بریک آئل۔","ur-roman":"Disc aur drum brake systems ke liye high boiling point DOT 4 hydraulic brake fluid."}'::jsonb,
    '{"en":"Hydraulic fluid with high wet-boiling resistance formulated for modern ABS disc and drum brake setups.","ur":"ہائیڈرولک پریشر اور ہائی بوائلنگ پوائنٹ کے حامل ڈسک اور ڈرم بریک سسٹمز کے لیے بریک آئل۔","ur-roman":"Disc aur drum brake systems ke liye high boiling point DOT 4 hydraulic brake fluid."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"DOT 4","ur":"ڈاٹ 4","ur-roman":"DOT 4"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"500 ml","ur":"500 ملی لیٹر","ur-roman":"500 ml"}}]'::jsonb,
    v_cat_brakes,
    v_brand_stopwell,
    'aftermarket',
    850,
    null,
    55,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 55, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-LGT-01: ClearView H4 Halogen Headlight Bulb (Pair)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-LGT-01',
    'clearview-h4-halogen-headlight-bulb-pair',
    '{"en":"ClearView H4 Halogen Headlight Bulb (Pair)","ur":"کلیئر ویو H4 ہیلوجن ہیڈ لائٹ بلب (جوڑا)","ur-roman":"ClearView H4 Halogen Headlight Bulb (Pair)"}'::jsonb,
    '{"en":"Dual-filament quartz halogen replacement bulbs providing standard high and low headlight beams.","ur":"ہائی اور لو بیم کے لیے اسٹینڈرڈ کوارٹز گلاس ہیلوجن ہیڈ لائٹ بلب کا جوڑا۔","ur-roman":"High aur low beam headlight illumination ke liye standard H4 halogen bulbs."}'::jsonb,
    '{"en":"Dual-filament quartz halogen replacement bulbs providing standard high and low headlight beams.","ur":"ہائی اور لو بیم کے لیے اسٹینڈرڈ کوارٹز گلاس ہیلوجن ہیڈ لائٹ بلب کا جوڑا۔","ur-roman":"High aur low beam headlight illumination ke liye standard H4 halogen bulbs."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"H4 halogen","ur":"H4 ہیلوجن","ur-roman":"H4 halogen"}},{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"2 bulbs","ur":"2 بلب","ur-roman":"2 bulbs"}}]'::jsonb,
    v_cat_lighting,
    v_brand_clearview,
    'aftermarket',
    1600,
    null,
    35,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 35, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-LGT-02: ClearView LED Headlight Kit H11
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-LGT-02',
    'clearview-led-headlight-kit-h11',
    '{"en":"ClearView LED Headlight Kit H11","ur":"کلیئر ویو ایل ای ڈی ہیڈ لائٹ کٹ H11","ur-roman":"ClearView LED Headlight Kit H11"}'::jsonb,
    '{"en":"Compact solid-state LED headlight assembly with heat-sink base and integrated driver module.","ur":"ہیٹ سنک بیس اور انٹیگریٹڈ ڈرائیور کے ساتھ سفید روشنی دینے والی ایل ای ڈی ہیڈ لائٹ کٹ۔","ur-roman":"Heat sink base aur driver ke sath crisp beam output wali LED headlight kit."}'::jsonb,
    '{"en":"Compact solid-state LED headlight assembly with heat-sink base and integrated driver module.","ur":"ہیٹ سنک بیس اور انٹیگریٹڈ ڈرائیور کے ساتھ سفید روشنی دینے والی ایل ای ڈی ہیڈ لائٹ کٹ۔","ur-roman":"Heat sink base aur driver ke sath crisp beam output wali LED headlight kit."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"LED conversion kit","ur":"ایل ای ڈی کنورژن کٹ","ur-roman":"LED conversion kit"}},{"label":{"en":"Socket","ur":"ساکٹ","ur-roman":"Socket"},"value":{"en":"H11","ur":"H11","ur-roman":"H11"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"2 bulbs with drivers","ur":"2 بلب بمعہ ڈرائیورز","ur-roman":"2 bulbs with drivers"}}]'::jsonb,
    v_cat_lighting,
    v_brand_clearview,
    'aftermarket',
    5900,
    6500,
    6,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 6, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-LGT-03: ClearView Tail Light Assembly (Right)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-LGT-03',
    'clearview-tail-light-assembly-right',
    '{"en":"ClearView Tail Light Assembly (Right)","ur":"کلیئر ویو ٹیل لائٹ اسمبلی (دائیں)","ur-roman":"ClearView Tail Light Assembly (Right)"}'::jsonb,
    '{"en":"Moulded polycarbonate rear signal housing with pre-installed reflective lenses and wiring harness.","ur":"ریفلیکٹر لینز اور وائرنگ کے ساتھ دائیں جانب کی پچھلی اشارہ و بریک لائٹ باڈی۔","ur-roman":"Right side indicator aur brake light ke liye moulded rear tail lamp housing."}'::jsonb,
    '{"en":"Moulded polycarbonate rear signal housing with pre-installed reflective lenses and wiring harness.","ur":"ریفلیکٹر لینز اور وائرنگ کے ساتھ دائیں جانب کی پچھلی اشارہ و بریک لائٹ باڈی۔","ur-roman":"Right side indicator aur brake light ke liye moulded rear tail lamp housing."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Rear tail lamp assembly","ur":"ریئر ٹیل لیمپ اسمبلی","ur-roman":"Rear tail lamp assembly"}},{"label":{"en":"Side","ur":"سائیڈ","ur-roman":"Side"},"value":{"en":"Right","ur":"دائیں","ur-roman":"Right"}}]'::jsonb,
    v_cat_lighting,
    v_brand_clearview,
    'aftermarket',
    5400,
    null,
    0,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 0, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-WPR-01: ClearView Flat Wiper Blade 22in
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-WPR-01',
    'clearview-flat-wiper-blade-22in',
    '{"en":"ClearView Flat Wiper Blade 22in","ur":"کلیئر ویو فلیٹ وائپر بلیڈ 22 انچ","ur-roman":"ClearView Flat Wiper Blade 22in"}'::jsonb,
    '{"en":"Aerodynamic frameless windscreen wiper with rubber edge designed for streak-free rain clearing.","ur":"بارش میں ونڈ اسکرین صاف رکھنے کے لیے ایئرو ڈائنامک فریم لیس ربر وائپر بلیڈ۔","ur-roman":"Baarish mein windscreen saaf rakhne ke liye frameless rubber wiper blade."}'::jsonb,
    '{"en":"Aerodynamic frameless windscreen wiper with rubber edge designed for streak-free rain clearing.","ur":"بارش میں ونڈ اسکرین صاف رکھنے کے لیے ایئرو ڈائنامک فریم لیس ربر وائپر بلیڈ۔","ur-roman":"Baarish mein windscreen saaf rakhne ke liye frameless rubber wiper blade."}'::jsonb,
    '[{"label":{"en":"Length","ur":"لمبائی","ur-roman":"Length"},"value":{"en":"22 in","ur":"22 انچ","ur-roman":"22 in"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Flat blade","ur":"فلیٹ بلیڈ","ur-roman":"Flat blade"}}]'::jsonb,
    v_cat_wipers,
    v_brand_clearview,
    'aftermarket',
    900,
    null,
    50,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 50, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-WPR-02: ClearView Wiper Blade Pair 24in + 16in
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-WPR-02',
    'clearview-wiper-blade-pair-24in-16in',
    '{"en":"ClearView Wiper Blade Pair 24in + 16in","ur":"کلیئر ویو وائپر بلیڈ جوڑا 24 انچ + 16 انچ","ur-roman":"ClearView Wiper Blade Pair 24in + 16in"}'::jsonb,
    '{"en":"Matched driver and passenger wiper blade set pre-assembled with common hook adapters.","ur":"ڈرائیور اور پیسنجر سائیڈ کے لیے ہک اڈاپٹر کے ساتھ دو عدد وائپر بلیڈز کا سیٹ۔","ur-roman":"Driver aur passenger sides ke liye hook adapters ke sath wiper blades ka pair."}'::jsonb,
    '{"en":"Matched driver and passenger wiper blade set pre-assembled with common hook adapters.","ur":"ڈرائیور اور پیسنجر سائیڈ کے لیے ہک اڈاپٹر کے ساتھ دو عدد وائپر بلیڈز کا سیٹ۔","ur-roman":"Driver aur passenger sides ke liye hook adapters ke sath wiper blades ka pair."}'::jsonb,
    '[{"label":{"en":"Sizes","ur":"سائزز","ur-roman":"Sizes"},"value":{"en":"24 in + 16 in","ur":"24 انچ + 16 انچ","ur-roman":"24 in + 16 in"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Flat blade pair","ur":"فلیٹ بلیڈ جوڑا","ur-roman":"Flat blade pair"}}]'::jsonb,
    v_cat_wipers,
    v_brand_clearview,
    'aftermarket',
    1700,
    null,
    28,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 28, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-WPR-03: ClearView Windshield Washer Fluid 1L
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-WPR-03',
    'clearview-windshield-washer-fluid-1l',
    '{"en":"ClearView Windshield Washer Fluid 1L","ur":"کلیئر ویو ونڈ شیلڈ واشر فلوئڈ 1L","ur-roman":"ClearView Windshield Washer Fluid 1L"}'::jsonb,
    '{"en":"Mild glass cleaning solution intended for vehicle washer reservoirs to clear road spray and bug marks.","ur":"شیشے سے مٹی اور نشانات صاف کرنے کے لیے واشر ٹینکی میں ڈالنے والا محلول۔","ur-roman":"Windscreen se dirt aur spots saaf karne ke liye ready-to-use washer bottle fluid."}'::jsonb,
    '{"en":"Mild glass cleaning solution intended for vehicle washer reservoirs to clear road spray and bug marks.","ur":"شیشے سے مٹی اور نشانات صاف کرنے کے لیے واشر ٹینکی میں ڈالنے والا محلول۔","ur-roman":"Windscreen se dirt aur spots saaf karne ke liye ready-to-use washer bottle fluid."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Ready-to-use washer fluid","ur":"ریڈی ٹو یوز واشر فلوئڈ","ur-roman":"Ready-to-use washer fluid"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"1 L","ur":"1 لیٹر","ur-roman":"1 L"}}]'::jsonb,
    v_cat_wipers,
    v_brand_clearview,
    'aftermarket',
    550,
    null,
    70,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 70, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-SUS-01: TorqueWorks Front Shock Absorber (Each)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SUS-01',
    'torqueworks-front-shock-absorber-each',
    '{"en":"TorqueWorks Front Shock Absorber (Each)","ur":"ٹارک ورکس فرنٹ شاک ایبزاربر (فی عدد)","ur-roman":"TorqueWorks Front Shock Absorber (Each)"}'::jsonb,
    '{"en":"Twin-tube hydraulic gas damper intended to absorb road impacts and support front suspension stability.","ur":"سڑک کے جھٹکوں کو جذب کرنے اور فرنٹ سسپنشن کو مستحکم رکھنے کے لیے گیس ڈیمپر۔","ur-roman":"Road bumps ko absorb karne aur front suspension stability ke liye gas shock absorber."}'::jsonb,
    '{"en":"Twin-tube hydraulic gas damper intended to absorb road impacts and support front suspension stability.","ur":"سڑک کے جھٹکوں کو جذب کرنے اور فرنٹ سسپنشن کو مستحکم رکھنے کے لیے گیس ڈیمپر۔","ur-roman":"Road bumps ko absorb karne aur front suspension stability ke liye gas shock absorber."}'::jsonb,
    '[{"label":{"en":"Position","ur":"پوزیشن","ur-roman":"Position"},"value":{"en":"Front","ur":"سامنے","ur-roman":"Front"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Gas shock absorber","ur":"گیس شاک ایبزاربر","ur-roman":"Gas shock absorber"}},{"label":{"en":"Sold","ur":"فروخت","ur-roman":"Sold"},"value":{"en":"Each","ur":"فی عدد","ur-roman":"Each"}}]'::jsonb,
    v_cat_suspension,
    v_brand_torqueworks,
    'aftermarket',
    6800,
    null,
    12,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 12, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-SUS-02: TorqueWorks Stabilizer Link Pair
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SUS-02',
    'torqueworks-stabilizer-link-pair',
    '{"en":"TorqueWorks Stabilizer Link Pair","ur":"ٹارک ورکس اسٹیبلائزر لنک جوڑا","ur-roman":"TorqueWorks Stabilizer Link Pair"}'::jsonb,
    '{"en":"Front sway bar connection rods equipped with sealed ball joints for body roll mitigation.","ur":"موڑ کاٹتے وقت باڈی کو جھکاؤ سے محفوظ رکھنے والے اسٹیبلائزر راڈ لنکس کا جوڑا۔","ur-roman":"Turns par body roll kam karne ke liye sealed joints walay sway bar links pair."}'::jsonb,
    '{"en":"Front sway bar connection rods equipped with sealed ball joints for body roll mitigation.","ur":"موڑ کاٹتے وقت باڈی کو جھکاؤ سے محفوظ رکھنے والے اسٹیبلائزر راڈ لنکس کا جوڑا۔","ur-roman":"Turns par body roll kam karne ke liye sealed joints walay sway bar links pair."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Stabilizer (sway bar) link","ur":"اسٹیبلائزر لنک","ur-roman":"Stabilizer (sway bar) link"}},{"label":{"en":"Sold","ur":"فروخت","ur-roman":"Sold"},"value":{"en":"Pair","ur":"جوڑا","ur-roman":"Pair"}}]'::jsonb,
    v_cat_suspension,
    v_brand_torqueworks,
    'aftermarket',
    2300,
    null,
    22,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 22, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-SUS-03: TorqueWorks Tie Rod End (Each)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SUS-03',
    'torqueworks-tie-rod-end-each',
    '{"en":"TorqueWorks Tie Rod End (Each)","ur":"ٹارک ورکس ٹائی راڈ اینڈ (فی عدد)","ur-roman":"TorqueWorks Tie Rod End (Each)"}'::jsonb,
    '{"en":"Steering rack linkage terminal joint manufactured with threaded steel shaft and dust boot.","ur":"اسٹیئرنگ ریک اور وہیل ہب کو درست زاویے پر جوڑنے والا اسٹیل ٹائی راڈ اینڈ۔","ur-roman":"Steering rack linkage ke liye threaded shaft aur dust boot wala tie rod end."}'::jsonb,
    '{"en":"Steering rack linkage terminal joint manufactured with threaded steel shaft and dust boot.","ur":"اسٹیئرنگ ریک اور وہیل ہب کو درست زاویے پر جوڑنے والا اسٹیل ٹائی راڈ اینڈ۔","ur-roman":"Steering rack linkage ke liye threaded shaft aur dust boot wala tie rod end."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Tie rod end","ur":"ٹائی راڈ اینڈ","ur-roman":"Tie rod end"}},{"label":{"en":"Sold","ur":"فروخت","ur-roman":"Sold"},"value":{"en":"Each","ur":"فی عدد","ur-roman":"Each"}}]'::jsonb,
    v_cat_suspension,
    v_brand_torqueworks,
    'aftermarket',
    1900,
    null,
    5,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 5, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'H'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-ACP-01: CoolFlow AC Gas Refill Kit
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ACP-01',
    'coolflow-ac-gas-refill-kit',
    '{"en":"CoolFlow AC Gas Refill Kit","ur":"کول فلو اے سی گیس ری فل کٹ","ur-roman":"CoolFlow AC Gas Refill Kit"}'::jsonb,
    '{"en":"Vehicle air conditioning refrigerant top-up bottle bundled with low-pressure charging hose and pressure gauge.","ur":"کار اے سی سسٹم میں گیس کی سطح بحال کرنے کے لیے ریفریجرینٹ کین اور پریشر گیج کٹ۔","ur-roman":"Car AC cooling circuit mein pressure restore karne ke liye refrigerant aur gauge kit."}'::jsonb,
    '{"en":"Vehicle air conditioning refrigerant top-up bottle bundled with low-pressure charging hose and pressure gauge.","ur":"کار اے سی سسٹم میں گیس کی سطح بحال کرنے کے لیے ریفریجرینٹ کین اور پریشر گیج کٹ۔","ur-roman":"Car AC cooling circuit mein pressure restore karne ke liye refrigerant aur gauge kit."}'::jsonb,
    '[{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"Refrigerant can, hose and gauge","ur":"ریفریجرینٹ کین، ہوز اور گیج","ur-roman":"Refrigerant can, hose and gauge"}},{"label":{"en":"Use","ur":"استعمال","ur-roman":"Use"},"value":{"en":"Top-up service","ur":"ٹاپ اپ سروس","ur-roman":"Top-up service"}}]'::jsonb,
    v_cat_ac,
    v_brand_coolflow,
    'aftermarket',
    4800,
    null,
    18,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 18, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-ACP-02: CoolFlow AC Condenser Fan Motor
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ACP-02',
    'coolflow-ac-condenser-fan-motor',
    '{"en":"CoolFlow AC Condenser Fan Motor","ur":"کول فلو اے سی کنڈینسر فین موٹر","ur-roman":"CoolFlow AC Condenser Fan Motor"}'::jsonb,
    '{"en":"Direct-current auxiliary cooling fan motor designed to draw ambient air over the condenser core.","ur":"اے سی کنڈینسر کے درجہ حرارت کو اعتدال پر رکھنے کے لیے 12 وولٹ کولنگ فین موٹر۔","ur-roman":"AC condenser se heat nikalne ke liye 12V auxiliary condenser fan motor."}'::jsonb,
    '{"en":"Direct-current auxiliary cooling fan motor designed to draw ambient air over the condenser core.","ur":"اے سی کنڈینسر کے درجہ حرارت کو اعتدال پر رکھنے کے لیے 12 وولٹ کولنگ فین موٹر۔","ur-roman":"AC condenser se heat nikalne ke liye 12V auxiliary condenser fan motor."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Condenser fan motor","ur":"کنڈینسر فین موٹر","ur-roman":"Condenser fan motor"}},{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}}]'::jsonb,
    v_cat_ac,
    v_brand_coolflow,
    'aftermarket',
    9500,
    null,
    7,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 7, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-ACP-03: CoolFlow Cabin Blower Motor
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ACP-03',
    'coolflow-cabin-blower-motor',
    '{"en":"CoolFlow Cabin Blower Motor","ur":"کول فلو کیبن بلور موٹر","ur-roman":"CoolFlow Cabin Blower Motor"}'::jsonb,
    '{"en":"Interior climate control ventilation fan responsible for moving heated or air-conditioned air into cabin vents.","ur":"ڈیش بورڈ گرلز کے ذریعے کیبن کے اندر ہوا پہنچانے والی 12 وولٹ بلور موٹر۔","ur-roman":"Cabin vents ke zariye thandi ya garm hawa circulate karne wali blower fan motor."}'::jsonb,
    '{"en":"Interior climate control ventilation fan responsible for moving heated or air-conditioned air into cabin vents.","ur":"ڈیش بورڈ گرلز کے ذریعے کیبن کے اندر ہوا پہنچانے والی 12 وولٹ بلور موٹر۔","ur-roman":"Cabin vents ke zariye thandi ya garm hawa circulate karne wali blower fan motor."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Cabin blower motor","ur":"کیبن بلور موٹر","ur-roman":"Cabin blower motor"}},{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}}]'::jsonb,
    v_cat_ac,
    v_brand_coolflow,
    'aftermarket',
    6700,
    7200,
    10,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 10, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-ELC-01: VoltEdge Iridium Spark Plug Set (4 pcs)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ELC-01',
    'voltedge-iridium-spark-plug-set-4-pcs',
    '{"en":"VoltEdge Iridium Spark Plug Set (4 pcs)","ur":"وولٹ ایج اریڈیم اسپارک پلگ سیٹ (4 عدد)","ur-roman":"VoltEdge Iridium Spark Plug Set (4 pcs)"}'::jsonb,
    '{"en":"Fine-wire iridium tip spark plugs built for reliable combustion ignition in four-cylinder petrol engines.","ur":"چار سلنڈر پیٹرول انجنوں میں یکساں اگنیشن کے لیے اریڈیم ٹپ اسپارک پلگز۔","ur-roman":"Chaar-cylinder petrol engines mein ignition spark ke liye fine-wire iridium plugs."}'::jsonb,
    '{"en":"Fine-wire iridium tip spark plugs built for reliable combustion ignition in four-cylinder petrol engines.","ur":"چار سلنڈر پیٹرول انجنوں میں یکساں اگنیشن کے لیے اریڈیم ٹپ اسپارک پلگز۔","ur-roman":"Chaar-cylinder petrol engines mein ignition spark ke liye fine-wire iridium plugs."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Iridium spark plugs","ur":"اریڈیم اسپارک پلگز","ur-roman":"Iridium spark plugs"}},{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"4 pcs","ur":"4 عدد","ur-roman":"4 pcs"}}]'::jsonb,
    v_cat_ignition,
    v_brand_voltedge,
    'aftermarket',
    4600,
    null,
    25,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 25, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-ELC-02: VoltEdge Ignition Coil
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ELC-02',
    'voltedge-ignition-coil',
    '{"en":"VoltEdge Ignition Coil","ur":"وولٹ ایج اگنیشن کوائل","ur-roman":"VoltEdge Ignition Coil"}'::jsonb,
    '{"en":"Direct ignition transformer boot supplying high secondary voltage straight to the combustion spark plug.","ur":"اسپارک پلگ کو مطلوبہ ہائی وولٹیج فراہم کرنے والی انفرادی اگنیشن کوائل۔","ur-roman":"Spark plug tak high secondary voltage deliver karne wali individual ignition coil."}'::jsonb,
    '{"en":"Direct ignition transformer boot supplying high secondary voltage straight to the combustion spark plug.","ur":"اسپارک پلگ کو مطلوبہ ہائی وولٹیج فراہم کرنے والی انفرادی اگنیشن کوائل۔","ur-roman":"Spark plug tak high secondary voltage deliver karne wali individual ignition coil."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Ignition coil","ur":"اگنیشن کوائل","ur-roman":"Ignition coil"}},{"label":{"en":"Voltage","ur":"وولٹیج","ur-roman":"Voltage"},"value":{"en":"12V","ur":"12 وولٹ","ur-roman":"12V"}}]'::jsonb,
    v_cat_ignition,
    v_brand_voltedge,
    'aftermarket',
    3900,
    null,
    16,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 16, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-ELC-03: VoltEdge Fuse & Relay Assortment Kit
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-ELC-03',
    'voltedge-fuse-relay-assortment-kit',
    '{"en":"VoltEdge Fuse & Relay Assortment Kit","ur":"وولٹ ایج فیوز اور ریلے کٹ","ur-roman":"VoltEdge Fuse & Relay Assortment Kit"}'::jsonb,
    '{"en":"Multi-amperage mini automotive blade fuse set packed in a clear partitioned plastic container.","ur":"گاڑی کے برقی سرکٹس کے تحفظ کے لیے مختلف ایمپیئر کے بلیڈ فیوز اور ریلے باکس۔","ur-roman":"Car electrical circuits ki hifazat ke liye multi-amperage blade fuses aur relay kit."}'::jsonb,
    '{"en":"Multi-amperage mini automotive blade fuse set packed in a clear partitioned plastic container.","ur":"گاڑی کے برقی سرکٹس کے تحفظ کے لیے مختلف ایمپیئر کے بلیڈ فیوز اور ریلے باکس۔","ur-roman":"Car electrical circuits ki hifazat ke liye multi-amperage blade fuses aur relay kit."}'::jsonb,
    '[{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"Assorted fuses and relays","ur":"مختلف ایمپیئر فیوز اور ریلے","ur-roman":"Assorted fuses and relays"}},{"label":{"en":"Case","ur":"ڈبہ","ur-roman":"Case"},"value":{"en":"Organiser box","ur":"آرگنائزر بکس","ur-roman":"Organiser box"}}]'::jsonb,
    v_cat_ignition,
    v_brand_voltedge,
    'aftermarket',
    1200,
    null,
    40,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 40, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-BLT-01: FlexDrive Timing Belt Kit
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BLT-01',
    'flexdrive-timing-belt-kit',
    '{"en":"FlexDrive Timing Belt Kit","ur":"فلیکس ڈرائیو ٹائمنگ بیلٹ کٹ","ur-roman":"FlexDrive Timing Belt Kit"}'::jsonb,
    '{"en":"Engine timing synchronisation package including toothed drive belt and matching tensioner pulley.","ur":"کیم شافٹ اور کرینک شافٹ ٹائمنگ کو ہم آہنگ رکھنے کے لیے ٹائمنگ بیلٹ اور ٹینشنر بیرنگ کٹ۔","ur-roman":"Camshaft aur crankshaft timing sync ke liye toothed timing belt aur tensioner kit."}'::jsonb,
    '{"en":"Engine timing synchronisation package including toothed drive belt and matching tensioner pulley.","ur":"کیم شافٹ اور کرینک شافٹ ٹائمنگ کو ہم آہنگ رکھنے کے لیے ٹائمنگ بیلٹ اور ٹینشنر بیرنگ کٹ۔","ur-roman":"Camshaft aur crankshaft timing sync ke liye toothed timing belt aur tensioner kit."}'::jsonb,
    '[{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"Timing belt, tensioner, idler","ur":"ٹائمنگ بیلٹ، ٹینشنر، آئیڈلر","ur-roman":"Timing belt, tensioner, idler"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Kit","ur":"کٹ","ur-roman":"Kit"}}]'::jsonb,
    v_cat_belts,
    v_brand_flexdrive,
    'aftermarket',
    7900,
    null,
    11,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 11, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-BLT-02: FlexDrive Serpentine Drive Belt
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BLT-02',
    'flexdrive-serpentine-drive-belt',
    '{"en":"FlexDrive Serpentine Drive Belt","ur":"فلیکس ڈرائیو سرپنٹائن ڈرائیو بیلٹ","ur-roman":"FlexDrive Serpentine Drive Belt"}'::jsonb,
    '{"en":"Multi-ribbed accessory drive belt connecting the engine crankshaft pulley to alternator and water pump.","ur":"الٹرنیٹر اور واٹر پمپ چلانے کے لیے معیاری ربڑ سے تیار شدہ ریبڈ فین بیلٹ۔","ur-roman":"Alternator aur water pump chalane ke liye multi-ribbed accessory fan belt."}'::jsonb,
    '{"en":"Multi-ribbed accessory drive belt connecting the engine crankshaft pulley to alternator and water pump.","ur":"الٹرنیٹر اور واٹر پمپ چلانے کے لیے معیاری ربڑ سے تیار شدہ ریبڈ فین بیلٹ۔","ur-roman":"Alternator aur water pump chalane ke liye multi-ribbed accessory fan belt."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Serpentine (ribbed) drive belt","ur":"سرپنٹائن (ربڈ) ڈرائیو بیلٹ","ur-roman":"Serpentine (ribbed) drive belt"}}]'::jsonb,
    v_cat_belts,
    v_brand_flexdrive,
    'aftermarket',
    2200,
    null,
    26,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 26, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BLT-03: CoolFlow Thermostat with Gasket
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BLT-03',
    'coolflow-thermostat-with-gasket',
    '{"en":"CoolFlow Thermostat with Gasket","ur":"کول فلو تھرموسٹیٹ والو بمعہ گیسکٹ","ur-roman":"CoolFlow Thermostat with Gasket"}'::jsonb,
    '{"en":"Temperature-sensitive coolant flow valve supplied with sealing rubber gasket ring.","ur":"انجن کے آپریٹنگ درجہ حرارت کو کنٹرول کرنے والا تھرموسٹیٹ والو بمعہ ربڑ گیسکٹ۔","ur-roman":"Engine temperature regulate karne ke liye coolant flow thermostat valve with seal."}'::jsonb,
    '{"en":"Temperature-sensitive coolant flow valve supplied with sealing rubber gasket ring.","ur":"انجن کے آپریٹنگ درجہ حرارت کو کنٹرول کرنے والا تھرموسٹیٹ والو بمعہ ربڑ گیسکٹ۔","ur-roman":"Engine temperature regulate karne ke liye coolant flow thermostat valve with seal."}'::jsonb,
    '[{"label":{"en":"Contents","ur":"مشمولات","ur-roman":"Contents"},"value":{"en":"Thermostat with gasket","ur":"تھرموسٹیٹ بمعہ گیسکٹ","ur-roman":"Thermostat with gasket"}}]'::jsonb,
    v_cat_belts,
    v_brand_coolflow,
    'aftermarket',
    1350,
    null,
    19,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 19, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-EXH-01: SilentFlow Rear Muffler (Silencer)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-EXH-01',
    'silentflow-rear-muffler-silencer',
    '{"en":"SilentFlow Rear Muffler (Silencer)","ur":"سائلنٹ فلو ریئر مفلر (سائلنسر)","ur-roman":"SilentFlow Rear Muffler (Silencer)"}'::jsonb,
    '{"en":"Acoustic baffle chamber welded from corrosion-resistant steel to dampen engine exhaust pulsation noise.","ur":"ایگزاسٹ کی آواز کو مدہم اور پرسکون رکھنے کے لیے مضبوط اسٹیل سے بنا پچھلا سائلنسر۔","ur-roman":"Exhaust sound ko control aur quiet rakhne ke liye steel acoustic rear muffler."}'::jsonb,
    '{"en":"Acoustic baffle chamber welded from corrosion-resistant steel to dampen engine exhaust pulsation noise.","ur":"ایگزاسٹ کی آواز کو مدہم اور پرسکون رکھنے کے لیے مضبوط اسٹیل سے بنا پچھلا سائلنسر۔","ur-roman":"Exhaust sound ko control aur quiet rakhne ke liye steel acoustic rear muffler."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Rear muffler","ur":"ریئر مفلر","ur-roman":"Rear muffler"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Steel","ur":"اسٹیل","ur-roman":"Steel"}}]'::jsonb,
    v_cat_exhaust,
    v_brand_silentflow,
    'aftermarket',
    8500,
    null,
    8,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 8, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-EXH-02: SilentFlow Exhaust Flex Pipe
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-EXH-02',
    'silentflow-exhaust-flex-pipe',
    '{"en":"SilentFlow Exhaust Flex Pipe","ur":"سائلنٹ فلو ایگزاسٹ فلیکس پائپ","ur-roman":"SilentFlow Exhaust Flex Pipe"}'::jsonb,
    '{"en":"Braided stainless steel flex section designed to isolate engine movement from the rigid exhaust line.","ur":"انجن کی وائبریشن کو سائلنسر لائن تک پہنچنے سے روکنے کے لیے لچکدار فلیکس پائپ۔","ur-roman":"Engine vibration ko exhaust line se alag rakhne ke liye braided steel flex section."}'::jsonb,
    '{"en":"Braided stainless steel flex section designed to isolate engine movement from the rigid exhaust line.","ur":"انجن کی وائبریشن کو سائلنسر لائن تک پہنچنے سے روکنے کے لیے لچکدار فلیکس پائپ۔","ur-roman":"Engine vibration ko exhaust line se alag rakhne ke liye braided steel flex section."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Flexible exhaust pipe","ur":"لچکدار ایگزاسٹ پائپ","ur-roman":"Flexible exhaust pipe"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Braided steel","ur":"بریڈڈ اسٹیل","ur-roman":"Braided steel"}}]'::jsonb,
    v_cat_exhaust,
    v_brand_silentflow,
    'aftermarket',
    3200,
    null,
    13,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 13, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-EXH-03: SilentFlow Oxygen Sensor
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-EXH-03',
    'silentflow-oxygen-sensor',
    '{"en":"SilentFlow Oxygen Sensor","ur":"سائلنٹ فلو آکسیجن سینسر","ur-roman":"SilentFlow Oxygen Sensor"}'::jsonb,
    '{"en":"Four-wire exhaust manifold lambda sensor communicating fuel-air ratio feedback to the engine control unit.","ur":"ای سی یو کو فیول اور ایئر مکسچر کا ڈیٹا فراہم کرنے والا 4 وائر آکسیجن سینسر۔","ur-roman":"Engine computer ko air-fuel mixture feedback dene wala 4-wire oxygen sensor."}'::jsonb,
    '{"en":"Four-wire exhaust manifold lambda sensor communicating fuel-air ratio feedback to the engine control unit.","ur":"ای سی یو کو فیول اور ایئر مکسچر کا ڈیٹا فراہم کرنے والا 4 وائر آکسیجن سینسر۔","ur-roman":"Engine computer ko air-fuel mixture feedback dene wala 4-wire oxygen sensor."}'::jsonb,
    '[{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Oxygen (lambda) sensor","ur":"آکسیجن (لیمبڈا) سینسر","ur-roman":"Oxygen (lambda) sensor"}},{"label":{"en":"Wires","ur":"تاریں","ur-roman":"Wires"},"value":{"en":"4","ur":"4","ur-roman":"4"}}]'::jsonb,
    v_cat_exhaust,
    v_brand_silentflow,
    'aftermarket',
    6100,
    null,
    9,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 9, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BDY-01: BodyCraft Side Mirror (Right)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BDY-01',
    'bodycraft-side-mirror-right',
    '{"en":"BodyCraft Side Mirror (Right)","ur":"باڈی کرافٹ سائیڈ مرر (دائیں)","ur-roman":"BodyCraft Side Mirror (Right)"}'::jsonb,
    '{"en":"Exterior door mirror with clear optical glass and black finish unpainted plastic housing.","ur":"درست سائیڈ ویو کے لیے بلیک باڈی والا مینوئل ایڈجسٹمنٹ سائیڈ مرر۔","ur-roman":"Clear rear view ke liye unpainted plastic housing wala manual adjust side mirror."}'::jsonb,
    '{"en":"Exterior door mirror with clear optical glass and black finish unpainted plastic housing.","ur":"درست سائیڈ ویو کے لیے بلیک باڈی والا مینوئل ایڈجسٹمنٹ سائیڈ مرر۔","ur-roman":"Clear rear view ke liye unpainted plastic housing wala manual adjust side mirror."}'::jsonb,
    '[{"label":{"en":"Side","ur":"سائیڈ","ur-roman":"Side"},"value":{"en":"Right","ur":"دائیں","ur-roman":"Right"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Manual adjust side mirror","ur":"دستی ایڈجسٹ سائیڈ مرر","ur-roman":"Manual adjust side mirror"}}]'::jsonb,
    v_cat_body,
    v_brand_bodycraft,
    'aftermarket',
    3400,
    null,
    10,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 10, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'H'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-BDY-02: BodyCraft Mud Flap Set (4 pcs)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BDY-02',
    'bodycraft-mud-flap-set-4-pcs',
    '{"en":"BodyCraft Mud Flap Set (4 pcs)","ur":"باڈی کرافٹ مڈ فلیپ سیٹ (4 عدد)","ur-roman":"BodyCraft Mud Flap Set (4 pcs)"}'::jsonb,
    '{"en":"Flexible contoured wheel arch splash guards designed to prevent road mud and gravel spray.","ur":"پہیوں سے اچھلنے والی کیچڑ اور پتھروں سے باڈی کو محفوظ رکھنے والے مڈ فلیپس۔","ur-roman":"Wheels se mud aur pathar uchhalne se body panel ko mehfooz rakhne walay mud flaps."}'::jsonb,
    '{"en":"Flexible contoured wheel arch splash guards designed to prevent road mud and gravel spray.","ur":"پہیوں سے اچھلنے والی کیچڑ اور پتھروں سے باڈی کو محفوظ رکھنے والے مڈ فلیپس۔","ur-roman":"Wheels se mud aur pathar uchhalne se body panel ko mehfooz rakhne walay mud flaps."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"4","ur":"4","ur-roman":"4"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Moulded plastic","ur":"مولڈڈ پلاسٹک","ur-roman":"Moulded plastic"}}]'::jsonb,
    v_cat_body,
    v_brand_bodycraft,
    'aftermarket',
    2100,
    null,
    20,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 20, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-BDY-03: BodyCraft Chrome Door Handle Cover Set
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-BDY-03',
    'bodycraft-chrome-door-handle-cover-set',
    '{"en":"BodyCraft Chrome Door Handle Cover Set","ur":"باڈی کرافٹ کروم ڈور ہینڈل کور سیٹ","ur-roman":"BodyCraft Chrome Door Handle Cover Set"}'::jsonb,
    '{"en":"Decorative electroplated exterior handle trims featuring pre-applied adhesive backing.","ur":"دروازوں کے ہینڈلز کی خوبصورتی اور خراشوں سے تحفظ کے لیے کروم کور سیٹ۔","ur-roman":"Door handles ki decoration aur scratches se protection ke liye chrome handle covers."}'::jsonb,
    '{"en":"Decorative electroplated exterior handle trims featuring pre-applied adhesive backing.","ur":"دروازوں کے ہینڈلز کی خوبصورتی اور خراشوں سے تحفظ کے لیے کروم کور سیٹ۔","ur-roman":"Door handles ki decoration aur scratches se protection ke liye chrome handle covers."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"4 handle covers","ur":"4 ہینڈل کورز","ur-roman":"4 handle covers"}},{"label":{"en":"Finish","ur":"فنش","ur-roman":"Finish"},"value":{"en":"Chrome","ur":"کروم","ur-roman":"Chrome"}}]'::jsonb,
    v_cat_body,
    v_brand_bodycraft,
    'aftermarket',
    1300,
    null,
    33,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 33, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-SCM-01: CozyRide Leatherette Seat Cover Set (Full)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SCM-01',
    'cozyride-leatherette-seat-cover-set-full',
    '{"en":"CozyRide Leatherette Seat Cover Set (Full)","ur":"کوزی رائڈ لیدرٹ سیٹ کور سیٹ (مکمل)","ur-roman":"CozyRide Leatherette Seat Cover Set (Full)"}'::jsonb,
    '{"en":"Full vehicle tailored seat upholstery set crafted from wipe-clean faux leather with contrast stitching.","ur":"گاڑی کی اگلی اور پچھلی سیٹوں کے لیے صاف کرنے میں آسان پائیدار لیدرٹ سیٹ کورز۔","ur-roman":"Gaari ki seats ke liye wipe-clean durable leatherette seat cover set."}'::jsonb,
    '{"en":"Full vehicle tailored seat upholstery set crafted from wipe-clean faux leather with contrast stitching.","ur":"گاڑی کی اگلی اور پچھلی سیٹوں کے لیے صاف کرنے میں آسان پائیدار لیدرٹ سیٹ کورز۔","ur-roman":"Gaari ki seats ke liye wipe-clean durable leatherette seat cover set."}'::jsonb,
    '[{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Leatherette","ur":"لیدرٹ","ur-roman":"Leatherette"}},{"label":{"en":"Coverage","ur":"کوریج","ur-roman":"Coverage"},"value":{"en":"Full set","ur":"مکمل سیٹ","ur-roman":"Full set"}},{"label":{"en":"Colour","ur":"رنگ","ur-roman":"Colour"},"value":{"en":"Black with orange stitching","ur":"سیاہ بمعہ نارنجی سلائی","ur-roman":"Black with orange stitching"}}]'::jsonb,
    v_cat_seatcovers,
    v_brand_cozyride,
    'aftermarket',
    16900,
    18500,
    5,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 5, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'S'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga');

  -- Product DEMO-SCM-02: CozyRide Rubber Floor Mat Set (5 pcs)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SCM-02',
    'cozyride-rubber-floor-mat-set-5-pcs',
    '{"en":"CozyRide Rubber Floor Mat Set (5 pcs)","ur":"کوزی رائڈ ربر فلور میٹ سیٹ (5 عدد)","ur-roman":"CozyRide Rubber Floor Mat Set (5 pcs)"}'::jsonb,
    '{"en":"Deep-channel washable floor liners for cabin footwells designed to trap moisture, sand, and dust.","ur":"پاؤں کی مٹی، ریت اور پانی کو فرش کے کارپٹ تک پہنچنے سے روکنے والے واش ایبل ربر میٹس۔","ur-roman":"Cabin carpet ko dirt, sand aur paani se mehfooz rakhne walay washable rubber floor mats."}'::jsonb,
    '{"en":"Deep-channel washable floor liners for cabin footwells designed to trap moisture, sand, and dust.","ur":"پاؤں کی مٹی، ریت اور پانی کو فرش کے کارپٹ تک پہنچنے سے روکنے والے واش ایبل ربر میٹس۔","ur-roman":"Cabin carpet ko dirt, sand aur paani se mehfooz rakhne walay washable rubber floor mats."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"5","ur":"5","ur-roman":"5"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Rubber","ur":"ربر","ur-roman":"Rubber"}},{"label":{"en":"Colour","ur":"رنگ","ur-roman":"Colour"},"value":{"en":"Black","ur":"سیاہ","ur-roman":"Black"}}]'::jsonb,
    v_cat_seatcovers,
    v_brand_cozyride,
    'aftermarket',
    4200,
    null,
    25,
    5,
    false,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 25, 'initial', 'Initial demo stock opening balance');

  -- Fitment group 'A'
  delete from public.product_vehicles where product_id = v_prod_id;
  insert into public.product_vehicles (product_id, make_id, model_id, year_from, year_to, notes)
  select
    v_prod_id,
    m.make_id,
    m.id,
    m.year_from,
    m.year_to,
    'Fitment shown is sample demo data.'
  from public.vehicle_models m
  where m.slug in ('corolla', 'yaris', 'city', 'civic', 'elantra', 'alsvin', 'saga', 'alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'mira', 'cuore', 'picanto', 'dayz');

  -- Product DEMO-SCM-03: CozyRide Steering Wheel Cover
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-SCM-03',
    'cozyride-steering-wheel-cover',
    '{"en":"CozyRide Steering Wheel Cover","ur":"کوزی رائڈ اسٹیرنگ ویل کور","ur-roman":"CozyRide Steering Wheel Cover"}'::jsonb,
    '{"en":"Non-slip inner rubber ring grip cover tailored for passenger vehicle steering wheels.","ur":"اسٹیرنگ ویل پر مضبوط گرفت اور دھوپ کی گرمی سے بچاؤ کے لیے نان سلپ ویل کور۔","ur-roman":"Steering wheel par comfortable non-slip grip ke liye leather-look steering cover."}'::jsonb,
    '{"en":"Non-slip inner rubber ring grip cover tailored for passenger vehicle steering wheels.","ur":"اسٹیرنگ ویل پر مضبوط گرفت اور دھوپ کی گرمی سے بچاؤ کے لیے نان سلپ ویل کور۔","ur-roman":"Steering wheel par comfortable non-slip grip ke liye leather-look steering cover."}'::jsonb,
    '[{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Leather-look","ur":"لیدر لک","ur-roman":"Leather-look"}},{"label":{"en":"Size","ur":"سائز","ur-roman":"Size"},"value":{"en":"Standard (38 cm)","ur":"اسٹینڈرڈ (38 سینٹی میٹر)","ur-roman":"Standard (38 cm)"}}]'::jsonb,
    v_cat_seatcovers,
    v_brand_cozyride,
    'aftermarket',
    1100,
    null,
    45,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 45, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-TOL-01: TorqueWorks 46-Piece Socket Set
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TOL-01',
    'torqueworks-46-piece-socket-set',
    '{"en":"TorqueWorks 46-Piece Socket Set","ur":"ٹارک ورکس 46 پیس ساکٹ سیٹ","ur-roman":"TorqueWorks 46-Piece Socket Set"}'::jsonb,
    '{"en":"Hand tool collection containing metric drive sockets, ratchet wrench handle, extensions, and bit holders.","ur":"گاڑی کی مرمت اور بولٹ کھولنے کے لیے ریچٹ رینچ، ایکسٹینشنز اور ساکٹس کا مکمل ٹول بکس۔","ur-roman":"Automotive maintenance aur bolts ke liye ratchet wrench, extensions aur sockets tool set."}'::jsonb,
    '{"en":"Hand tool collection containing metric drive sockets, ratchet wrench handle, extensions, and bit holders.","ur":"گاڑی کی مرمت اور بولٹ کھولنے کے لیے ریچٹ رینچ، ایکسٹینشنز اور ساکٹس کا مکمل ٹول بکس۔","ur-roman":"Automotive maintenance aur bolts ke liye ratchet wrench, extensions aur sockets tool set."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"46","ur":"46","ur-roman":"46"}},{"label":{"en":"Drive","ur":"ڈرائیو","ur-roman":"Drive"},"value":{"en":"1/4 in and 1/2 in","ur":"1/4 انچ اور 1/2 انچ","ur-roman":"1/4 in and 1/2 in"}},{"label":{"en":"Case","ur":"ڈبہ","ur-roman":"Case"},"value":{"en":"Included","ur":"شامل ہے","ur-roman":"Included"}}]'::jsonb,
    v_cat_tools,
    v_brand_torqueworks,
    'aftermarket',
    6900,
    null,
    14,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 14, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-TOL-02: TorqueWorks Hydraulic Floor Jack 2 Ton
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TOL-02',
    'torqueworks-hydraulic-floor-jack-2-ton',
    '{"en":"TorqueWorks Hydraulic Floor Jack 2 Ton","ur":"ٹارک ورکس ہائیڈرولک فلور جیک 2 ٹن","ur-roman":"TorqueWorks Hydraulic Floor Jack 2 Ton"}'::jsonb,
    '{"en":"Steel hydraulic trolley jack with swivel casters and pumping lever suited for vehicle tyre changing.","ur":"پہیے تبدیل کرنے اور گاڑی کو محفوظ طور پر اٹھانے کے لیے 2 ٹن ہائیڈرولک ٹرالی جیک۔","ur-roman":"Tyre changing aur workshop use ke liye 2-ton heavy-duty hydraulic trolley jack."}'::jsonb,
    '{"en":"Steel hydraulic trolley jack with swivel casters and pumping lever suited for vehicle tyre changing.","ur":"پہیے تبدیل کرنے اور گاڑی کو محفوظ طور پر اٹھانے کے لیے 2 ٹن ہائیڈرولک ٹرالی جیک۔","ur-roman":"Tyre changing aur workshop use ke liye 2-ton heavy-duty hydraulic trolley jack."}'::jsonb,
    '[{"label":{"en":"Capacity","ur":"گنجائش","ur-roman":"Capacity"},"value":{"en":"2 ton","ur":"2 ٹن","ur-roman":"2 ton"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Hydraulic trolley jack","ur":"ہائیڈرولک ٹرالی جیک","ur-roman":"Hydraulic trolley jack"}}]'::jsonb,
    v_cat_tools,
    v_brand_torqueworks,
    'aftermarket',
    10900,
    11500,
    6,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    true,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 6, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-TOL-03: TorqueWorks 12V Portable Tyre Inflator
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-TOL-03',
    'torqueworks-12v-portable-tyre-inflator',
    '{"en":"TorqueWorks 12V Portable Tyre Inflator","ur":"ٹارک ورکس 12V پورٹیبل ٹائر انفلریٹر","ur-roman":"TorqueWorks 12V Portable Tyre Inflator"}'::jsonb,
    '{"en":"Compact air compressor powered via vehicle accessory outlet with digital target pressure display.","ur":"گاڑی کے 12 وولٹ سگریٹ لائٹر ساکٹ سے چلنے والا ڈیجیٹل پریشر گیج ایئر کمپریسر۔","ur-roman":"12V cigarette lighter socket se chalne wala portable digital tyre air compressor."}'::jsonb,
    '{"en":"Compact air compressor powered via vehicle accessory outlet with digital target pressure display.","ur":"گاڑی کے 12 وولٹ سگریٹ لائٹر ساکٹ سے چلنے والا ڈیجیٹل پریشر گیج ایئر کمپریسر۔","ur-roman":"12V cigarette lighter socket se chalne wala portable digital tyre air compressor."}'::jsonb,
    '[{"label":{"en":"Power","ur":"پاور","ur-roman":"Power"},"value":{"en":"12V car socket","ur":"12 وولٹ کار ساکٹ","ur-roman":"12V car socket"}},{"label":{"en":"Gauge","ur":"گیج","ur-roman":"Gauge"},"value":{"en":"Digital","ur":"ڈیجیٹل","ur-roman":"Digital"}}]'::jsonb,
    v_cat_tools,
    v_brand_torqueworks,
    'aftermarket',
    3800,
    null,
    0,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 0, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-CCA-01: ShinePro Car Shampoo 1L
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-CCA-01',
    'shinepro-car-shampoo-1l',
    '{"en":"ShinePro Car Shampoo 1L","ur":"شائن پرو کار شیمپو 1L","ur-roman":"ShinePro Car Shampoo 1L"}'::jsonb,
    '{"en":"Neutral formulation vehicle washing liquid for dissolving road grime without stripping existing wax layers.","ur":"گاڑی کی پینٹ چمک برقرار رکھتے ہوئے مٹی اور چکنائی صاف کرنے والا واشنگ شیمپو۔","ur-roman":"Paint gloss ko nuksan pohanchaye baghair dirt saaf karne wala car washing shampoo."}'::jsonb,
    '{"en":"Neutral formulation vehicle washing liquid for dissolving road grime without stripping existing wax layers.","ur":"گاڑی کی پینٹ چمک برقرار رکھتے ہوئے مٹی اور چکنائی صاف کرنے والا واشنگ شیمپو۔","ur-roman":"Paint gloss ko nuksan pohanchaye baghair dirt saaf karne wala car washing shampoo."}'::jsonb,
    '[{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"1 L","ur":"1 لیٹر","ur-roman":"1 L"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Car shampoo","ur":"کار شیمپو","ur-roman":"Car shampoo"}}]'::jsonb,
    v_cat_carcare,
    v_brand_shinepro,
    'aftermarket',
    750,
    null,
    60,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 60, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-CCA-02: ShinePro Dashboard Polish 300ml
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-CCA-02',
    'shinepro-dashboard-polish-300ml',
    '{"en":"ShinePro Dashboard Polish 300ml","ur":"شائن پرو ڈیش بورڈ پالش 300ml","ur-roman":"ShinePro Dashboard Polish 300ml"}'::jsonb,
    '{"en":"Interior cabin conditioning spray designed to clean plastic dashboard surfaces and leave a matte finish.","ur":"ڈیش بورڈ، ڈور پینلز اور اندرونی پلاسٹک کو نیا لک دینے کے لیے انٹیریئر پالش۔","ur-roman":"Dashboard aur interior plastic parts ko clean aur shine dene ke liye aerosol polish."}'::jsonb,
    '{"en":"Interior cabin conditioning spray designed to clean plastic dashboard surfaces and leave a matte finish.","ur":"ڈیش بورڈ، ڈور پینلز اور اندرونی پلاسٹک کو نیا لک دینے کے لیے انٹیریئر پالش۔","ur-roman":"Dashboard aur interior plastic parts ko clean aur shine dene ke liye aerosol polish."}'::jsonb,
    '[{"label":{"en":"Pack","ur":"پیکنگ","ur-roman":"Pack"},"value":{"en":"300 ml","ur":"300 ملی لیٹر","ur-roman":"300 ml"}},{"label":{"en":"Type","ur":"قسم","ur-roman":"Type"},"value":{"en":"Dashboard polish","ur":"ڈیش بورڈ پالش","ur-roman":"Dashboard polish"}}]'::jsonb,
    v_cat_carcare,
    v_brand_shinepro,
    'aftermarket',
    650,
    null,
    48,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 48, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  -- Product DEMO-CCA-03: ShinePro Microfiber Cloth Pack (6 pcs)
  insert into public.products (
    sku, slug, name, short_description, description, specs,
    category_id, brand_id, part_origin, price, compare_at_price,
    stock_qty, low_stock_threshold, is_universal, warranty,
    is_featured, is_active, is_demo
  ) values (
    'DEMO-CCA-03',
    'shinepro-microfiber-cloth-pack-6-pcs',
    '{"en":"ShinePro Microfiber Cloth Pack (6 pcs)","ur":"شائن پرو مائیکرو فائبر کلاتھ پیک (6 عدد)","ur-roman":"ShinePro Microfiber Cloth Pack (6 pcs)"}'::jsonb,
    '{"en":"Lint-free soft microfibre detailing towels for vehicle drying, glass cleaning, and wax buffing.","ur":"گاڑی دھونے کے بعد صفائی، گلاس پالش اور ویکس چمکانے کے لیے 6 عدد نرم مائیکرو فائبر تولیے۔","ur-roman":"Gaari drying, glass cleaning aur wax buffing ke liye 6-piece soft microfiber cloths."}'::jsonb,
    '{"en":"Lint-free soft microfibre detailing towels for vehicle drying, glass cleaning, and wax buffing.","ur":"گاڑی دھونے کے بعد صفائی، گلاس پالش اور ویکس چمکانے کے لیے 6 عدد نرم مائیکرو فائبر تولیے۔","ur-roman":"Gaari drying, glass cleaning aur wax buffing ke liye 6-piece soft microfiber cloths."}'::jsonb,
    '[{"label":{"en":"Pieces","ur":"تعداد","ur-roman":"Pieces"},"value":{"en":"6","ur":"6","ur-roman":"6"}},{"label":{"en":"Material","ur":"مٹیریل","ur-roman":"Material"},"value":{"en":"Microfiber","ur":"مائیکرو فائبر","ur-roman":"Microfiber"}}]'::jsonb,
    v_cat_carcare,
    v_brand_shinepro,
    'aftermarket',
    900,
    null,
    70,
    5,
    true,
    'Warranty terms are confirmed by the workshop.',
    false,
    true,
    true
  )
  on conflict (sku) do update set
    slug = excluded.slug,
    name = excluded.name,
    short_description = excluded.short_description,
    description = excluded.description,
    specs = excluded.specs,
    category_id = excluded.category_id,
    brand_id = excluded.brand_id,
    part_origin = excluded.part_origin,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    stock_qty = excluded.stock_qty,
    low_stock_threshold = excluded.low_stock_threshold,
    is_universal = excluded.is_universal,
    warranty = excluded.warranty,
    is_featured = excluded.is_featured,
    is_active = true,
    is_demo = true,
    updated_at = now()
  returning id into v_prod_id;

  -- Initial opening stock movement
  delete from public.stock_movements where product_id = v_prod_id and reason = 'initial';
  insert into public.stock_movements (product_id, delta, reason, note)
  values (v_prod_id, 70, 'initial', 'Initial demo stock opening balance');

  -- Universal fit: clear any vehicle links
  delete from public.product_vehicles where product_id = v_prod_id;

  raise notice 'Successfully seeded Phase 5 Content Pack: 16 categories, 15 brands, 48 products.';
end;
$$;

-- =============================================================================
-- VERIFICATION QUERIES (Check after running seed)
-- Expected counts:
--   Categories: 16 (all active)
--   Brands: 15 (all is_demo = true)
--   Products: 48 (all is_demo = true)
--   Out of stock: exactly 3 (DEMO-OIL-03, DEMO-LGT-03, DEMO-TOL-03)
--   Low stock (<= 5): exactly 3 (DEMO-OIL-02, DEMO-SUS-03, DEMO-SCM-01)
--   Featured: exactly 12
--   Sale price: exactly 8
-- =============================================================================
-- select count(*) as total_categories from public.product_categories where is_active = true;
-- select count(*) as demo_brands from public.brands where is_demo = true;
-- select count(*) as demo_products from public.products where is_demo = true;
-- select count(*) as out_of_stock from public.products where is_demo = true and stock_qty = 0;
-- select count(*) as low_stock from public.products where is_demo = true and stock_qty > 0 and stock_qty <= 5;
-- select count(*) as featured_products from public.products where is_demo = true and is_featured = true;
-- select count(*) as on_sale from public.products where is_demo = true and compare_at_price is not null and compare_at_price > price;
