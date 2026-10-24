-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 9: CHATBOT DEMO DATA
-- =============================================================================
-- Idempotent and safe to run multiple times.
-- Seeds 16 comprehensive trilingual knowledge base entries and 6 chat sessions.
-- All demo records are marked with is_demo = true for clean one-click removal.
-- =============================================================================

-- 1. SEED CHATBOT KNOWLEDGE BASE (16 COMPREHENSIVE TRILINGUAL TOPICS)
delete from public.chatbot_knowledge where is_demo = true;

insert into public.chatbot_knowledge (
  id,
  category,
  title,
  content,
  keywords,
  sort_order,
  is_demo
) values
(
  '90000000-0000-0000-0000-000000000001',
  'troubleshooting',
  '{
    "en": "Engine Overheating & Temperature Warning",
    "ur": "انجن کا زیادہ گرم ہونا اور ٹیمپریچر وارننگ",
    "ur-roman": "Engine Overheating Aur Temperature Warning"
  }'::jsonb,
  '{
    "en": "If your temperature gauge is rising or steam is coming from the engine bay:\n1. Pull over safely and shut off the engine.\n2. NEVER open the radiator cap while the engine is hot (severe burn risk!).\n3. Common causes: Coolant leak, stuck thermostat, broken radiator fan, or failed water pump.\n*A physical inspection at our workshop is required to pressurize and test the cooling system.*",
    "ur": "اگر گاڑی کی ہیٹ گیج اوپر جا رہی ہو یا بونٹ سے بھاپ نکل رہی ہو:\n1. گاڑی کو محفوظ جگہ سائیڈ پر روکیں اور فوراً بند کریں۔\n2. گرم انجن کے دوران ریڈی ایٹر کا ڈھکن ہرگز نہ کھولیں (جلنے کا شدید خطرہ ہے)۔\n3. عام وجوہات: کولنٹ لیک، تھرموسٹیٹ والو، ریڈی ایٹر فین یا واٹر پمپ کی خرابی۔\n*حتمی تشخیص کے لیے ورکشاپ پر فزیکل معائنہ لازمی ہے۔*",
    "ur-roman": "Agar gaari ki heat gauge upar ja rahi hai ya engine se bhaap nikal rahi hai:\n1. Gaari ko foran side par rok kar engine band karein.\n2. Garam halat mein radiator ka dhakkan hargiz na kholein (jalne ka shaded khatra hai).\n3. Aam wajuhaat: Coolant leak, thermostat valve, radiator fan ya water pump ki kharabi.\n*Final diagnosis ke liye workshop par physical inspection laazmi hai.*"
  }'::jsonb,
  '{
    "en": ["overheat", "overheating", "temperature", "coolant", "radiator", "steam", "heat gauge"],
    "ur": ["گرم", "ہیٹ", "ٹیمپریچر", "کولنٹ", "ریڈی ایٹر", "بھاپ", "پانی کم"],
    "ur-roman": ["overheat", "overheating", "heat", "garam", "temperature", "coolant", "radiator", "bhaap"]
  }'::jsonb,
  1,
  true
),
(
  '90000000-0000-0000-0000-000000000002',
  'troubleshooting',
  '{
    "en": "Squeaking or Grinding Brakes",
    "ur": "بریک سے آوازیں یا رگڑ کا شور",
    "ur-roman": "Brake Se Awaz Ya Ragad"
  }'::jsonb,
  '{
    "en": "Squeaking or metal grinding sounds when applying brakes indicate:\n1. Worn brake pads reaching their wear indicator pins.\n2. Glazed or scored brake discs (rotors).\n3. Dust accumulation or seized caliper slider pins.\n*Warning: Brakes are safety-critical. Do not delay brake service. Visit Pak Auto Works for pad thickness check and disc skimming.*",
    "ur": "بریک لگاتے وقت چیخنے یا رگڑ کی آواز کی عام وجوہات:\n1. بریک پیڈز ختم ہو چکے ہیں اور انڈیکیٹر پن ڈسک سے چھو رہی ہے۔\n2. بریک ڈسک پر لکیریں یا روٹر خراب ہو چکا ہے۔\n3. گرد و غبار یا کیلیپر پن کا جام ہونا۔\n*وارننگ: بریک گاڑی کی حفاظت کا بنیادی نظام ہے۔ معائنے میں تاخیر نہ کریں اور فوراً ورکشاپ پر چیک کروائیں۔*",
    "ur-roman": "Brake lagane par cheekhne ya grinding ki awaz ke asbaab:\n1. Brake pads ghis chuke hain aur metal disc se ragad kha raha hai.\n2. Brake rotors/discs par scratches ya wear aa gaya hai.\n3. Caliper pins jam hain ya mitti/dust jama hai.\n*Warning: Brakes safety-critical hain. Foran workshop par pads check aur disc service karwayein.*"
  }'::jsonb,
  '{
    "en": ["brake", "brakes", "squeak", "squeaking", "grinding", "pads", "rotors", "stopping"],
    "ur": ["بریک", "بریکس", "آواز", "رگڑ", "پیڈز", "ڈسک", "روٹر"],
    "ur-roman": ["brake", "break", "brek", "awaz", "squeak", "grinding", "pads", "disc"]
  }'::jsonb,
  2,
  true
),
(
  '90000000-0000-0000-0000-000000000003',
  'troubleshooting',
  '{
    "en": "Car AC Not Cooling Properly",
    "ur": "کار اے سی ٹھنڈی ہوا نہیں دے رہا",
    "ur-roman": "Car AC Thandi Hawa Nahi De Raha"
  }'::jsonb,
  '{
    "en": "Common causes of poor AC cooling in hot weather:\n1. Refrigerant gas (R134a) leak or low pressure.\n2. Clogged cabin AC filter restricting airflow.\n3. AC condenser fins clogged with road dirt or bugs.\n4. AC compressor clutch or cooling fan malfunction.\n*We perform complete nitrogen pressure leak tests and vacuum gas recharging at Pak Auto Works.*",
    "ur": "گرمیوں میں اے سی کے کم ٹھنڈا کرنے کی بنیادی وجوہات:\n1. اے سی ریفریجرنٹ گیس (R134a) کا کم ہونا یا لیکج۔\n2. کیبن ایئر فلٹر کا مٹی سے بند ہونا۔\n3. کنڈینسر پر گرد و غبار جمع ہونا۔\n4. کمپریسر یا کولنگ فین کا صحیح نہ چلنا۔\n*پاک آٹو ورکس پر پریشر لیک ٹیسٹ اور معیاری گیس ری فلنگ کی سہولت دستیاب ہے۔*",
    "ur-roman": "AC thanda na karne ki asbaab:\n1. Refrigerant gas (R134a) leak ya low pressure.\n2. Cabin AC filter mitti se band hona.\n3. AC condenser par mitti aur kachra jama hona.\n4. Compressor clutch ya cooling fan ka masla.\n*Pak Auto Works par pressure leak test aur genuine gas refill available hai.*"
  }'::jsonb,
  '{
    "en": ["ac", "air condition", "cooling", "gas refill", "compressor", "cabin filter", "warm air"],
    "ur": ["اے سی", "ٹھنڈا", "کولنگ", "گیس", "کمپریسر", "ایئر کنڈیشن"],
    "ur-roman": ["ac", "thanda", "cooling", "gas", "compressor", "chilling", "garam hawa"]
  }'::jsonb,
  3,
  true
),
(
  '90000000-0000-0000-0000-000000000004',
  'troubleshooting',
  '{
    "en": "Exhaust Smoke Diagnostic Guide",
    "ur": "گاڑی کے سائلنسر سے دھواں — تشخیصی گائیڈ",
    "ur-roman": "Silencer Se Dhuan Diagnostic Guide"
  }'::jsonb,
  '{
    "en": "Identify engine issues by exhaust smoke color:\n- Black Smoke: Excess fuel burning (faulty oxygen sensor, clogged air filter, or leaking injector).\n- Blue/Grey Smoke: Engine burning oil (worn piston rings, valve stem seals, or PCV valve).\n- Thick White Smoke: Coolant leaking into combustion chamber (blown head gasket or cracked cylinder head).\n*Do not ignore blue or thick white smoke. Stop by for compression and diagnostic scan.*",
    "ur": "سائلنسر سے نکلنے والے دھوئیں کے رنگ سے مسئلے کی پہچان:\n- کالا دھواں: زیادہ فیول جل رہا ہے (ایئر فلٹر بند ہے یا فیول انجیکٹر کا مسئلہ)۔\n- نیلا یا سرمئی دھواں: انجن آئل جل رہا ہے (پسٹن رنگز یا والو سیلز کمزور ہیں)۔\n- گاڑھا سفید دھواں: کولنٹ یا پانی انجن میں جا رہا ہے (ہیڈ گیسکٹ کا مسئلہ)۔\n*فوری فزیکل معائنہ اور کمپیوٹر اسکیننگ ضروری ہے۔*",
    "ur-roman": "Silencer se dhuan nikalne ki wajuhaat:\n- Kala Dhuan: Ziada petrol jal raha hai (clogged air filter ya injector leak).\n- Neela / Grey Dhuan: Engine oil jal raha hai (piston rings ya valve seals ka masla).\n- Safaid Gaadha Dhuan: Coolant engine mein leak ho raha hai (head gasket blowout).\n*Workshop par inspection aur computerized scan karwayein.*"
  }'::jsonb,
  '{
    "en": ["smoke", "exhaust", "black smoke", "white smoke", "blue smoke", "silencer"],
    "ur": ["دھواں", "سائلنسر", "کالا دھواں", "سفید دھواں", "نیلا دھواں"],
    "ur-roman": ["dhuan", "smoke", "kala dhuan", "white smoke", "silencer"]
  }'::jsonb,
  4,
  true
),
(
  '90000000-0000-0000-0000-000000000005',
  'troubleshooting',
  '{
    "en": "Dashboard Warning Lights Guide",
    "ur": "ڈیش بورڈ وارننگ لائٹس گائیڈ",
    "ur-roman": "Dashboard Warning Lights Guide"
  }'::jsonb,
  '{
    "en": "Key dashboard warning symbols and what they indicate:\n- Check Engine: ECU detected powertrain/sensor malfunction. Scan OBD-II.\n- Oil Can / Low Oil: Extremely low oil pressure! Stop driving immediately.\n- Battery Symbol: Alternator charging circuit fault or loose drive belt.\n- ABS Symbol: Anti-lock brake system disabled; standard braking still operates cautiously.\n*Bring your car for computer scanner diagnosis.*",
    "ur": "اہم ڈیش بورڈ وارننگ لائٹس اور ان کے معنی:\n- چیک انجن: کمپیوٹر نے کسی سنسر کی خرابی پکڑی ہے۔ کمپیوٹر اسکین کروائیں۔\n- آئل کین: انجن آئل کا پریشر ختم ہو چکا ہے! گاڑی فوراً بند کریں۔\n- بیٹری نشان: الٹرنیٹر چارجنگ نہیں کر رہا یا بیلٹ اتر گئی ہے۔\n- ABS نشان: اینٹی لاک بریکنگ سسٹم بند ہو چکا ہے۔ احتیاط سے ڈرائیو کریں۔\n*ورکشاپ پر فوری کمپیوٹر اسکیننگ دستیاب ہے۔*",
    "ur-roman": "Dashboard warning lights ki wajuhaat:\n- Check Engine: ECU ne sensor error code note kiya hai. OBD-II scan karwayein.\n- Oil Pressure: Oil level khatarnak had tak kam hai. Foran engine band karein.\n- Battery Icon: Alternator charging nahi kar raha.\n- ABS Light: Anti-lock brake system disable ho gaya hai.\n*Pak Auto Works par computerized scanner test karwayein.*"
  }'::jsonb,
  '{
    "en": ["warning light", "warning lights", "check engine", "abs", "oil light", "battery light", "dashboard symbols"],
    "ur": ["وارننگ لائٹ", "چیک انجن", "ڈیش بورڈ", "آئل لائٹ", "بیٹری لائٹ"],
    "ur-roman": ["warning light", "warning lights", "check engine", "abs light", "oil light", "batti"]
  }'::jsonb,
  5,
  true
),
(
  '90000000-0000-0000-0000-000000000006',
  'troubleshooting',
  '{
    "en": "Car Battery Care & No-Start Issues",
    "ur": "کار بیٹری کی دیکھ بھال اور گاڑی اسٹارٹ نہ ہونا",
    "ur-roman": "Car Battery Care Aur No-Start Masla"
  }'::jsonb,
  '{
    "en": "Symptoms of a dying car battery:\n1. Slow, sluggish engine cranking in the morning.\n2. Dim headlights or clicking noise when turning ignition.\n3. Corrosion buildup on battery terminals.\n4. Average battery lifespan in Pakistan is 2 to 3 years due to heat.\n*We perform computerized battery load and alternator charging tests.*",
    "ur": "کمزور یا ختم ہوتی بیٹری کی علامات:\n1. صبح کے وقت سست سلف یا دیر سے اسٹارٹ ہونا۔\n2. سلف مارتے وقت ٹک ٹک کی آواز یا ہیڈ لائٹس کی مدہم روشنی۔\n3. بیٹری کھونٹیوں (ٹرمینلز) پر سفید یا نیلا پاؤڈر جمع ہونا۔\n4. گرم موسم کی وجہ سے پاکستان میں بیٹری کی اوسط عمر 2 سے 3 سال ہوتی ہے۔\n*ہمارے پاس بیٹری لوڈ اور الٹرنیٹر چارجنگ ٹیسٹنگ دستیاب ہے۔*",
    "ur-roman": "Battery weak hone ki nishaniyan:\n1. Subah ke waqt slow self lena.\n2. Self par click-click awaz aana aur lights dim hona.\n3. Terminals par safaid powder/corrosion jama hona.\n4. Pakistan ke garam mausam mein battery 2 se 3 saal chalti hai.\n*Pak Auto Works par load tester se checking karwayein.*"
  }'::jsonb,
  '{
    "en": ["battery", "no start", "crank", "dead battery", "alternator", "starting problem"],
    "ur": ["بیٹری", "اسٹارٹ نہیں", "سلف", "کمزور بیٹری", "الٹرنیٹر"],
    "ur-roman": ["battery", "battri", "start nahi", "cranking", "self", "dead battery"]
  }'::jsonb,
  6,
  true
),
(
  '90000000-0000-0000-0000-000000000007',
  'troubleshooting',
  '{
    "en": "Tyre Pressure & Puncture Care",
    "ur": "ٹائر پریشر اور پنکچر کی دیکھ بھال",
    "ur-roman": "Tyre Pressure Aur Puncture Care"
  }'::jsonb,
  '{
    "en": "Tyre maintenance essentials:\n- Check tyre pressure when cold every 2 weeks (standard: 30–32 PSI for sedans/hatchbacks).\n- Under-inflated tyres reduce fuel economy and wear edges quickly.\n- Tyre rotation recommended every 10,000 km for even tread wear.\n- In case of puncture, use verified mushroom plug repair rather than temporary string plugs for highway safety.",
    "ur": "ٹائروں کی دیکھ بھال کے اہم اصول:\n- ہر دو ہفتے بعد ٹھنڈی حالت میں ہوا کا پریشر چیک کریں (عام طور پر 30 سے 32 PSI)۔\n- کم ہوا سے فیول ایوریج گر جاتی ہے اور ٹائر کے کنارے جلد گھس جاتے ہیں۔\n- ہر 10,000 کلومیٹر پر ٹائروں کی روٹیشن اور وہیل الائنمنٹ کروائیں۔\n- ہائی وے پر محفوظ سفر کے لیے پنکچر لگواتے وقت معیاری مشروم پلگ استعمال کروائیں۔",
    "ur-roman": "Tyre maintenance ke ahem points:\n- Har 2 haftay baad thandi halat mein hawa check karein (30–32 PSI standard).\n- Kam hawa se petrol ziada lagta hai aur tyres sides se ghis jatay hain.\n- Har 10,000 km par wheel alignment aur tyre rotation karwayein.\n- Puncture lagwate waqt proper vulcanized plug use karein."
  }'::jsonb,
  '{
    "en": ["tyre", "tire", "pressure", "puncture", "flat tyre", "psi", "wheel alignment"],
    "ur": ["ٹائر", "ہوا", "پریشر", "پنکچر", "الائنمنٹ"],
    "ur-roman": ["tyre", "tire", "puncher", "puncture", "hawa", "alignment", "psi"]
  }'::jsonb,
  7,
  true
),
(
  '90000000-0000-0000-0000-000000000008',
  'services',
  '{
    "en": "Engine Oil Change & Maintenance Schedule Basics",
    "ur": "انجن آئل تبدیلی اور پیریوڈک مینٹیننس کے اصول",
    "ur-roman": "Engine Oil Change Aur Periodic Maintenance Basics"
  }'::jsonb,
  '{
    "en": "Regular lubricant and filter renewal guide:\n- Mineral Oil: Replace every 3,000 to 5,000 km.\n- Fully Synthetic Oil: Replace every 7,000 to 10,000 km (or 6 months).\n- Always change the oil filter whenever fresh engine oil is installed.\n- Replace air filter every 10,000 km to protect piston rings from road dust.\n*We stock authentic Mobil, Shell, Total, and Japanese OEM lubricants.*",
    "ur": "انجن آئل اور فلٹرز کی بروقت تبدیلی:\n- منرل آئل: ہر 3,000 سے 5,000 کلومیٹر پر تبدیل کریں۔\n- سنتھیٹک آئل: ہر 7,000 سے 10,000 کلومیٹر (یا 6 ماہ) پر تبدیل کریں۔\n- آئل کے ساتھ ہمیشہ نیا آئل فلٹر لازمی انسٹال کروائیں۔\n- ایئر فلٹر ہر 10,000 کلومیٹر پر تبدیل کریں تاکہ انجن میں مٹی نہ جائے۔\n*پاک آٹو ورکس پر اصلی امپورٹڈ اور لوکل گریڈ آئل دستیاب ہیں۔*",
    "ur-roman": "Engine oil aur filters schedule:\n- Mineral Oil: Har 3,000 se 5,000 km par badlein.\n- Fully Synthetic: Har 7,000 se 10,000 km par badlein.\n- Har oil change ke sath naya oil filter laazmi lagayein.\n- Air filter har 10,000 km par renew karein.\n*Pak Auto Works par certified lubricants mojood hain.*"
  }'::jsonb,
  '{
    "en": ["oil change", "engine oil", "synthetic oil", "filter", "tuning", "maintenance schedule"],
    "ur": ["آئل چینج", "انجن آئل", "موبل آئل", "فلٹر", "سروس شیڈول"],
    "ur-roman": ["oil change", "engine oil", "mobil oil", "filter", "tuning", "service schedule"]
  }'::jsonb,
  8,
  true
),
(
  '90000000-0000-0000-0000-000000000009',
  'services',
  '{
    "en": "Summer Car AC Care & Preventive Maintenance",
    "ur": "گرمیوں میں کار اے سی کی حفاظت اور نگہداشت",
    "ur-roman": "Garmiyon Mein Car AC Care Aur Maintenance"
  }'::jsonb,
  '{
    "en": "Maximize cooling efficiency during peak Pakistani summer temperatures (45°C+):\n1. Roll down windows for 1 minute before turning on the AC to purge trapped heat.\n2. Wash external condenser fins gently with water to clear insect and mud blockages.\n3. Clean or replace cabin pollen filter before summer begins.\n4. Use recirculate mode to pull already-cooled air from the cabin.",
    "ur": "شدید گرمیوں (45°C سے زائد) میں اے سی کی بہترین کولنگ کے لیے:\n1. گاڑی میں بیٹھتے ہی 1 منٹ کے لیے شیشے نیچے کر دیں تاکہ اندر پھنسی گرم ہوا نکل جائے۔\n2. بونٹ میں لگے کنڈینسر پر ہلکے پانی سے مٹی اور کیڑے دھو لیں۔\n3. گرمیاں شروع ہونے سے پہلے کیبن فلٹر لازمی تبدیل کریں۔\n4. ہمیشہ ری سرکولیشن موڈ آن رکھیں تاکہ کیبن کی ٹھنڈی ہوا دوبارہ استعمال ہو۔",
    "ur-roman": "Peak summer (45°C+) mein AC ki behtareen cooling ke tips:\n1. Gaari start karte hi 1 minute sheeshay down karein taake trapped heat nikal jaye.\n2. Condenser par mitti aur dust ko paani se saaf karein.\n3. Cabin AC filter har season change karein.\n4. Recirculation button on rakhein."
  }'::jsonb,
  '{
    "en": ["ac care", "summer ac", "air conditioner maintenance", "cooling tips", "cabin filter"],
    "ur": ["اے سی کی دیکھ بھال", "گرمیوں میں اے سی", "کولنگ کے طریقے"],
    "ur-roman": ["ac care", "summer ac", "cooling tips", "garmi ac", "cabin filter"]
  }'::jsonb,
  9,
  true
),
(
  '90000000-0000-0000-0000-000000000010',
  'services',
  '{
    "en": "Monsoon & Heavy Rain Driving Precautions",
    "ur": "بارش اور مون سون میں ڈرائیونگ کی حفاظتی تدابیر",
    "ur-roman": "Monsoon Aur Barish Driving Precautions"
  }'::jsonb,
  '{
    "en": "Crucial guidelines for rainy weather and standing road water:\n- Never drive through water deeper than your wheel hubs (risk of engine hydrostatic lock).\n- Replace hardened wiper blades before monsoon season.\n- After passing through standing water, tap brakes gently several times to dry the friction pads.\n- Keep windshield defogger active to prevent internal glass misting.",
    "ur": "بارش اور سڑکوں پر کھڑے پانی کے دوران حفاظتی تدابیر:\n- پہیوں کے نصف سے زیادہ کھڑے پانی میں ہرگز گاڑی نہ ڈالیں (انجن میں پانی جانے سے ہائیڈرولک لاک کا خطرہ ہے)۔\n- مون سون سے قبل وائپر بلیڈز تبدیل کروائیں۔\n- پانی میں سے گزرنے کے بعد ہلکے ہلکے بریک لگائیں تاکہ پیڈز پر لگا پانی خشک ہو جائے۔\n- ونڈ اسکرین پر دھند جمنے کی صورت میں ڈی فوگر آن رکھیں۔",
    "ur-roman": "Barish aur monsoon mein gaari chalane ke ahem rules:\n- Kharay paani mein gaari na dalein (engine water lock ka shaded khatra hota hai).\n- Wiper blades check karein aur naye lagwayein.\n- Paani se nikal kar 2-3 martaba halki brake dabayein taake pads sookh jayein.\n- Sheeshay par dhuwan/mist se bachne ke liye defogger use karein."
  }'::jsonb,
  '{
    "en": ["monsoon", "rain", "flooded water", "wipers", "rain driving", "defogger"],
    "ur": ["بارش", "مون سون", "پانی میں گاڑی", "وائپرز", "دھند"],
    "ur-roman": ["barish", "monsoon", "rain", "wipers", "pani", "defogger"]
  }'::jsonb,
  10,
  true
),
(
  '90000000-0000-0000-0000-000000000011',
  'booking_delivery',
  '{
    "en": "Delivery Charges & Sadiqabad Free Delivery Rule",
    "ur": "اسپیئر پارٹس کی ڈیلیوری چارجز اور صادق آباد فری پالیسی",
    "ur-roman": "Spare Parts Delivery Charges Aur Sadiqabad Free Delivery"
  }'::jsonb,
  '{
    "en": "Pak Auto Works spare parts delivery terms:\n- Sadiqabad City: 100% FREE Home & Workshop Delivery.\n- All Other Pakistan Cities: Flat Rs. 300 courier delivery fee.\n- Cash on Delivery (COD) available nationwide.\n- Delivery timeline: 2 to 4 business days with live courier tracking code.",
    "ur": "پاک آٹو ورکس اسپیئر پارٹس کی ڈیلیوری کی شرائط:\n- صادق آباد شہر: بالکل مفت (Free) ڈیلیوری۔\n- باقی تمام پاکستانی شہر: فلیٹ 300 روپے کوریئر چارجز۔\n- کیش آن ڈیلیوری (COD) کی سہولت پاکستان بھر میں دستیاب ہے۔\n- ڈیلیوری کا دورانیہ: 2 سے 4 کاروباری دن بمعہ ٹریکنگ نمبر۔",
    "ur-roman": "Pak Auto Works spare parts delivery terms:\n- Sadiqabad City: Bilkul FREE delivery.\n- Baqi tamam shehar: Flat Rs. 300 courier charges.\n- Cash on Delivery (COD) pure Pakistan mein available hai.\n- Delivery timing: 2 se 4 business days ba-zariya courier tracking."
  }'::jsonb,
  '{
    "en": ["delivery", "shipping", "courier", "charges", "sadiqabad", "free shipping", "cod"],
    "ur": ["ڈیلیوری", "شپنگ", "کوریئر", "صادق آباد", "فری", "چارجز"],
    "ur-roman": ["delivery", "shipping", "courier", "charges", "sadiqabad", "free delivery", "cod"]
  }'::jsonb,
  11,
  true
),
(
  '90000000-0000-0000-0000-000000000012',
  'booking_delivery',
  '{
    "en": "Payment Options: Cash on Delivery & Direct Transfer",
    "ur": "ادائیگی کے طریقے: کیش آن ڈیلیوری اور براہ راست ٹرانسفر",
    "ur-roman": "Payment Options: Cash on Delivery Aur Direct Transfer"
  }'::jsonb,
  '{
    "en": "Available payment methods at Pak Auto Works:\n1. Cash on Delivery (COD): Pay cash when the parcel arrives at your doorstep for eligible spare parts.\n2. Manual Bank / Mobile Wallet Transfer: Transfer to our official workshop account (JazzCash, Easypaisa, or Bank) and upload payment receipt during checkout.\n3. In-Workshop Counter: Cash or instant mobile transfer upon job card delivery or in-store purchase.",
    "ur": "پاک آٹو ورکس پر ادائیگی کے دستیاب ذرائع:\n1. کیش آن ڈیلیوری (COD): پارسل وصول ہونے پر کوریئر رائیڈر کو نقد رقم ادا کریں۔\n2. بینک یا موبائل والیٹ ٹرانسفر: ورکشاپ کے سرکاری اکاؤنٹ (جاز کیش، ایزی پیسہ، یا بینک) میں رقم منتقل کریں اور رسید اپ لوڈ کریں۔\n3. ورکشاپ کاؤنٹر: کام مکمل ہونے یا کاؤنٹر سے پارٹس لینے پر نقد یا آن لائن ادائیگی۔",
    "ur-roman": "Pak Auto Works par payment methods:\n1. Cash on Delivery (COD): Parcel milne par rider ko cash dein.\n2. Manual Bank / Mobile Wallets: Workshop official account (JazzCash, Easypaisa, ya Bank) transfer aur receipt upload.\n3. Workshop counter par direct cash ya transfer."
  }'::jsonb,
  '{
    "en": ["payment", "pay", "jazzcash", "easypaisa", "bank transfer", "cod"],
    "ur": ["ادائیگی", "جاز کیش", "ایزی پیسہ", "بینک", "کیش آن ڈیلیوری"],
    "ur-roman": ["payment", "pay", "jazzcash", "easypaisa", "bank", "cod", "kese pay karein"]
  }'::jsonb,
  12,
  true
),
(
  '90000000-0000-0000-0000-000000000013',
  'booking_delivery',
  '{
    "en": "How Online Service Booking Works",
    "ur": "ورکشاپ سروس آن لائن بک کرنے کا طریقہ",
    "ur-roman": "Workshop Service Online Book Karne Ka Tareeqa"
  }'::jsonb,
  '{
    "en": "Booking a maintenance slot at Pak Auto Works is quick and simple:\n1. Visit /book and select your car make, model, and required services.\n2. Pick an open date and time slot from the live calendar.\n3. Enter your contact details (no advance deposit required).\n4. Receive your unique Booking Reference (e.g., BK-XXXXXX) instantly.",
    "ur": "پاک آٹو ورکس پر سروس بکنگ کا آسان طریقہ:\n1. بکنگ صفحے (/book) پر جائیں اور اپنی گاڑی اور مطلوبہ سروسز منتخب کریں۔\n2. کیلنڈر سے دستیاب تاریخ اور ٹائم سلاٹ منتخب کریں۔\n3. اپنا نام اور فون نمبر درج کریں (کسی پیشگی ایڈوانس کی ضرورت نہیں ہے)۔\n4. فوری بکنگ ریفرنس نمبر (BK-XXXXXX) حاصل کریں۔",
    "ur-roman": "Online service book karne ka tareeqa:\n1. Website par /book page par jayein aur gaari aur service select karein.\n2. Live calendar se apni marzi ki date aur time slot choose karein.\n3. Contact number enter karein (koi advance deposit nahi chahiye).\n4. Foran booking reference number (BK-XXXXXX) haasil karein."
  }'::jsonb,
  '{
    "en": ["booking", "book service", "appointment", "schedule", "how to book", "time slot"],
    "ur": ["بکنگ", "سروس بک", "اپائنٹمنٹ", "وقت لیں", "بک کرنے کا طریقہ"],
    "ur-roman": ["booking", "book", "appointment", "kaise book karein", "time slot", "service book"]
  }'::jsonb,
  13,
  true
),
(
  '90000000-0000-0000-0000-000000000014',
  'booking_delivery',
  '{
    "en": "How Job & Order Tracking Works",
    "ur": "ورکشاپ کام اور آرڈر ٹریک کرنے کا طریقہ",
    "ur-roman": "Workshop Kaam Aur Order Track Karne Ka Tareeqa"
  }'::jsonb,
  '{
    "en": "Track your car repairs or store orders anytime at /track:\n1. Enter your Job Card number (e.g., JC-000001) or Order number (e.g., ORD-000101).\n2. Enter the phone number used during booking or checkout.\n3. View current stage (Inspection, In Progress, Ready, Delivered), invoice balance, and courier tracking link.",
    "ur": "اپنے کام یا آرڈر کی لائیو ٹریکنگ (/track):\n1. اپنا جاب کارڈ نمبر (JC-000001) یا آرڈر نمبر (ORD-000101) درج کریں۔\n2. بکنگ یا خریداری کے وقت دیا گیا فون نمبر درج کریں۔\n3. کام کا موجودہ مرحلہ، انوائس کی رقم اور کوریئر ٹریکنگ لنک فوری دیکھیں۔",
    "ur-roman": "Kaam ya order track karne ka tareeqa:\n1. /track page par apna Job Card (JC-XXXXXX) ya Order number (ORD-XXXXXX) daalein.\n2. Apna registered phone number likhein.\n3. Live repair status, invoice balance aur courier tracking status check karein."
  }'::jsonb,
  '{
    "en": ["track", "tracking", "status", "job card", "order status", "check status"],
    "ur": ["ٹریک", "ٹریکنگ", "اسٹیٹس", "جاب کارڈ", "کام کی حالت"],
    "ur-roman": ["track", "tracking", "status", "kaam kahan tak pohncha", "order track"]
  }'::jsonb,
  14,
  true
),
(
  '90000000-0000-0000-0000-000000000015',
  'booking_delivery',
  '{
    "en": "Returns & Defective Parts Exchange Guidelines",
    "ur": "سامان کی واپسی اور تبدیلی کی شرائط",
    "ur-roman": "Returns Aur Exchange Guidelines"
  }'::jsonb,
  '{
    "en": "Spare parts return and exchange terms are confirmed directly with our workshop team upon request. Please contact our front desk on WhatsApp or visit the workshop with your invoice and original packaging for review.",
    "ur": "اسپیئر پارٹس کی واپسی اور تبدیلی کی شرائط کی تصدیق ورکشاپ ٹیم سے کی جاتی ہے۔ برائے مہربانی رسید اور اصل پیکنگ کے ہمراہ واٹس ایپ پر رابطہ کریں یا ورکشاپ تشریف لائیں۔",
    "ur-roman": "Spare parts return ya exchange policy workshop team se confirm ki jaati hai. Barah-e-karam apni invoice aur original packing ke sath WhatsApp par rabta karein ya workshop visit karein."
  }'::jsonb,
  '{
    "en": ["return", "returns", "exchange", "refund", "claim", "defective"],
    "ur": ["واپسی", "تبدیلی", "ریفرنڈ", "کلیم", "خراب سامان"],
    "ur-roman": ["return", "wapsi", "exchange", "refund", "claim", "badalna"]
  }'::jsonb,
  15,
  true
),
(
  '90000000-0000-0000-0000-000000000016',
  'parts',
  '{
    "en": "Spare Parts Compatibility & Verification",
    "ur": "اسپیئر پارٹس کی مطابقت اور تصدیق",
    "ur-roman": "Spare Parts Compatibility Aur Verification"
  }'::jsonb,
  '{
    "en": "Every auto part listed at Pak Auto Works is verified for compatibility:\n- Use our Vehicle Selector (/catalogue) to filter parts engineered specifically for your car make, model, and year.\n- We stock genuine OEM parts, imported components, and premium aftermarket brands.\n- Every product is visually inspected prior to dispatch.",
    "ur": "پاک آٹو ورکس پر فروخت ہونے والے تمام آٹو پارٹس تصدیق شدہ ہیں:\n- اپنی گاڑی کا میک، ماڈل اور سال منتخب کر کے مطابقت رکھنے والے پارٹس فلٹر کریں۔\n- ہم اصل OEM، امپورٹڈ اور معیاری بعد از مارکیٹ برانڈز فراہم کرتے ہیں۔\n- ڈسپیچ سے قبل ہر پارٹ کا بصری معائنہ کیا جاتا ہے۔",
    "ur-roman": "Pak Auto Works par tamam parts verified hain:\n- Vehicle selector se apni gaari ke model ke mutabiq fitment check karein.\n- OEM aur imported aftermarket brands mojood hain.\n- Dispatch se pehle visual inspection kiya jata hai."
  }'::jsonb,
  '{
    "en": ["compatibility", "fitment", "parts verification", "oem"],
    "ur": ["تصدیق", "مطابقت", "او ای ایم", "فٹمنٹ"],
    "ur-roman": ["compatibility", "fitment", "asli saman", "oem"]
  }'::jsonb,
  16,
  true
);

