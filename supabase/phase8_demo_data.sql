-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 8 DEMO DATA SQL
-- =============================================================================
-- Safe to run multiple times (idempotent).
-- Seeds:
--   - 4 blog categories
--   - 8 published guides (useful, accurate advice, "check owner's manual", trilingual)
--   - 12 sample customer reviews (marked "Demo Customer", mixed 3-5 stars, 2 pending, 1 hidden, 2 replies)
--   - 12 gallery items (workshop, repairs, before/after pairs, parts, team)
-- All demo records have is_demo = true.
-- =============================================================================

do $$
declare
  v_cat_maint uuid;
  v_cat_buying uuid;
  v_cat_trouble uuid;
  v_cat_driving uuid;

  v_srv_engine uuid;
  v_srv_denting uuid;
  v_srv_ac uuid;
  v_srv_electrical uuid;
  v_srv_tyres uuid;
  v_srv_detailing uuid;
  v_srv_brakes uuid;
  v_srv_suspension uuid;
  v_srv_oil uuid;
  v_srv_battery uuid;

  v_pcat_oil uuid;
  v_pcat_filters uuid;
  v_pcat_brakes uuid;
  v_pcat_batteries uuid;
  v_pcat_tyres uuid;
  v_pcat_ac uuid;
  v_pcat_suspension uuid;