-- 2. SEED 6 REALISTIC CHAT SESSIONS & MESSAGES (FOR ADMIN PREVIEW)
delete from public.chat_sessions where is_demo = true;

insert into public.chat_sessions (
  id,
  started_at,
  language,
  vehicle,
  engine_used,
  message_count,
  is_demo
) values
(
  '90000000-0001-0000-0000-000000000001',
  now() - interval '2 hours',
  'en',
  '{"make": "Toyota", "model": "Corolla", "year": 2021}'::jsonb,
  'local',
  2,
  true
),
(
  '90000000-0001-0000-0000-000000000002',
  now() - interval '4 hours',
  'ur-roman',
  '{"make": "Honda", "model": "Civic", "year": 2018}'::jsonb,
  'local',
  2,
  true
),
(
  '90000000-0001-0000-0000-000000000003',
  now() - interval '1 day',
  'ur',
  '{"make": "Suzuki", "model": "Cultus", "year": 2020}'::jsonb,
  'local',
  2,
  true
),
(
  '90000000-0001-0000-0000-000000000004',
  now() - interval '1 day 6 hours',
  'en',
  '{"make": "Toyota", "model": "Yaris", "year": 2022}'::jsonb,
  'local',
  2,
  true
),
(
  '90000000-0001-0000-0000-000000000005',
  now() - interval '2 days',
  'ur-roman',
  '{"make": "Suzuki", "model": "Alto", "year": 2021}'::jsonb,
  'local',
  2,
  true
),
(
  '90000000-0001-0000-0000-000000000006',
  now() - interval '3 days',
  'en',
  '{"make": "Honda", "model": "City", "year": 2019}'::jsonb,
  'local',
  2,
  true
);

insert into public.chat_messages (
  id,
  session_id,
  role,
  content,
  created_at
) values
-- Session 1 (English, Brakes)
(
  '90000000-0002-0000-0000-000000000001',
  '90000000-0001-0000-0000-000000000001',
  'user',
  'My car brakes are making a squeaking noise when stopping. How much will brake service cost?',
  now() - interval '2 hours'
),
(
  '90000000-0002-0000-0000-000000000002',
  '90000000-0001-0000-0000-000000000001',
  'assistant',
  'Squeaking noises, soft pedals, or grinding indicate worn brake pads or rotor wear.\n• Recommended Service: Brake System Inspection & Service\n• Estimated Cost: Rs. 2,500 – Rs. 4,500\n\n⚠️ Note: A physical inspection by our certified mechanics is always required for final diagnosis.',
  now() - interval '2 hours' + interval '2 seconds'
),

-- Session 2 (Roman Urdu, AC)
(
  '90000000-0002-0000-0000-000000000003',
  '90000000-0001-0000-0000-000000000002',
  'user',
  'Civic ka AC bilkul thanda nahi kar raha, gas refill ka kya charge hai?',
  now() - interval '4 hours'
),
(
  '90000000-0002-0000-0000-000000000004',
  '90000000-0001-0000-0000-000000000002',
  'assistant',
  'AC cooling na karne ki ahem wajohat gas leak, choked cabin filter ya condenser dust ho sakti hai.\n• Recommended Service: AC Cooling Diagnosis & Refrigerant Service\n• Estimated Cost: Rs. 3,500 – Rs. 8,000\n\n⚠️ Note: Final diagnosis ke liye workshop par physical inspection laazmi hai.',
  now() - interval '4 hours' + interval '2 seconds'
),