begin
  -- Lookup service IDs
  select id into v_srv_engine from public.services where slug = 'engine' limit 1;
  select id into v_srv_denting from public.services where slug = 'denting-painting' limit 1;
  select id into v_srv_ac from public.services where slug = 'ac-repair' limit 1;
  select id into v_srv_electrical from public.services where slug = 'electrical' limit 1;
  select id into v_srv_tyres from public.services where slug = 'tyres' limit 1;
  select id into v_srv_detailing from public.services where slug = 'car-wash-detailing' limit 1;
  select id into v_srv_brakes from public.services where slug = 'brakes' limit 1;
  select id into v_srv_suspension from public.services where slug = 'suspension-steering' limit 1;
  select id into v_srv_oil from public.services where slug = 'oil-change-service' limit 1;
  select id into v_srv_battery from public.services where slug = 'battery' limit 1;

  -- Lookup product category IDs
  select id into v_pcat_oil from public.product_categories where slug in ('oils-lubricants', 'engine-oil-fluids') limit 1;
  select id into v_pcat_filters from public.product_categories where slug = 'filters' limit 1;
  select id into v_pcat_brakes from public.product_categories where slug in ('brakes', 'braking-system') limit 1;
  select id into v_pcat_batteries from public.product_categories where slug = 'batteries' limit 1;
  select id into v_pcat_tyres from public.product_categories where slug in ('tyres-wheels') limit 1;
  select id into v_pcat_ac from public.product_categories where slug in ('ac-cooling', 'ac-parts') limit 1;
  select id into v_pcat_suspension from public.product_categories where slug = 'suspension-steering' limit 1;

  -- 1. BLOG CATEGORIES
  insert into public.blog_categories (slug, name, sort_order, is_active)
  values
    ('maintenance', '{"en": "Maintenance & Car Care", "ur": "گاڑی کی دیکھ بھال اور حفاظت", "ur-roman": "Gaari Ki Dekhbhal Aur Hifazat"}'::jsonb, 1, true),
    ('parts-buying', '{"en": "Spare Parts & Buying Guides", "ur": "اسپیئر پارٹس اور خریداری گائیڈ", "ur-roman": "Spare Parts Aur Khareedari Guide"}'::jsonb, 2, true),
    ('troubleshooting', '{"en": "Diagnostics & Troubleshooting", "ur": "خرابیوں کی تشخیص اور رہنمائی", "ur-roman": "Kharabiyon Ki Tashkhees Aur Rehnumai"}'::jsonb, 3, true),
    ('pakistan-driving', '{"en": "Driving & Local Road Conditions", "ur": "پاکستانی سڑکیں اور سفری تجاویز", "ur-roman": "Pakistani Sadkain Aur Safri Tajaveez"}'::jsonb, 4, true)
  on conflict (slug) do update set
    name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

  select id into v_cat_maint from public.blog_categories where slug = 'maintenance';
  select id into v_cat_buying from public.blog_categories where slug = 'parts-buying';
  select id into v_cat_trouble from public.blog_categories where slug = 'troubleshooting';
  select id into v_cat_driving from public.blog_categories where slug = 'pakistan-driving';

  -- 2. BLOG POSTS (Clean existing demo blog posts first)
  delete from public.blog_posts where is_demo = true;

  -- Guide 1: Engine Oil Basics
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'engine-oil-basics',
    '{"en": "Engine Oil Basics: Viscosity, Grades & Change Intervals", "ur": "انجن آئل کی بنیادی معلومات: گریڈز، وسکوسٹی اور تبدیلی کے اوقات", "ur-roman": "Engine Oil Basics: Viscosity, Grades Aur Change Interval"}'::jsonb,
    '{"en": "Understand motor oil numbers like 5W-30 and 10W-40, why regular changes protect internal engine parts, and how to verify the right grade in your owner''s manual.", "ur": "انجن آئل کے نمبرز جیسے 5W-30 کا مطلب اور انجن کی لمبی زندگی کے لیے آئل کی بروقت تبدیلی کے رہنما اصول۔", "ur-roman": "Engine oil ke grades, 5W-30 ka matlab aur timely oil change ke ahem faiday."}'::jsonb,
    '{"en": "## The Role of Engine Oil\n\nMotor oil is the single most critical fluid in your vehicle. It lubricates moving pistons and camshafts, draws heat away from combustion chambers, prevents acidic oxidation, and traps carbon particles until your next oil filter change.\n\n### Deciphering Oil Viscosity Grades\nOil bottles carry alphanumeric grades defined by the Society of Automotive Engineers (SAE):\n\n- **The \"W\" Number (e.g., 0W, 5W, 10W)**: Indicates \"Winter\" or cold-start flow rate. A lower number means the oil flows faster during cold morning starts, reducing initial friction before the engine reaches operating temperature.\n- **The Second Number (e.g., 20, 30, 40)**: Represents viscosity at 100°C engine operating temperature. Thicker oil provides higher film strength under load.\n\n### Mineral vs Synthetic\n- **Mineral Oils**: Traditional refined petroleum suited for simple or vintage engines. Shorter lifespan (~3,000 to 4,000 km).\n- **Fully Synthetic Oils**: Engineered molecules offering superior thermal resistance and protection up to 8,000–10,000 km.\n\n> **Important:** Always check your vehicle owner''s manual for the exact manufacturer-recommended viscosity and API specification (e.g., API SP / ILSAC GF-6).\n\n### When Should You Check Your Oil Level?\n1. Park on level ground and let the engine rest for 5–10 minutes after driving.\n2. Pull the dipstick, wipe it clean with a rag, re-insert fully, and remove again.\n3. The level should sit comfortably between the MIN and MAX markers. If dark, gritty, or smelling strongly of unburnt petrol, schedule an inspection.",
      "ur": "## انجن آئل کی اہمیت\n\nانجن آئل گاڑی کی جان ہے۔ یہ پرزوں کے درمیان رگڑ کو کم کرتا ہے اور گرمی کو دور کرتا ہے۔\n\n### آئل نمبرز کا مطلب\n- **W نمبر (جیسے 5W)**: سردی میں تیل کے بہاؤ کی رفتار کو ظاہر کرتا ہے۔\n- **دوسرا نمبر (جیسے 30 یا 40)**: گرم حالت میں تیل کے گاڑھے پن کی پیمائش ہے۔\n\n**اہم ہدایت:** اپنی گاڑی کے مالک کی کتاب (Owner''s Manual) میں تجویز کردہ گریڈ ہی استعمال کریں۔",
      "ur-roman": "## Engine Oil Ki Maloomat\n\nEngine oil aapki gaari ke internal parts ko ghisne se bachata hai.\n\n### Zaroori Baatein:\n1. **Owner''s manual check karein**: Manufacturer ka recommend kiya hua oil grade hi istemal karein.\n2. **Dipstick se level check karein**: Oil level hamesha MIN aur MAX ke darmian hona chahiye.\n3. **Oil filter zaroor badlein**: Har oil change par naya filter lagana zaroori hai."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/10/s71pHYGAuUiyxdfXpIet/image.jpg',
    v_cat_maint,
    array['Engine Oil', 'Lubricants', 'Maintenance', 'Car Care'],
    'Pak Auto Works Technical Team',
    true,
    now() - interval '4 days',
    case when v_srv_oil is not null then array[v_srv_oil] else '{}'::uuid[] end,
    case when v_pcat_oil is not null then array[v_pcat_oil, v_pcat_filters] else '{}'::uuid[] end,
    '{"en": "Engine Oil Basics Guide | Pak Auto Works", "ur": "انجن آئل کی بنیادی گائیڈ | پاک آٹو ورکس", "ur-roman": "Engine Oil Basics Guide"}'::jsonb,
    '{"en": "Learn motor oil viscosities, grades, and maintenance guidelines. Check your vehicle owner''s manual with advice from Pak Auto Works.", "ur": "انجن آئل کے گریڈز اور دیکھ بھال کی مکمل معلومات۔", "ur-roman": "Engine oil grades aur maintenance checklist."}'::jsonb,
    true
  );

  -- Guide 2: Dashboard Warning Lights
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'dashboard-warning-lights',
    '{"en": "Dashboard Warning Lights Explained: What They Mean and What to Do", "ur": "ڈیش بورڈ وارننگ لائٹس کی وضاحت: کس لائٹ کا کیا مطلب ہے اور کیا کرنا چاہیے", "ur-roman": "Dashboard Warning Lights Explained: Matlab Aur Hal"}'::jsonb,
    '{"en": "Decode common dashboard symbols including Check Engine, Oil Pressure, Battery, ABS, and Brake warnings. Learn which require immediate stops.", "ur": "چیک انجن، آئل پریشر، بیٹری اور اے بی ایس لائٹس کی علامات اور بروقت حفاظتی اقدامات کی تفصیل۔", "ur-roman": "Check engine, oil pressure aur battery lights ka matlab aur emergency precautions."}'::jsonb,
    '{"en": "## Understanding Your Car''s Warning System\n\nWhen modern computer modules detect values outside normal operating parameters, warning symbols illuminate on your instrument cluster. Understanding their color coding helps you respond safely.\n\n### The Color Code Rule\n- **Red Symbols**: Immediate danger to vehicle safety or mechanical components. Safely pull over, shut off the engine, and investigate before driving further.\n- **Amber / Yellow Symbols**: Advisory or non-immediate fault detected. The vehicle can typically be driven to a workshop, but should not be neglected.\n- **Green / Blue Symbols**: Operational status indicators (e.g., high beams, headlights, cruise control).\n\n### Top 4 Critical Warnings\n1. **Check Engine Light (MIL)**: Indicates an emissions, ignition, or sensor fault. If flashing, an engine misfire is occurring that can damage the catalytic converter; reduce speed immediately.\n2. **Oil Can Symbol (Low Oil Pressure)**: Severe lack of lubrication pressure. Stop the car immediately. Running with zero oil pressure causes catastrophic engine seizure within minutes.\n3. **Battery / Alternator Light**: The electrical charging system is malfunctioning. The engine is running solely on battery reserves.\n4. **Brake Warning Symbol**: Either the handbrake is engaged, hydraulic brake fluid is critically low, or brake booster pressure has dropped.\n\n> **Safety Note:** Refer to your owner''s manual for vehicle-specific instrument cluster definitions. Computerized OBD-II scanning at Pak Auto Works quickly retrieves exact Diagnostic Trouble Codes (DTCs).",
      "ur": "## ڈیش بورڈ لائٹس کی اقسام\n\n- **سرخ لائٹس**: فوری خطرے کی علامت۔ گاڑی کو فوراً سائیڈ پر روکیں اور معائنہ کریں۔\n- **پیلے رنگ کی لائٹس**: سسٹم میں خرابی کی اطلاع۔ جلد از جلد ورکشاپ سے رابطہ کریں۔\n\nمزید معلومات کے لیے گاڑی کے مینوئل کا مطالعہ کریں۔",
      "ur-roman": "## Warning Lights Ki Pehchan\n\n- **Red Light**: Khatre ki nishani. Gaari rok kar engine band karein.\n- **Yellow/Amber Light**: Fault detect hua hai, workshop mein checkup karwayein.\n\nOwner''s manual mein cluster symbols ki mukammal detail mojood hoti hai."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg',
    v_cat_trouble,
    array['Warning Lights', 'Diagnostics', 'OBD-II', 'Safety'],
    'Pak Auto Works Diagnostic Bay',
    true,
    now() - interval '8 days',
    case when v_srv_engine is not null then array[v_srv_engine, v_srv_electrical] else '{}'::uuid[] end,
    case when v_pcat_filters is not null then array[v_pcat_filters] else '{}'::uuid[] end,
    '{"en": "Dashboard Warning Lights Guide | Pak Auto Works", "ur": "ڈیش بورڈ وارننگ لائٹس گائیڈ | پاک آٹو ورکس", "ur-roman": "Dashboard Warning Lights Guide"}'::jsonb,
    '{"en": "What to do when check engine, oil, battery, or brake lights appear on your car dashboard. Consult your owner''s manual.", "ur": "ڈیش بورڈ وارننگ لائٹس کا مطلب اور ضروری تدابیر۔", "ur-roman": "Dashboard warning lights ki complete guide."}'::jsonb,
    true
  );

  -- Guide 3: Tyre Pressure & Care
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'tyre-pressure-and-care',
    '{"en": "Tyre Pressure, Rotation & Care: Safe Driving on Pakistani Roads", "ur": "ٹائروں کا پریشر، روٹیشن اور دیکھ بھال: محفوظ ڈرائیونگ کے اصول", "ur-roman": "Tyre Pressure, Rotation Aur Hifazat Guide"}'::jsonb,
    '{"en": "Learn the importance of maintaining proper PSI, inspecting tread wear patterns, and why tyre rotation every 10,000 km extends tyre life.", "ur": "صحیح ٹائر پریشر، ٹریڈ گہرائی اور ہر 10,000 کلومیٹر پر ٹائر روٹیشن کے فوائد اور رہنمائی۔", "ur-roman": "Sahi tyre pressure, tread depth aur regular rotation se tyre ki lambi umar."}'::jsonb,
    '{"en": "## The Only Four Points Touching the Road\n\nYour tyres are the sole point of contact between your vehicle and the asphalt. Correct tyre inflation and alignment ensure predictable braking distances, crisp steering response, and optimal fuel economy.\n\n### 1. Check Tyre Pressure When Cold\nAir expands when heated by road friction and summer temperatures. Always test tyre pressure in the morning before driving more than a couple of kilometers, using an accurate gauge.\n\n- The recommended cold PSI is listed on the **driver''s door jamb sticker** or in your vehicle owner''s manual — NOT the maximum pressure molded on the tyre sidewall.\n- Remember to inspect your spare tyre (Stepney) monthly so it is ready during emergencies.\n\n### 2. Routine Tyre Rotation\nFront tyres wear faster on steering and braking duties than rear tyres. Rotating tyres every **8,000 to 10,000 km** in a crisscross or front-to-rear pattern evens out tread wear.\n\n### 3. Read Tread Wear Signs\n- **Wear on both outer edges**: Chronic under-inflation.\n- **Wear strictly down the center**: Chronic over-inflation.\n- **Uneven inner or outer edge wear**: Misaligned wheel camber or toe settings.\n\nPak Auto Works features computerized wheel balancing and 3D alignment bays to maintain perfect vehicle stability.",
      "ur": "## ٹائروں کی حفاظت اور دیکھ بھال\n\nٹائر گاڑی کی حفاظت کے لیے بنیادی عنصر ہیں۔ درست پریشر رکھنے سے پیٹرول کی بچت اور بریکوں کی کارکردگی بہتر ہوتی ہے۔\n\n### ضروری نکات:\n1. ٹائر کا پریشر ڈرائیور کے دروازے پر لگے اسٹیکر یا مالک کی کتاب کے مطابق رکھیں۔\n2. ہر 10,000 کلومیٹر پر ٹائروں کی روٹیشن کروائیں۔",
      "ur-roman": "## Tyre Maintenance Tips\n\nSahi tyre pressure fuel economy aur safar ki hifazat ke liye laazmi hai.\n\n### Ahem Nuskhe:\n1. Door frame ya owner''s manual se sahi PSI check karein.\n2. Subah ke waqt cold tyres ka pressure check karein.\n3. Har 10,000 km par tyres rotate karwayein."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/10/nwz6vbqK7nSjjDuNVCQD/image.png',
    v_cat_maint,
    array['Tyres', 'Safety', 'Wheel Alignment', 'Maintenance'],
    'Pak Auto Works Suspension Team',
    true,
    now() - interval '12 days',
    case when v_srv_tyres is not null then array[v_srv_tyres, v_srv_suspension] else '{}'::uuid[] end,
    case when v_pcat_tyres is not null then array[v_pcat_tyres] else '{}'::uuid[] end,
    '{"en": "Car Tyre Pressure & Care Guide | Pak Auto Works", "ur": "کار ٹائر کیئر اور پریشر گائیڈ | پاک آٹو ورکس", "ur-roman": "Tyre Pressure & Care Guide"}'::jsonb,
    '{"en": "Tips for checking tyre pressure, tread wear, and rotation intervals. Follow your vehicle owner''s manual.", "ur": "ٹائروں کے پریشر اور روٹیشن کی مکمل گائیڈ۔", "ur-roman": "Tyre pressure aur maintenance guide."}'::jsonb,
    true
  );

  -- Guide 4: Preparing Your AC for Summer
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'preparing-your-ac-for-summer',
    '{"en": "Preparing Your Car AC for Summer: Condenser, Gas & Filter Tips", "ur": "گرمیوں کے لیے گاڑی کا اے سی تیار کریں: کنڈینسر، گیس اور فلٹر ٹپس", "ur-roman": "Garmiyon Ke Liye Car AC Tayar Karein: Tips & Guide"}'::jsonb,
    '{"en": "Ensure crisp, frosty cabin cooling before peak temperatures hit. Simple steps for cabin air filters, condenser cleaning, and refrigerant leak checks.", "ur": "شدید گرمی سے قبل گاڑی کے اے سی کی تسلی بخش کولنگ، گیس پریشر اور کیبن فلٹر کی صفائی کے رہنما اصول۔", "ur-roman": "Garmi se pehle car AC ki gas, condenser aur cabin filter checking guide."}'::jsonb,
    '{"en": "## Beat the Heat with Proactive AC Care\n\nWhen daytime temperatures exceed 40°C in southern regions, a neglected air conditioning system struggles to bring the cabin down to a comfortable temperature. Pre-season maintenance prevents mid-journey compressor failures.\n\n### 1. Replace the Cabin Air Filter\nA clogged cabin filter chokes blower airflow and retains moisture, causing musty interior smells and foggy windows. Replacing it before summer restores maximum cubic-feet-per-minute (CFM) air delivery.\n\n### 2. Clear the External Condenser\nThe AC condenser sits in front of your car radiator. Clean the cooling fins gently with low-pressure water or compressed air to dislodge insects and dust accumulated over winter.\n\n### 3. Check for Refrigerant Leaks\nCar AC units are sealed. If cooling output feels weak or inconsistent, refrigerant gas has escaped through a dried O-ring, seal, or microscopic evaporator leak.\n\n> **Advice:** Have a qualified technician verify high and low side system pressures using certified gauges before adding gas. Follow manufacturer specifications for exact R134a or R1234yf fill weight.",
      "ur": "## گرمیوں میں اے سی کی دیکھ بھال\n\nگرمی شروع ہونے سے پہلے اے سی کا معائنہ کرا لیں:\n1. کیبن فلٹر تبدیل کریں۔\n2. کنڈینسر کی جالیوں سے مٹی صاف کریں۔\n3. گیس کے پریشر کی تسلی کریں۔\n\nمزید تفصیلات اپنی گاڑی کی بکلیٹ میں دیکھیں۔",
      "ur-roman": "## Summer Car AC Preparation\n\nGarmi mein behtareen cooling ke liye:\n1. **Cabin Filter badlein**: Saaf hawa aur tez cooling ke liye.\n2. **Condenser saaf karein**: Mitti jamne se AC par bojh parta hai.\n3. **Gas leak check**: Agar cooling kam ho to pressure test karwayein."}'::jsonb,
    'https://cdn.phototourl.com/member/2026-10-10-fdc8b7bd-9856-4687-a17d-bbb0420cc7b6.jpg',
    v_cat_maint,
    array['AC Repair', 'Summer', 'Cooling', 'Cabin Filter'],
    'Pak Auto Works AC Bay',
    true,
    now() - interval '16 days',
    case when v_srv_ac is not null then array[v_srv_ac] else '{}'::uuid[] end,
    case when v_pcat_ac is not null then array[v_pcat_ac, v_pcat_filters] else '{}'::uuid[] end,
    '{"en": "Preparing Car AC for Summer | Pak Auto Works", "ur": "گرمیوں کے لیے کار اے سی گائیڈ | پاک آٹو ورکس", "ur-roman": "Summer Car AC Preparation Guide"}'::jsonb,
    '{"en": "Get your vehicle air conditioner ready for high summer heat. Filter, condenser, and refrigerant maintenance tips.", "ur": "گاڑی کے اے سی کی دیکھ بھال اور تجاویز۔", "ur-roman": "Car AC summer prep tips."}'::jsonb,
    true
  );

  -- Guide 5: Driving in the Monsoon
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'driving-in-the-monsoon',
    '{"en": "Driving Safely in the Monsoon: Wipers, Hydroplaning & Brakes", "ur": "مون سون میں محفوظ ڈرائیونگ: وائپرز، پانی پر پھسلن اور بریک کی احتیاط", "ur-roman": "Monsoon Car Driving Safety: Wipers, Brakes & Rain Tips"}'::jsonb,
    '{"en": "Heavy monsoon downpours present unique hazards including reduced visibility and flooded streets. Learn essential precautions for wet-weather driving.", "ur": "بارش کے موسم میں وائپرز کی حالت، پانی کھڑے راستوں سے بچاؤ اور بریک لگانے کی محفوظ تکنیک۔", "ur-roman": "Barsat ke mausam mein hydroplaning se bachne aur wiper blades check karne ki guide."}'::jsonb,
    '{"en": "## Navigating Wet Weather and Heavy Downpours\n\nMonsoon rains transform road surfaces rapidly. Oil residue on dry asphalt mixes with initial raindrops to create an exceptionally slick film before being washed away.\n\n### 1. Fresh Wiper Blades & Washer Fluid\nWiper rubber perishes under hot sun. If blades streak, chatter, or leave unwiped patches, replace them promptly. Top up your washer fluid reservoir with water and glass cleaner.\n\n### 2. Preventing Hydroplaning (Aquaplaning)\nHydroplaning happens when water builds up between tyres and the road faster than tread grooves can channel it away, leading to a momentary loss of steering. Maintain at least 3mm of tread depth and reduce highway speeds during rainfall.\n\n### 3. Crossing Standing Water Safely\n- Never enter flooded roads if you cannot judge the depth or if water exceeds half the wheel rim height.\n- If crossing shallow water, proceed slowly in low gear at steady engine RPM to prevent backflow into the exhaust or air intake.\n- After exiting water, tap your brake pedal gently several times to dry the friction surfaces.\n\n> **Reminder:** Always prioritize safety and adjust speeds to road conditions.",
      "ur": "## بارش اور مون سون میں ڈرائیونگ\n\nبارش میں سڑکوں پر پھسلن بڑھ جاتی ہے۔\n1. وائپر بلیڈز نئے لگائیں اگر وہ دھندلاہٹ چھوڑ رہے ہوں۔\n2. کھڑے پانی میں تیز رفتاری سے نہ جائیں۔\n3. پانی سے نکلنے کے بعد ہلکی بریک لگا کر پیڈز کو خشک کریں۔",
      "ur-roman": "## Monsoon Driving Tips\n\nBarish ke dino mein:\n1. **Wiper blades check karein**: Clear vision safar ki pehli shart hai.\n2. **Slow drive karein**: Hydroplaning se bachne ke liye speed munasib rakhein.\n3. **Brakes test karein**: Paani se nikal kar brake halki daba kar dry karein."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/10/2tdS7EMNiVYKWW8c2s5e/image.png',
    v_cat_driving,
    array['Monsoon', 'Rain', 'Wipers', 'Road Safety'],
    'Pak Auto Works Safety Desk',
    true,
    now() - interval '20 days',
    case when v_srv_tyres is not null then array[v_srv_tyres, v_srv_brakes] else '{}'::uuid[] end,
    case when v_pcat_tyres is not null then array[v_pcat_tyres] else '{}'::uuid[] end,
    '{"en": "Monsoon Driving Safety Guide | Pak Auto Works", "ur": "مون سون ڈرائیونگ گائیڈ | پاک آٹو ورکس", "ur-roman": "Monsoon Car Driving Guide"}'::jsonb,
    '{"en": "Safe driving advice for heavy monsoon rain, wet road braking, and wiper maintenance. Consult your vehicle owner''s manual.", "ur": "بارش میں محفوظ ڈرائیونگ کی تجاویز۔", "ur-roman": "Barsat mein car care aur driving tips."}'::jsonb,
    true
  );

  -- Guide 6: Battery Health & Care
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'battery-health-and-care',
    '{"en": "Car Battery Health & Maintenance: Signs of Impending Failure", "ur": "گاڑی کی بیٹری کی صحت اور دیکھ بھال: کمزور ہونے کی ابتدائی علامات", "ur-roman": "Car Battery Health & Maintenance: Weak Hone Ki Nishaniyan"}'::jsonb,
    '{"en": "Discover how extreme weather impacts lead-acid and AGM batteries, what corroded terminals indicate, and when to test battery voltage.", "ur": "بیٹری کی لائف بڑھانے کے طریقے، ٹرمینلز پر کائی کی صفائی اور کرینکنگ کے وقت وولٹیج کی جانچ۔", "ur-roman": "Car battery weak hone ke signs, terminal cleaning aur timely replacement tips."}'::jsonb,
    '{"en": "## The Heart of Your Electrical System\n\nYour battery supplies electrical power to start the starter motor, stabilizes electrical voltage, and runs accessories when the engine is stationary. In demanding climates, car batteries typically last between 2 and 3 years.\n\n### Warning Signs of a Dying Battery\n1. **Sluggish Engine Crank**: The starter turns slowly or groans when you turn the key or press the start button.\n2. **Flickering Headlights on Idle**: Lights brighten noticeably when pressing the accelerator pedal.\n3. **White / Blue Powder on Terminals**: Acid vapor creates corrosion on battery posts, introducing electrical resistance.\n4. **Swollen Battery Casing**: Excessive heat exposure can cause the plastic casing to bloat, signaling cell failure.\n\n### Routine Upkeep Tips\n- Clean battery posts using a mixture of baking soda and warm water with a wire brush.\n- Ensure the hold-down bracket is snug; road vibration physically shakes active material loose from lead plates inside.\n- Have a multi-meter test performed during your regular service visits.\n\n> **Check Specs:** Always check your owner''s manual for the correct amp-hour (Ah) rating and cold-cranking amps (CCA).",
      "ur": "## بیٹری کی نگہداشت\n\nبیٹری گاڑی کا اہم برقی حصہ ہے:\n1. سست اسٹارٹ ہونا کمزوری کی نشانی ہے۔\n2. ٹرمینلز پر جمی کائی کو نیم گرم پانی اور برش سے صاف کریں۔\n3. بیٹری کو ہمیشہ مضبوطی سے فکس رکھیں۔",
      "ur-roman": "## Car Battery Care\n\nBattery ki lambi life ke liye:\n1. **Cranking speed notice karein**: Agar start lamba ho to battery check karwayein.\n2. **Terminals saaf rakhein**: Corrosion saaf karne se current flow theek rehta hai.\n3. **Owner''s manual dekhein**: Gaari ke mutabiq sahi Ah aur CCA rating ki battery lagayein."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/o3W5EwwTRxsH9rffpR6v/image.png',
    v_cat_maint,
    array['Battery', 'Electrical', 'Starting', 'Maintenance'],
    'Pak Auto Works Auto-Electric Bay',
    true,
    now() - interval '25 days',
    case when v_srv_battery is not null then array[v_srv_battery, v_srv_electrical] else '{}'::uuid[] end,
    case when v_pcat_batteries is not null then array[v_pcat_batteries] else '{}'::uuid[] end,
    '{"en": "Car Battery Health & Maintenance Guide | Pak Auto Works", "ur": "کار بیٹری کیئر گائیڈ | پاک آٹو ورکس", "ur-roman": "Car Battery Maintenance Guide"}'::jsonb,
    '{"en": "How to prolong car battery lifespan and spot warning signs before getting stranded. Follow your vehicle owner''s manual.", "ur": "گاڑی کی بیٹری کی دیکھ بھال کی مکمل معلومات۔", "ur-roman": "Car battery care aur replacement tips."}'::jsonb,
    true
  );

  -- Guide 7: When to Replace Brake Pads
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'when-to-replace-brake-pads',
    '{"en": "When to Replace Brake Pads: Warning Signs & Thickness Guidelines", "ur": "بریک پیڈز کب تبدیل کیے جائیں: اہم علامات اور موٹائی کے رہنما اصول", "ur-roman": "When to Replace Brake Pads: Signs & Thickness Guide"}'::jsonb,
    '{"en": "Understand acoustic wear indicators, safe millimeter minimums, and how worn pads can damage disc rotors if not changed in time.", "ur": "بریک پیڈز کی موٹائی کی حد، آوازوں کی وجوہات اور ڈسک روٹرز کی حفاظت کے رہنما اصول۔", "ur-roman": "Brake pads change karne ka sahi waqt, squeaking sound aur rotor safety tips."}'::jsonb,
    '{"en": "## The Importance of Friction Materials\n\nEvery time you press the brake pedal, hydraulic fluid clamps brake calipers, forcing brake pads against spinning metal rotors. This friction creates intense heat and wears down pad linings over time.\n\n### Wear Indicators to Watch For\n- **Acoustic Squeal**: Most modern brake pads incorporate a small spring-steel wear indicator. When friction material wears down to approximately 2.5–3mm, this indicator touches the rotor surface, producing a high-pitched warning sound.\n- **Grinding Metal Sound**: If the friction material wears off completely, the steel backing plate contacts the rotor. This damages the brake disc and lengthens stopping distances drastically.\n- **Spongy Pedal or Pulsing**: Vibration under foot often indicates thickness variation or heat distortion in the rotors.\n\n### Thickness Guidelines\n- **New brake pad lining**: ~10mm to 12mm\n- **Recommended replacement threshold**: 3mm\n- **Critical danger zone**: Below 2mm\n\n> **Safety Note:** Inspect brake components during every scheduled service. Consult your owner''s manual for manufacturer friction material minimums.",
      "ur": "## بریک پیڈز کی تبدیلی کا وقت\n\nبریک پیڈز گاڑی کے اہم ترین حفاظتی پرزے ہیں:\n1. بریک لگاتے وقت باریک آواز آنا اشارہ ہے کہ پیڈز پتلے ہو چکے ہیں۔\n2. 3 ملی میٹر سے کم موٹائی پر فوری تبدیلی ضروری ہے۔\n3. تاخیر کرنے سے مہنگے روٹرز خراب ہو سکتے ہیں۔",
      "ur-roman": "## Brake Pads Replacement Tips\n\nBrakes ki hifazat sab se pehle:\n1. **Aawaz suniye**: Squeak sound matlab pad khatam hone ke qareeb hai.\n2. **3mm rule**: 3mm se kam thickness par foran naye pads lagayein.\n3. **Owner''s manual guideline**: Hamesha recommended parts use karein."}'::jsonb,
    'https://plain-eeur-prod-public.komododecks.com/202610/14/98q54OUL7nKF5GujnAhZ/image.png',
    v_cat_maint,
    array['Brakes', 'Safety', 'Brake Pads', 'Rotors'],
    'Pak Auto Works Brake Bay',
    true,
    now() - interval '28 days',
    case when v_srv_brakes is not null then array[v_srv_brakes] else '{}'::uuid[] end,
    case when v_pcat_brakes is not null then array[v_pcat_brakes] else '{}'::uuid[] end,
    '{"en": "When to Replace Brake Pads | Pak Auto Works", "ur": "بریک پیڈز تبدیلی گائیڈ | پاک آٹو ورکس", "ur-roman": "Brake Pads Replacement Guide"}'::jsonb,
    '{"en": "Learn the signs of worn car brake pads and thickness thresholds. Always check your vehicle owner''s manual.", "ur": "بریک پیڈز کی تبدیلی کی علامات اور احتیاط۔", "ur-roman": "Brake pads replacement warning signs."}'::jsonb,
    true
  );

  -- Guide 8: Buying a Used Car Checklist
  insert into public.blog_posts (
    slug, title, excerpt, content, cover_image_url, category_id, tags, author_name,
    is_published, published_at, related_service_ids, related_category_ids,
    seo_title, seo_description, is_demo
  ) values (
    'buying-a-used-car-checklist',
    '{"en": "Buying a Used Car Checklist: Mechanical & Inspection Essentials", "ur": "استعمال شدہ گاڑی کی خریداری: معائنے اور دستاویزات کی مکمل چیک لسٹ", "ur-roman": "Used Car Buying Checklist: Inspection & Paperwork Guide"}'::jsonb,
    '{"en": "A step-by-step pre-purchase checklist covering engine blow-by, structural seams, computerized scanner checks, and registration verification.", "ur": "پرانی گاڑی خریدتے وقت انجن، باڈی، پینٹ اور کمپیوٹر اسکیننگ کی لازمی جانچ کے رہنما اصول۔", "ur-roman": "Purani gaari kharidne se pehle engine, suspension aur body checks ki ahem tips."}'::jsonb,
    '{"en": "## Smart Pre-Purchase Decisions\n\nBuying a pre-owned vehicle can be a rewarding purchase if you inspect thoroughly before transferring payment. Never rely on cosmetic shine alone; mechanical and structural integrity are what determine true value.\n\n### 1. Engine & Transmission Evaluation\n- **Cold Start**: Observe the exhaust pipe during first startup. Blue smoke signals oil burning; thick black smoke indicates unburnt fuel or sensor trouble.\n- **Oil Cap & Blow-by**: Remove the oil filler cap while idling. Significant puffing smoke or sputtering oil drops indicates excessive blow-by and worn piston rings.\n- **Transmission Engagement**: In automatics and CVTs, shifts should engage smoothly into Drive and Reverse without hesitation or clunking.\n\n### 2. Body Seams & Paint Inspection\n- Check factory sealant lines (silicon seams) inside door pillars, engine apron, and trunk floor. Irregular or missing sealant indicates prior collision repairs.\n- Use a paint thickness gauge or feel for uneven surface texture across adjacent panels.\n\n### 3. Professional OBD-II Scan\nConnect a diagnostic scanner to check for cleared trouble codes or pending sensor warnings.\n\n> **Tip:** Bring any vehicle to Pak Auto Works for an impartial multi-point Pre-Purchase Inspection report before making a final offer.",
      "ur": "## استعمال شدہ گاڑی کی خریداری کے اصول\n\n1. انجن کا کولڈ اسٹارٹ دیکھیں اور دھواں چیک کریں۔\n2. باڈی کے فیکٹری سیلز اور جوڑوں کا معائنہ کریں۔\n3. کمپیوٹر اسکین سے سنسرز کی جانچ کریں۔\n\nخریداری سے قبل مکمل ٹیکنیکل رپورٹ حاصل کریں۔",
      "ur-roman": "## Used Car Buying Tips\n\nUsed car lene se pehle zaroori checks:\n1. **Cold start smoke**: Blue ya black smoke notice karein.\n2. **Body seals**: Accident repair check karne ke liye factory sealants dekhein.\n3. **Computer scan**: Hidden engine faults check karwayein."}'::jsonb,
    'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg',
    v_cat_buying,
    array['Used Car', 'Buying Guide', 'Inspection', 'Safety'],
    'Pak Auto Works Evaluation Desk',
    true,
    now() - interval '35 days',
    case when v_srv_engine is not null then array[v_srv_engine, v_srv_denting] else '{}'::uuid[] end,
    case when v_pcat_filters is not null then array[v_pcat_filters] else '{}'::uuid[] end,
    '{"en": "Used Car Buying Inspection Checklist | Pak Auto Works", "ur": "استعمال شدہ گاڑی کی خریداری گائیڈ | پاک آٹو ورکس", "ur-roman": "Used Car Buying Checklist"}'::jsonb,
    '{"en": "Step-by-step pre-purchase inspection advice for used cars. Check engine health, body seams, and diagnostics.", "ur": "پرانی گاڑی کی جانچ کی جامع گائیڈ۔", "ur-roman": "Used car inspection tips."}'::jsonb,
    true
  );

  -- 3. REVIEWS (12 sample reviews: fake names marked "Demo Customer", mixed 3-5 stars, mostly 4-5, 2 pending, 1 hidden, 2 replies)
  delete from public.reviews where is_demo = true;

  -- Review 1: 5 stars, approved, verified, with workshop reply
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Tariq M.',
    5,
    'Smooth suspension overhaul and clear estimate',
    'Brought the car in for a suspension checkup and routine oil service. The workshop team explained what was needed, followed owner''s manual recommendations, and the estimated cost was accurate. Car feels solid and comfortable on the road.',
    v_srv_suspension,
    'en',
    'approved',
    true,
    '{"en": "Thank you for visiting Pak Auto Works! We appreciate your feedback and hope your vehicle continues to run smoothly.", "ur": "پاک آٹو ورکس پر تشریف لانے کا شکریہ! آپ کے اعتماد کا شکریہ۔", "ur-roman": "Shukriya Tariq sahib! Aapka aetimad hamare liye ahem hai."}'::jsonb,
    'demo_hash_1',
    true,
    now() - interval '2 days'
  );

  -- Review 2: 5 stars, approved, verified, with workshop reply
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Bilal W.',
    5,
    'AC سروس اور کولنگ ٹیسٹ',
    'گرمی شروع ہونے سے قبل اے سی چیک اپ کروایا۔ فلٹر تبدیل کیا اور گیس پریشر تسلی بخش طریقے سے ٹیسٹ کیا۔ کام وقت پر مکمل ہوا اور عملہ خوش اخلاق تھا۔',
    v_srv_ac,
    'ur',
    'approved',
    true,
    '{"en": "Thank you Bilal! Proper pre-summer AC inspection helps maintain efficient cabin cooling throughout the hot months.", "ur": "شکریہ بلال صاحب! گرمی سے پہلے اے سی چیک اپ سے سفر پُرسکون رہتا ہے۔", "ur-roman": "Shukriya Bilal bhai! Safe drive karein."}'::jsonb,
    'demo_hash_2',
    true,
    now() - interval '4 days'
  );

  -- Review 3: 5 stars, approved, verified, no reply
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Usman Q.',
    5,
    'Quick scheduled oil service',
    'Booked an appointment through the website. Bay was ready on arrival, recommended oil grade was used per manual specs, and the multi-point inspection was carried out methodically.',
    v_srv_oil,
    'en',
    'approved',
    true,
    null,
    'demo_hash_3',
    true,
    now() - interval '6 days'
  );

  -- Review 4: 4 stars, approved, verified, no reply
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Zubair A.',
    4,
    'Brake pad replacement done well',
    'Had worn brake pads replaced along with disc inspection. Decent turnaround time and transparent pricing. Helpful guidance on bed-in procedure for new pads.',
    v_srv_brakes,
    'en',
    'approved',
    true,
    null,
    'demo_hash_4',
    true,
    now() - interval '9 days'
  );

  -- Review 5: 5 stars, approved, not verified
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Salman F.',
    5,
    'Computer diagnostics and sensor fault cleared',
    'Check engine light came on after a long highway drive. The scanner diagnosed the issue quickly and the team explained the readings without pushing unnecessary replacements.',
    v_srv_engine,
    'en',
    'approved',
    false,
    null,
    'demo_hash_5',
    true,
    now() - interval '13 days'
  );

  -- Review 6: 4 stars, approved, verified
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Waqas R.',
    4,
    'Wheel alignment before long trip',
    'Got 3D wheel alignment and tyre pressures checked before travelling. Car tracks straight and steering feels balanced. Reasonable wait time.',
    v_srv_tyres,
    'en',
    'approved',
    true,
    null,
    'demo_hash_6',
    true,
    now() - interval '16 days'
  );

  -- Review 7: 5 stars, approved, verified
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Kamran H.',
    5,
    'پینٹ اور باڈی کا معیاری کام',
    'گاڑی کے دروازے پر اسکریچ تھا، مناسب وقت میں پینٹ میچنگ کے ساتھ کام مکمل کر کے دیا۔ اچھا تجربہ رہا۔',
    v_srv_denting,
    'ur',
    'approved',
    true,
    null,
    'demo_hash_7',
    true,
    now() - interval '20 days'
  );

  -- Review 8: 3 stars, approved (mixed rating for believable distribution)
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Asad K.',
    3,
    'Work was fine but workshop was very busy',
    'The mechanical service was performed well, but had to wait about 25 minutes past my slot time as the previous car was wrapping up. Better scheduling on weekends would help.',
    v_srv_oil,
    'en',
    'approved',
    false,
    '{"en": "Thank you for your feedback Asad. We are continuously refining our slot scheduling to minimize wait times on busy weekend mornings.", "ur": "آپ کی رائے کا شکریہ اسد صاحب۔ ہم رش کے دنوں میں وقت کی پابندی مزید بہتر بنا رہے ہیں۔", "ur-roman": "Feedback ka shukriya Asad bhai."}'::jsonb,
    'demo_hash_8',
    true,
    now() - interval '24 days'
  );

  -- Review 9: 4 stars, approved
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Naveed S.',
    4,
    'Battery and alternator checkup',
    'Tested charging voltage and cleaned battery terminal oxidation. Honest advice regarding battery health without rushing into a premature replacement.',
    v_srv_battery,
    'en',
    'approved',
    false,
    null,
    'demo_hash_9',
    true,
    now() - interval '27 days'
  );

  -- Review 10: 5 stars, PENDING moderation (for admin testing)
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Junaid B.',
    5,
    'Pending review submission test',
    'Testing customer review submission for routine general tuneup. Professional service and clean waiting area.',
    v_srv_engine,
    'en',
    'pending',
    false,
    null,
    'demo_hash_10',
    true,
    now() - interval '1 hour'
  );

  -- Review 11: 4 stars, PENDING moderation (for admin testing)
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Farhan A.',
    4,
    'Recent brake inspection pending approval',
    'Scheduled an inspection before highway drive. Pads were measured at 5mm so replacement not needed yet. Honest workshop advice.',
    v_srv_brakes,
    'en',
    'pending',
    false,
    null,
    'demo_hash_11',
    true,
    now() - interval '3 hours'
  );

  -- Review 12: 3 stars, HIDDEN moderation (for admin testing)
  insert into public.reviews (
    reviewer_name, rating, title, body, service_id, language, status, is_verified,
    admin_reply, ip_hash, is_demo, created_at
  ) values (
    'Demo Customer – Rashid M.',
    3,
    'Sample hidden feedback entry',
    'Sample review marked as hidden in admin to verify moderation filters and tab status segregation.',
    null,
    'en',
    'hidden',
    false,
    null,
    'demo_hash_12',
    true,
    now() - interval '5 days'
  );

  -- 4. GALLERY ITEMS (12 items across 5 categories, sample images)
  delete from public.gallery_items where is_demo = true;

  insert into public.gallery_items (
    title, caption, category, image_url, before_image_url, sort_order, is_active, is_demo
  ) values
    -- Workshop
    (
      '{"en": "Computerized Diagnostic Bay", "ur": "کمپیوٹرائزڈ تشخیصی بے", "ur-roman": "Computer Diagnostic Bay"}'::jsonb,
      '{"en": "Equipped with multi-brand OBD scanners, oscilloscope, and live sensor graphing tools.", "ur": "جدید اسکینرز اور سینسر ٹیسٹنگ آلات سے لیس تشخیصی بے", "ur-roman": "Multi-brand OBD diagnostic bay."}'::jsonb,
      'workshop',
      'https://cdn.phototourl.com/member/2026-10-10-64c1c5fc-3470-4c19-8e3c-d36382be33d3.jpg',
      null,
      1,
      true,
      true
    ),
    (
      '{"en": "Hydraulic Service Lifts", "ur": "ہائیڈرولک سروس لفٹس", "ur-roman": "Hydraulic Service Lifts"}'::jsonb,
      '{"en": "Heavy-duty twin-post lifts for thorough undercarriage, suspension, and exhaust inspections.", "ur": "گاڑی کے نچلے حصے کے محفوظ معائنے کے لیے ہیوی ڈیوٹی لفٹس", "ur-roman": "Twin-post lifts for undercarriage inspections."}'::jsonb,
      'workshop',
      'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg',
      null,
      2,
      true,
      true
    ),
    (
      '{"en": "3D Wheel Alignment & Balancing Bay", "ur": "تھری ڈی وہیل الائنمنٹ بے", "ur-roman": "3D Wheel Alignment Bay"}'::jsonb,
      '{"en": "Precision camera sensors verify camber, caster, and toe angles to factory tolerances.", "ur": "ٹائروں کے توازن اور لمبی لائف کے لیے جدید کمپیوٹرائزڈ الائنمنٹ", "ur-roman": "Computerized 3D wheel alignment system."}'::jsonb,
      'workshop',
      'https://plain-eeur-prod-public.komododecks.com/202610/10/nwz6vbqK7nSjjDuNVCQD/image.png',
      null,
      3,
      true,
      true
    ),

    -- Repairs
    (
      '{"en": "Engine Cylinder Head Servicing", "ur": "انجن سلنڈر ہیڈ سروسنگ", "ur-roman": "Engine Head Servicing"}'::jsonb,
      '{"en": "Valve reseating, stem seal renewal, and surface flatness verification using precision micrometers.", "ur": "والوز اور سیلز کی درستی اور پریشر ٹیسٹنگ", "ur-roman": "Valve reseating aur head servicing."}'::jsonb,
      'repairs',
      'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg',
      null,
      4,
      true,
      true
    ),
    (
      '{"en": "Suspension Strut & Bushing Renewal", "ur": "سسپنشن شاکس و بشنگ کی تنصیب", "ur-roman": "Suspension Bushing Replacement"}'::jsonb,
      '{"en": "Restoring ride comfort and eliminating road noise with fresh bushings and gas shock absorbers.", "ur": "ہموار سفر کے لیے سسپنشن کے پرزوں کی بروقت تبدیلی", "ur-roman": "Quiet ride ke liye suspension overhaul."}'::jsonb,
      'repairs',
      'https://plain-eeur-prod-public.komododecks.com/202610/10/2tdS7EMNiVYKWW8c2s5e/image.png',
      null,
      5,
      true,
      true
    ),
    (
      '{"en": "AC Evaporator & System Leak Check", "ur": "اے سی ایواپوریٹر و پریشر ٹیسٹ", "ur-roman": "AC Evaporator Leak Inspection"}'::jsonb,
      '{"en": "Nitrogen pressure holding test to confirm zero micro-leaks before refrigerant charging.", "ur": "گیس چارج کرنے سے قبل نائٹروجن گیس سے لیک ٹیسٹ", "ur-roman": "Refrigerant charge se pehle leak test."}'::jsonb,
      'repairs',
      'https://cdn.phototourl.com/member/2026-10-10-fdc8b7bd-9856-4687-a17d-bbb0420cc7b6.jpg',
      null,
      6,
      true,
      true
    ),

    -- Before & After pairs
    (
      '{"en": "Front Bumper Denting & Baked Paint", "ur": "فرنٹ بمپر ڈینٹ اور بیکڈ پینٹ", "ur-roman": "Front Bumper Dent & Paint"}'::jsonb,
      '{"en": "Accidental scrape repaired and color-matched in our climate-controlled paint booth.", "ur": "اسکریچ شدہ بمپر کی اصلی رنگ سے میچنگ اور پینٹ بوتھ میں بحالی", "ur-roman": "Scraped bumper restored to factory color finish."}'::jsonb,
      'before_after',
      'https://cdn.phototourl.com/member/2026-10-10-9a62423f-31c4-4615-8850-269d1f20566d.jpg', -- After (clean shiny body)
      'https://cdn.phototourl.com/member/2026-10-10-8e816f50-4e8e-4e00-94e3-5873fbb8ff7f.jpg', -- Before (damaged panel)
      7,
      true,
      true
    ),
    (
      '{"en": "Headlight Lens Clarity Restoration", "ur": "ہیڈلائٹ شیشوں کی بحالی و پالش", "ur-roman": "Headlight Clarity Restoration"}'::jsonb,
      '{"en": "Multi-stage wet polishing removes yellow oxidation to restore nighttime light spread.", "ur": "دھندلے پیلے شیشوں کی صفائی اور شفاف روشنی کی بحالی", "ur-roman": "Yellowed lens restored to clear illumination."}'::jsonb,
      'before_after',
      'https://plain-eeur-prod-public.komododecks.com/202610/14/99JTVbuDfcuzyPiokHq5/image.png', -- After (bright clear light)
      'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg', -- Before (dull)
      8,
      true,
      true
    ),
    (
      '{"en": "Engine Bay Steam Detailing", "ur": "انجن بے کی اسٹیم ڈیٹیلنگ", "ur-roman": "Engine Bay Detailing"}'::jsonb,
      '{"en": "Gentle steam cleaning clears road grit and oil film without risking sensor moisture.", "ur": "سنسرز کو محفوظ رکھتے ہوئے انجن کی گریس اور گرد کا صفایا", "ur-roman": "Safe degreasing and engine bay cleaning."}'::jsonb,
      'before_after',
      'https://cdn.phototourl.com/member/2026-10-10-64c1c5fc-3470-4c19-8e3c-d36382be33d3.jpg', -- After (clean engine)
      'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg', -- Before (greasy)
      9,
      true,
      true
    ),

    -- Parts
    (
      '{"en": "Sealed Lubricants & Genuine Filters", "ur": "اصلی آئل اور فلٹرز کا اسٹاک", "ur-roman": "Sealed Oils & Filters Stock"}'::jsonb,
      '{"en": "Original factory oils and high-efficiency filtration media stored in climate-controlled shelving.", "ur": "معیاری لبریکنٹس اور اصلی فلٹرز کا محفوظ اسٹاک", "ur-roman": "Original sealed lubricants and oil filters."}'::jsonb,
      'parts',
      'https://plain-eeur-prod-public.komododecks.com/202610/14/Bnh6KN8yADd6hcSesOdk/image.png',
      null,
      10,
      true,
      true
    ),
    (
      '{"en": "Disc Rotors & Ceramic Brake Pads", "ur": "ڈسک روٹرز اور بریک پیڈز", "ur-roman": "Disc Rotors & Ceramic Pads"}'::jsonb,
      '{"en": "Heat-dissipating ventilated rotors and ceramic friction pads for consistent emergency stops.", "ur": "اعلیٰ معیار کے ڈسک روٹرز اور سرامک بریک پیڈز", "ur-roman": "Heavy duty ventilated disc brake parts."}'::jsonb,
      'parts',
      'https://plain-eeur-prod-public.komododecks.com/202610/14/98q54OUL7nKF5GujnAhZ/image.png',
      null,
      11,
      true,
      true
    ),

    -- Team
    (
      '{"en": "Certified Mechanics & Technicians", "ur": "ماہر مکینک اور ٹیکنیشن ٹیم", "ur-roman": "Certified Technicians"}'::jsonb,
      '{"en": "Dedicated mechanical, electrical, and AC specialists providing thorough diagnostics in Sadiqabad.", "ur": "صادق آباد میں تجربہ کار مکینک اور آٹو الیکٹریشن", "ur-roman": "Experienced mechanics and auto technicians."}'::jsonb,
      'team',
      'https://cdn.phototourl.com/member/2026-10-10-b8d3813a-db0c-4906-a73f-127f73bd4c54.jpg',
      null,
      12,
      true,
      true
    );

end $$;