-- Session 3 (Urdu, Delivery in Sadiqabad)
(
  '90000000-0002-0000-0000-000000000005',
  '90000000-0001-0000-0000-000000000003',
  'user',
  'کیا صادق آباد میں اسپیئر پارٹس کی ہوم ڈیلیوری فری ہے؟',
  now() - interval '1 day'
),
(
  '90000000-0002-0000-0000-000000000006',
  '90000000-0001-0000-0000-000000000003',
  'assistant',
  'جی بالکل! صادق آباد میونسپلٹی میں تمام آٹو پارٹس کی ڈیلیوری 100% مفت (Free Delivery) ہے۔ جبکہ دیگر تمام شہروں کے لیے فلیٹ 300 روپے کوریئر چارجز ہیں اور کیش آن ڈیلیوری (COD) کی سہولت موجود ہے۔',
  now() - interval '1 day' + interval '2 seconds'
),

-- Session 4 (English, Check Engine light)
(
  '90000000-0002-0000-0000-000000000007',
  '90000000-0001-0000-0000-000000000004',
  'user',
  'The check engine warning light came on while driving on the highway.',
  now() - interval '1 day 6 hours'
),
(
  '90000000-0002-0000-0000-000000000008',
  '90000000-0001-0000-0000-000000000004',
  'assistant',
  'Dashboard warning lights (Check Engine, ABS, Airbag, Battery, Oil Pressure) signal an active diagnostic trouble code recorded by the ECU.\n• Our workshop utilizes computerized OBD-II scanners to pinpoint the exact circuit or sensor fault.\n\n⚠️ Note: A physical inspection by our certified mechanics is always required for final diagnosis.',
  now() - interval '1 day 6 hours' + interval '2 seconds'
),

-- Session 5 (Roman Urdu, Oil Change)
(
  '90000000-0002-0000-0000-000000000009',
  '90000000-0001-0000-0000-000000000005',
  'user',
  'Suzuki Alto ka mobil oil aur filter change karwana hai, charges batayein.',
  now() - interval '2 days'
),
(
  '90000000-0002-0000-0000-000000000010',
  '90000000-0001-0000-0000-000000000005',
  'assistant',
  'Engine oil aur filter service:\n• Interval: Har 5,000 se 8,000 km par oil change karwayein.\n• Labor Cost: Rs. 1,500 – Rs. 2,500 + genuine oil & filter.\n\nAap abhi apna time slot book kar saktay hain!',
  now() - interval '2 days' + interval '2 seconds'
),

-- Session 6 (English, Tracking)
(
  '90000000-0002-0000-0000-000000000011',
  '90000000-0001-0000-0000-000000000006',
  'user',
  'Where can I track my repair job card JC-000001?',
  now() - interval '3 days'
),
(
  '90000000-0002-0000-0000-000000000012',
  '90000000-0001-0000-0000-000000000006',
  'assistant',
  'You can track live progress of your workshop repair job or parts delivery order online at /track.\n• You will need your Job Card number (e.g. JC-000001) or Order number and registered phone number.\n\nClick the link below to open the tracking form:',
  now() - interval '3 days' + interval '2 seconds'
);
