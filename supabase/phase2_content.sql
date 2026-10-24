-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 2 PUBLIC INFORMATION & CONTENT SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisite: supabase/phase1_foundation.sql must be run first.
-- Adds site_settings columns, services, faqs, pages, contact_messages,
-- public.submit_contact_message RPC with SHA-256 IP + phone rate limiting,
-- RLS policies, indexes, and 3-language seed data.
-- =============================================================================

-- =============================================================================
-- 1. EXTEND SITE_SETTINGS TABLE
-- =============================================================================
alter table public.site_settings
  add column if not exists hero_image_url text not null default 'https://cdn.phototourl.com/member/2026-10-10-8e816f50-4e8e-4e00-94e3-5873fbb8ff7f.jpg',
  add column if not exists about_image_url text not null default 'https://cdn.phototourl.com/member/2026-10-10-b8d3813a-db0c-4906-a73f-127f73bd4c54.jpg',
  add column if not exists cta_banner_url text not null default 'https://plain-eeur-prod-public.komododecks.com/202610/10/NuygQByhmXqHCeE5pYYz/image.png',
  add column if not exists og_image_url text not null default '',
  add column if not exists about_title jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  add column if not exists about_body jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb;

-- Apply Section A site images (A1, A2, A17) if currently empty or set to Kommodo share links
update public.site_settings
set
  hero_image_url = case
    when hero_image_url = '' then 'https://cdn.phototourl.com/member/2026-10-10-8e816f50-4e8e-4e00-94e3-5873fbb8ff7f.jpg'
    else hero_image_url
  end,
  about_image_url = case
    when about_image_url = '' then 'https://cdn.phototourl.com/member/2026-10-10-b8d3813a-db0c-4906-a73f-127f73bd4c54.jpg'
    else about_image_url
  end,
  cta_banner_url = case
    when cta_banner_url in ('', 'https://kommodo.ai/i/NuygQByhmXqHCeE5pYYz') then 'https://plain-eeur-prod-public.komododecks.com/202610/10/NuygQByhmXqHCeE5pYYz/image.png'
    else cta_banner_url
  end
where id = 1;

-- =============================================================================
-- 2. SERVICES TABLE
-- =============================================================================
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  short_description jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  description jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  includes jsonb not null default '{"en": [], "ur": [], "ur-roman": []}'::jsonb,
  estimated_time jsonb null,
  price_from numeric(10,2) null check (price_from is null or price_from >= 0),
  price_to numeric(10,2) null check (price_to is null or price_to >= 0),
  price_note jsonb null,
  image_url text not null default '',
  icon text not null default 'Wrench',
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_services_price_range check (
    price_from is null or price_to is null or price_to >= price_from
  )
);

drop trigger if exists trg_services_updated_at on public.services;
create trigger trg_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

create index if not exists idx_services_slug on public.services(slug);
create index if not exists idx_services_active_sort on public.services(is_active, sort_order);

alter table public.services enable row level security;

drop policy if exists "Public can view active services" on public.services;
create policy "Public can view active services"
  on public.services for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert services" on public.services;
create policy "Admins can insert services"
  on public.services for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update services" on public.services;
create policy "Admins can update services"
  on public.services for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete services" on public.services;
create policy "Admins can delete services"
  on public.services for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 3. FAQS TABLE
-- =============================================================================
create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  answer jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  category text not null default 'general' check (
    category in ('general', 'services', 'booking', 'parts', 'delivery', 'payments')
  ),
  service_id uuid null references public.services(id) on delete cascade,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_faqs_updated_at on public.faqs;
create trigger trg_faqs_updated_at
before update on public.faqs
for each row execute function public.set_updated_at();

create index if not exists idx_faqs_category on public.faqs(category);
create index if not exists idx_faqs_service_id on public.faqs(service_id);
create index if not exists idx_faqs_active_sort on public.faqs(is_active, sort_order);

alter table public.faqs enable row level security;

drop policy if exists "Public can view active faqs" on public.faqs;
create policy "Public can view active faqs"
  on public.faqs for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert faqs" on public.faqs;
create policy "Admins can insert faqs"
  on public.faqs for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update faqs" on public.faqs;
create policy "Admins can update faqs"
  on public.faqs for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete faqs" on public.faqs;
create policy "Admins can delete faqs"
  on public.faqs for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 4. PAGES TABLE (LEGAL & STATIC PAGES)
-- =============================================================================
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (
    slug in ('privacy', 'terms', 'returns', 'delivery-policy')
  ),
  title jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  content jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_pages_updated_at on public.pages;
create trigger trg_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

alter table public.pages enable row level security;

drop policy if exists "Public can view published pages" on public.pages;
create policy "Public can view published pages"
  on public.pages for select
  to anon, authenticated
  using (is_published = true or public.is_admin());

drop policy if exists "Admins can insert pages" on public.pages;
create policy "Admins can insert pages"
  on public.pages for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update pages" on public.pages;
create policy "Admins can update pages"
  on public.pages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete pages" on public.pages;
create policy "Admins can delete pages"
  on public.pages for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 5. CONTACT_MESSAGES TABLE
-- =============================================================================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 10 and 15),
  email text null check (email is null or char_length(email) <= 120),
  subject text null check (subject is null or char_length(subject) <= 120),
  message text not null check (char_length(message) between 10 and 2000),
  language text not null default 'en',
  status text not null default 'new' check (
    status in ('new', 'read', 'replied', 'archived')
  ),
  ip_hash text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_contact_messages_updated_at on public.contact_messages;
create trigger trg_contact_messages_updated_at
before update on public.contact_messages
for each row execute function public.set_updated_at();

create index if not exists idx_contact_messages_status_created on public.contact_messages(status, created_at desc);
create index if not exists idx_contact_messages_ip_hash_created on public.contact_messages(ip_hash, created_at);
create index if not exists idx_contact_messages_phone_created on public.contact_messages(phone, created_at);

alter table public.contact_messages enable row level security;

-- Admin-only direct access; public submissions go exclusively through public.submit_contact_message()
drop policy if exists "Admins can view contact messages" on public.contact_messages;
create policy "Admins can view contact messages"
  on public.contact_messages for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 6. RPC: public.submit_contact_message
-- =============================================================================
create or replace function public.submit_contact_message(
  p_name text,
  p_phone text,
  p_email text default null,
  p_subject text default null,
  p_message text default '',
  p_language text default 'en'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_subject text;
  v_message text;
  v_lang text;
  v_headers json;
  v_forwarded text;
  v_raw_ip text;
  v_ip_hash text;
  v_ip_count int;
  v_phone_count int;
begin
  v_name := btrim(coalesce(p_name, ''));
  v_phone := regexp_replace(btrim(coalesce(p_phone, '')), '[\s\-]+', '', 'g');
  v_email := nullif(btrim(coalesce(p_email, '')), '');
  v_subject := nullif(btrim(coalesce(p_subject, '')), '');
  v_message := btrim(coalesce(p_message, ''));
  v_lang := coalesce(nullif(btrim(p_language), ''), 'en');

  -- Validate lengths & formats
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'invalid_input';
  end if;

  if v_phone !~ '^(\+92|0)3[0-9]{9}$' or char_length(v_phone) < 10 or char_length(v_phone) > 15 then
    raise exception 'invalid_input';
  end if;

  if v_email is not null then
    if char_length(v_email) > 120 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
      raise exception 'invalid_input';
    end if;
  end if;

  if v_subject is not null and char_length(v_subject) > 120 then
    raise exception 'invalid_input';
  end if;

  if char_length(v_message) < 10 or char_length(v_message) > 2000 then
    raise exception 'invalid_input';
  end if;

  if v_lang not in ('en', 'ur', 'ur-roman') then
    v_lang := 'en';
  end if;

  -- Compute SHA-256 ip_hash from x-forwarded-for (never store raw IP)
  begin
    v_headers := current_setting('request.headers', true)::json;
    v_forwarded := v_headers->>'x-forwarded-for';
  exception when others then
    v_forwarded := null;
  end;

  v_raw_ip := btrim(split_part(coalesce(v_forwarded, ''), ',', 1));
  if v_raw_ip <> '' then
    v_ip_hash := encode(digest(v_raw_ip, 'sha256'), 'hex');
  else
    v_ip_hash := null;
  end if;

  -- Rate limit check 1: >= 5 submissions from same ip_hash in the last hour
  if v_ip_hash is not null then
    select count(*)
      into v_ip_count
      from public.contact_messages
     where ip_hash = v_ip_hash
       and created_at >= now() - interval '1 hour';

    if v_ip_count >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  -- Rate limit check 2: >= 3 submissions from same phone in the last hour
  select count(*)
    into v_phone_count
    from public.contact_messages
   where phone = v_phone
     and created_at >= now() - interval '1 hour';

  if v_phone_count >= 3 then
    raise exception 'rate_limited';
  end if;

  insert into public.contact_messages (
    name,
    phone,
    email,
    subject,
    message,
    language,
    status,
    ip_hash
  )
  values (
    v_name,
    v_phone,
    v_email,
    v_subject,
    v_message,
    v_lang,
    'new',
    v_ip_hash
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.submit_contact_message(text, text, text, text, text, text) to anon, authenticated;

-- =============================================================================
-- 7. SEED DATA — 14 SERVICES (3 LANGUAGES, NO INVENTED PRICES OR TIMES)
-- =============================================================================
insert into public.services (
  slug,
  name,
  short_description,
  description,
  includes,
  estimated_time,
  price_from,
  price_to,
  price_note,
  image_url,
  icon,
  sort_order,
  is_active,
  is_featured
)
values
  (
    'engine',
    '{"en": "Engine Repair & Tuning", "ur": "انجن ریپیئر اور ٹیوننگ", "ur-roman": "Engine Repair aur Tuning"}'::jsonb,
    '{"en": "Engine diagnostics, tuning, timing adjustment, gasket replacement, and overhaul work.", "ur": "انجن ڈائیگنوسٹکس، ٹیوننگ، ٹائمنگ، گیسکٹ اور مکمل انجن کا کام۔", "ur-roman": "Engine diagnostics, tuning, timing adjustment, gasket aur overhaul ka kaam."}'::jsonb,
    '{"en": "We inspect and service petrol, diesel, and hybrid engines to address rough idling, misfires, overheating, or loss of power. All mechanical adjustments and replacements are carried out after inspecting your vehicle at the workshop.", "ur": "ہم پیٹرول، ڈیزل اور ہائبرڈ انجنوں کا معائنہ اور مرمت کرتے ہیں تاکہ مس فائر، اوور ہیٹنگ یا طاقت میں کمی کے مسائل حل کیے جا سکیں۔ تمام مکینیکل کام ورکشاپ میں گاڑی کے معائنے کے بعد کیا جاتا ہے۔", "ur-roman": "Hum petrol, diesel aur hybrid engines ka muaina aur service karte hain taake misfire, overheating ya pickup ke masail hal kiye ja sakein. Tamam mechanical kaam workshop mein gari check karne ke baad kiya jata hai."}'::jsonb,
    '{"en": ["Throttle body and injector cleaning", "Spark plug and ignition coil inspection", "Compression and leak-down check", "Timing belt or chain inspection", "Cooling and gasket leak inspection"], "ur": ["تھراٹل باڈی اور انجیکٹر کی صفائی", "اسپارک پلگ اور اگنیشن کوائل چیک", "کمپریشن اور لیک چیک", "ٹائمنگ بیلٹ یا چین کا معائنہ", "کولنگ اور گیسکٹ لیک کا معائنہ"], "ur-roman": ["Throttle body aur injector safai", "Spark plug aur ignition coil check", "Compression aur leak check", "Timing belt ya chain inspection", "Cooling aur gasket leak muaina"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-7011f4d3-a3f8-440f-8f49-ff3a3ee31ec7.jpg', 'Cog', 1, true, true
  ),
  (
    'denting-painting',
    '{"en": "Denting & Painting", "ur": "ڈینٹنگ اور پینٹنگ", "ur-roman": "Denting aur Painting"}'::jsonb,
    '{"en": "Body panel repair, dent removal, rust treatment, and paint refinishing.", "ur": "باڈی پینل کی مرمت، ڈینٹ نکالنا، زنگ کا علاج اور پینٹ کا کام۔", "ur-roman": "Body panel repair, dent nikalna, zang ka ilaj aur paint refinishing."}'::jsonb,
    '{"en": "Our body shop handles minor scratches, bumper repairs, panel alignment, and full-body repainting. Surface preparation and color matching are performed according to your vehicle''s existing paint finish.", "ur": "ہماری باڈی شاپ معمولی خراشوں، بمپر کی مرمت، پینل الائنمنٹ اور مکمل پینٹ کا کام کرتی ہے۔ سطح کی تیاری اور رنگ کی مطابقت گاڑی کے موجودہ پینٹ کے مطابق کی جاتی ہے۔", "ur-roman": "Hamari body shop mamooli scratches, bumper repair, panel alignment aur mukammal paint ka kaam karti hai. Surface tayari aur color matching gari ke mojooda paint ke mutabiq ki jati hai."}'::jsonb,
    '{"en": ["Dent pulling and panel alignment", "Bumper repair and refitting", "Rust removal and primer coating", "Panel or full-body paint application", "Clear coat polishing and finishing"], "ur": ["ڈینٹ نکالنا اور پینل الائنمنٹ", "بمپر کی مرمت اور فٹنگ", "زنگ صاف کرنا اور پرائمر کوٹنگ", "پینل یا مکمل گاڑی کا پینٹ", "کلیئر کوٹ پالش اور فنشنگ"], "ur-roman": ["Dent pulling aur panel alignment", "Bumper repair aur fitting", "Zang safai aur primer coating", "Panel ya mukammal body paint", "Clear coat polish aur finishing"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-9a62423f-31c4-4615-8850-269d1f20566d.jpg', 'PaintBucket', 2, true, true
  ),
  (
    'ac-repair',
    '{"en": "AC Repair & Service", "ur": "اے سی ریپیئر اور سروس", "ur-roman": "AC Repair aur Service"}'::jsonb,
    '{"en": "Cabin cooling inspection, refrigerant recharge, leak testing, and compressor service.", "ur": "کیبن کولنگ چیک، گیس ری فل، لیک ٹیسٹنگ اور کمپریسر سروس۔", "ur-roman": "Cabin cooling check, gas refill, leak testing aur compressor service."}'::jsonb,
    '{"en": "Keep your vehicle''s air conditioning and heating system working reliably across all seasons. We test system pressures, inspect hoses and condensers for leaks, and clean cabin airflow components.", "ur": "ہر موسم میں اپنی گاڑی کے اے سی اور ہیٹنگ سسٹم کو بہترین حالت میں رکھیں۔ ہم پریشر چیک کرتے ہیں، پائپ اور کنڈینسر کی لیکج چیک کرتے ہیں اور کیبن ایئر فلو کی صفائی کرتے ہیں۔", "ur-roman": "Har mausam mein apni gari ke AC aur heating system ko behtareen halat mein rakhein. Hum pressure test karte hain, pipes aur condenser ki leakage check karte hain aur airflow safai karte hain."}'::jsonb,
    '{"en": ["AC pressure and cooling performance check", "Leak detection across pipes and condenser", "Refrigerant gas evacuation and refill", "Compressor and clutch inspection", "Cabin air filter and evaporator cleaning"], "ur": ["اے سی پریشر اور کولنگ چیک", "پائپ اور کنڈینسر میں لیک کی جانچ", "ریفریجرینٹ گیس ری فل", "کمپریسر اور کلچ کا معائنہ", "کیبن فلٹر اور ایواپوریٹر کی صفائی"], "ur-roman": ["AC pressure aur cooling check", "Pipes aur condenser leak test", "Refrigerant gas refill", "Compressor aur clutch inspection", "Cabin filter aur evaporator safai"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-fdc8b7bd-9856-4687-a17d-bbb0420cc7b6.jpg', 'Snowflake', 3, true, true
  ),
  (
    'electrical',
    '{"en": "Auto Electrical", "ur": "آٹو الیکٹریکل", "ur-roman": "Auto Electrical"}'::jsonb,
    '{"en": "Computerized OBD-II scanning, wiring repair, sensors, alternator, and starter motor work.", "ur": "کمپیوٹرائزڈ اسکیننگ، وائرنگ، سینسرز، الٹرنیٹر اور سلف اسٹارٹر کا کام۔", "ur-roman": "Computerized OBD-II scanning, wiring repair, sensors, alternator aur starter ka kaam."}'::jsonb,
    '{"en": "Modern vehicles rely on sensors, control modules, and intact wiring harnesses. We use diagnostic scanners and electrical testing tools to trace faults, warning lights, and charging issues.", "ur": "جدید گاڑیاں سینسرز، کنٹرول ماڈیولز اور وائرنگ پر انحصار کرتی ہیں۔ ہم ڈائیگنوسٹک اسکینر اور ٹیسٹنگ ٹولز سے فالٹ کوڈز، وارننگ لائٹس اور چارجنگ کے مسائل تلاش کرتے ہیں۔", "ur-roman": "Jadeed gariyan sensors, control modules aur wiring par chalti hain. Hum diagnostic scanner aur electrical tools se fault codes, warning lights aur charging masail hal karte hain."}'::jsonb,
    '{"en": ["OBD-II fault code scanning and diagnosis", "Alternator and starter motor testing", "Sensor and actuator troubleshooting", "Headlight, taillight, and interior lighting repair", "Fuse box and wiring harness inspection"], "ur": ["OBD-II فالٹ کوڈ اسکیننگ اور تشخیص", "الٹرنیٹر اور سلف اسٹارٹر ٹیسٹنگ", "سینسرز اور ایکچویٹرز کی جانچ", "ہیڈ لائٹ، بیک لائٹ اور انٹیریئر لائٹس کی مرمت", "فیوز باکس اور وائرنگ کا معائنہ"], "ur-roman": ["OBD-II fault code scanning", "Alternator aur starter motor test", "Sensors aur actuators check", "Headlight aur interior lights repair", "Fuse box aur wiring inspection"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-a294f282-375b-41f9-93bb-9ef0f6ad4a76.jpg', 'Zap', 4, true, true
  ),
  (
    'tyres',
    '{"en": "Tyres", "ur": "ٹائرز", "ur-roman": "Tyres"}'::jsonb,
    '{"en": "Tyre inspection, replacement, rotation, pressure check, and puncture repair.", "ur": "ٹائر کا معائنہ، تبدیلی، روٹیشن، ہوا کا دباؤ اور پنکچر ریپیئر۔", "ur-roman": "Tyre muaina, tabdeeli, rotation, air pressure check aur puncture repair."}'::jsonb,
    '{"en": "Good tyre condition is essential for road grip, braking distance, and fuel economy. We inspect tread wear and sidewalls, fit replacement tyres, and rotate wheels for even wear.", "ur": "سڑک پر مضبوط گرفت، بریک اور فیول ایوریج کے لیے ٹائروں کی درست حالت بہت ضروری ہے۔ ہم ٹریڈ اور سائیڈ وال کا معائنہ کرتے ہیں، نئے ٹائر لگاتے ہیں اور ٹائر روٹیشن کرتے ہیں۔", "ur-roman": "Road grip, braking aur fuel economy ke liye tyres ki behtar halat zaroori hai. Hum tread wear check karte hain, naye tyres fit karte hain aur tyre rotation karte hain."}'::jsonb,
    '{"en": ["Tread depth and sidewall inspection", "Tyre mounting and demounting", "Tyre rotation across axles", "Valve stem inspection and replacement", "Puncture inspection and repair"], "ur": ["ٹریڈ ڈیپتھ اور سائیڈ وال کا معائنہ", "ٹائر چڑھانا اور اتارنا", "ٹائر روٹیشن", "والو اسٹیم چیک اور تبدیلی", "پنکچر کا معائنہ اور مرمت"], "ur-roman": ["Tread depth aur sidewall check", "Tyre mounting aur fitting", "Tyre rotation", "Valve stem check aur tabdeeli", "Puncture repair"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-bcb1d8b4-42a2-46b4-8d62-2c20900d88d5.jpg', 'CircleDot', 5, true, true
  ),
  (
    'car-wash-detailing',
    '{"en": "Car Wash & Detailing", "ur": "کار واش اور ڈیٹیلنگ", "ur-roman": "Car Wash aur Detailing"}'::jsonb,
    '{"en": "Exterior wash, interior vacuuming, upholstery cleaning, and paint polishing.", "ur": "ایکسٹیریئر واش، انٹیریئر ویکیوم، سیٹوں کی صفائی اور پالش۔", "ur-roman": "Exterior wash, interior vacuum, seat safai aur paint polishing."}'::jsonb,
    '{"en": "Thorough cleaning and detailing removes road grime, dust, and interior stains. Choose from a standard wash or complete interior and exterior detailing for your vehicle.", "ur": "مکمل واش اور ڈیٹیلنگ سے گاڑی کی دھول، مٹی اور اندرونی داغ صاف ہو جاتے ہیں۔ اپنی گاڑی کے لیے عام واش یا مکمل انٹیریئر اور ایکسٹیریئر ڈیٹیلنگ منتخب کریں۔", "ur-roman": "Mukammal wash aur detailing se gari ki mitti aur andar ke daagh saaf ho jate hain. Apni gari ke liye normal wash ya full interior/exterior detailing chunein."}'::jsonb,
    '{"en": ["Exterior foam wash and rinse", "Underbody and wheel arch rinse", "Interior vacuuming and dashboard wipe-down", "Seat and carpet stain cleaning", "Exterior wax or compound polish"], "ur": ["ایکسٹیریئر فوم واش اور صفائی", "انڈر باڈی اور وہیل آرچ واش", "انٹیریئر ویکیوم اور ڈیش بورڈ کی صفائی", "سیٹوں اور کارپٹ کی صفائی", "ایکسٹیریئر ویکس یا کمپاؤنڈ پالش"], "ur-roman": ["Exterior foam wash", "Underbody aur wheel arch wash", "Interior vacuum aur dashboard safai", "Seat aur carpet cleaning", "Exterior wax ya compound polish"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-64c1c5fc-3470-4c19-8e3c-d36382be33d3.jpg', 'Sparkles', 6, true, true
  ),
  (
    'brakes',
    '{"en": "Brakes", "ur": "بریکس", "ur-roman": "Brakes"}'::jsonb,
    '{"en": "Brake pad replacement, disc skimming, shoe adjustment, and brake fluid service.", "ur": "بریک پیڈ کی تبدیلی، ڈسک ٹرننگ، بریک شو ایڈجسٹمنٹ اور بریک آئل سروس۔", "ur-roman": "Brake pad tabdeeli, disc skimming, brake shoe adjustment aur brake fluid service."}'::jsonb,
    '{"en": "Responsive brakes are critical for safe driving. If you notice squealing noises, vibration while braking, or a soft brake pedal, bring your car in for a complete brake inspection.", "ur": "محفوظ ڈرائیونگ کے لیے مضبوط بریک انتہائی ضروری ہیں۔ اگر بریک لگاتے وقت آواز آئے، وائبریشن ہو یا پیڈل نرم محسوس ہو تو بریک کا مکمل معائنہ کروائیں۔", "ur-roman": "Mehfooz driving ke liye brakes ka durust hona bohot zaroori hai. Agar brake lagate waqt aawaz aaye, vibration ho ya pedal narm lage to mukammal brake checkup karwayein."}'::jsonb,
    '{"en": ["Front and rear brake pad inspection", "Brake rotor / disc surface check and skimming", "Rear drum and brake shoe service", "Brake caliper slide pin lubrication", "Brake fluid level and leak check"], "ur": ["اگلے اور پچھلے بریک پیڈ کا معائنہ", "بریک ڈسک کی جانچ اور ٹرننگ", "پچھلے ڈرم اور بریک شو کی سروس", "کیلیپر پن کی گریسنگ", "بریک آئل لیول اور لیک چیک"], "ur-roman": ["Front aur rear brake pad check", "Brake disc check aur skimming", "Rear drum aur brake shoe service", "Caliper pin lubrication", "Brake fluid level aur leak check"]}'::jsonb,
    null, null, null, null, 'https://cdn.phototourl.com/member/2026-10-10-0ad0e96d-931c-44cf-a41f-49c1fe8aa9b2.jpg', 'Disc3', 7, true, true
  ),
  (
    'suspension-steering',
    '{"en": "Suspension & Steering", "ur": "سسپنشن اور اسٹیئرنگ", "ur-roman": "Suspension aur Steering"}'::jsonb,
    '{"en": "Shock absorbers, bushes, control arms, tie rods, axles, and steering rack repair.", "ur": "شاک ایبزاربر، بش، کنٹرول آرم، ٹائی راڈ، ایکسل اور اسٹیئرنگ ریک کی مرمت۔", "ur-roman": "Shock absorbers, bushes, control arms, tie rods, axles aur steering rack repair."}'::jsonb,
    '{"en": "Rough roads can wear out suspension joints, bushes, and shock absorbers over time. We inspect the entire under-carriage to restore ride comfort and steering stability.", "ur": "خراب سڑکوں کی وجہ سے وقت کے ساتھ سسپنشن بش، جوائنٹس اور شاکس کمزور ہو جاتے ہیں۔ ہم آرام دہ سفر اور مضبوط اسٹیئرنگ کے لیے مکمل انڈر کیرج کا معائنہ کرتے ہیں۔", "ur-roman": "Kharab sarkon ki wajah se suspension bushes, joints aur shocks ghis jate hain. Hum aaramdeh safar aur steering control ke liye mukammal under-carriage check karte hain."}'::jsonb,
    '{"en": ["Shock absorber and strut inspection", "Control arm and rubber bush replacement", "Ball joint and tie rod end check", "CV joint and drive axle inspection", "Steering rack and power steering check"], "ur": ["شاک ایبزاربر اور اسٹرٹ کا معائنہ", "کنٹرول آرم اور ربڑ بش کی تبدیلی", "بال جوائنٹ اور ٹائی راڈ چیک", "سی وی جوائنٹ اور ایکسل کا معائنہ", "اسٹیئرنگ ریک اور پاور اسٹیئرنگ چیک"], "ur-roman": ["Shock absorber aur strut check", "Control arm aur bush tabdeeli", "Ball joint aur tie rod check", "CV joint aur axle inspection", "Steering rack aur power steering check"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/2tdS7EMNiVYKWW8c2s5e/image.png', 'Activity', 8, true, true
  ),
  (
    'oil-change-service',
    '{"en": "Oil Change & Periodic Service", "ur": "آئل چینج اور پیریوڈک سروس", "ur-roman": "Oil Change aur Periodic Service"}'::jsonb,
    '{"en": "Engine oil, oil filter, air filter, cabin filter, and routine fluid checks.", "ur": "انجن آئل، آئل فلٹر، ایئر فلٹر، کیبن فلٹر اور دیگر فلوئڈز کی تبدیلی۔", "ur-roman": "Engine oil, oil filter, air filter, cabin filter aur routine fluids check."}'::jsonb,
    '{"en": "Regular oil and filter changes protect your engine against wear and sludge buildup. We drain old oil, install compatible filters, and check essential fluids during every periodic service.", "ur": "وقت پر انجن آئل اور فلٹرز کی تبدیلی انجن کو گھسنے اور کچرے سے محفوظ رکھتی ہے۔ ہم پرانا آئل نکال کر موزوں فلٹر لگاتے ہیں اور تمام ضروری فلوئڈز چیک کرتے ہیں۔", "ur-roman": "Waqt par engine oil aur filters ki tabdeeli engine ko ghisne se bachati hai. Hum purana oil drain kar ke compatible filters lagate hain aur zaroori fluids check karte hain."}'::jsonb,
    '{"en": ["Engine oil drain and refill", "Oil filter replacement", "Air filter and cabin filter inspection or change", "Coolant, brake fluid, and washer fluid top-up check", "Basic multi-point visual check"], "ur": ["انجن آئل ڈرین اور ری فل", "آئل فلٹر کی تبدیلی", "ایئر فلٹر اور کیبن فلٹر کی صفائی یا تبدیلی", "کولنٹ، بریک آئل اور واشر واٹر چیک", "بنیادی ملٹی پوائنٹ معائنہ"], "ur-roman": ["Engine oil drain aur refill", "Oil filter replacement", "Air filter aur cabin filter check", "Coolant aur brake fluid level check", "Basic visual inspection"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/s71pHYGAuUiyxdfXpIet/image.jpg', 'Droplet', 9, true, true
  ),
  (
    'battery',
    '{"en": "Battery", "ur": "بیٹری", "ur-roman": "Battery"}'::jsonb,
    '{"en": "Battery load testing, charging voltage check, terminal cleaning, and battery replacement.", "ur": "بیٹری لوڈ ٹیسٹ، چارجنگ وولٹیج چیک، ٹرمینل صفائی اور نئی بیٹری۔", "ur-roman": "Battery load test, charging voltage check, terminal safai aur battery tabdeeli."}'::jsonb,
    '{"en": "Slow cranking or flickering lights often point to a weak battery or corroded terminals. We test battery health and charging output before recommending any replacement.", "ur": "گاڑی دیر سے اسٹارٹ ہونا یا لائٹس کا مدہم ہونا اکثر کمزور بیٹری یا خراب ٹرمینلز کی علامت ہوتا ہے۔ ہم بیٹری بدلنے کا مشورہ دینے سے پہلے اس کی ہیلتھ اور چارجنگ چیک کرتے ہیں۔", "ur-roman": "Gari late start hona ya lights dim hona aksar kamzor battery ya terminals ki wajah se hota hai. Hum battery tabdeel karne se pehle health aur charging check karte hain."}'::jsonb,
    '{"en": ["Battery state-of-health and voltage test", "Alternator charging voltage verification", "Terminal corrosion cleaning and tightening", "Parasitic drain check if required", "New battery installation and bracket securing"], "ur": ["بیٹری ہیلتھ اور وولٹیج ٹیسٹ", "الٹرنیٹر چارجنگ وولٹیج کی جانچ", "ٹرمینلز کی صفائی اور کسائی", "کرنٹ لیکج چیک (ضرورت پڑنے پر)", "نئی بیٹری کی فٹنگ"], "ur-roman": ["Battery health aur voltage test", "Alternator charging check", "Terminal corrosion safai", "Current drain check", "Nayi battery fitting"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/pxnCdhqNBXOmzKu9ssO6/image.jpg', 'BatteryCharging', 10, true, true
  ),
  (
    'wheel-alignment-balancing',
    '{"en": "Wheel Alignment & Balancing", "ur": "وہیل الائنمنٹ اور بیلنسنگ", "ur-roman": "Wheel Alignment aur Balancing"}'::jsonb,
    '{"en": "Steering centering, camber/caster/toe adjustment, and wheel weight balancing.", "ur": "اسٹیئرنگ سینٹرنگ، کیمبر/ٹو ایڈجسٹمنٹ اور وہیل بیلنسنگ۔", "ur-roman": "Steering centering, camber/toe adjustment aur wheel balancing."}'::jsonb,
    '{"en": "If your car pulls to one side or the steering wheel vibrates at highway speeds, alignment and balancing help restore straight tracking and prevent uneven tyre wear.", "ur": "اگر گاڑی ایک طرف کھنچتی ہے یا تیز رفتاری پر اسٹیئرنگ کانپتا ہے تو وہیل الائنمنٹ اور بیلنسنگ سے گاڑی سیدھی چلتی ہے اور ٹائر خراب ہونے سے بچتے ہیں۔", "ur-roman": "Agar gari ek taraf khinchti hai ya speed par steering vibrate karta hai to wheel alignment aur balancing se drive seedhi hoti hai aur tyres barabar chaltay hain."}'::jsonb,
    '{"en": ["Camber, caster, and toe angle check", "Front and rear toe adjustment", "Steering wheel centering", "Wheel spin balancing with weights", "Tyre pressure equalization"], "ur": ["کیمبر، کاسٹر اور ٹو زاویوں کی جانچ", "اگلے اور پچھلے ٹو کی ایڈجسٹمنٹ", "اسٹیئرنگ وہیل سیدھا کرنا", "وہیل بیلنسنگ اور ویٹ لگانا", "تمام ٹائروں میں ہوا کا دباؤ برابر کرنا"], "ur-roman": ["Camber, caster aur toe check", "Front aur rear alignment adjustment", "Steering wheel centering", "Wheel spin balancing", "Tyre air pressure check"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/nwz6vbqK7nSjjDuNVCQD/image.png', 'Crosshair', 11, true, false
  ),
  (
    'transmission-gearbox',
    '{"en": "Transmission / Gearbox", "ur": "ٹرانسمیشن اور گیئر باکس", "ur-roman": "Transmission aur Gearbox"}'::jsonb,
    '{"en": "Manual clutch service, automatic/CVT fluid service, and gearbox diagnostics.", "ur": "مینوئل کلچ کا کام، آٹومیٹک/سی وی ٹی آئل سروس اور گیئر باکس کی مرمت۔", "ur-roman": "Manual clutch ka kaam, automatic/CVT oil service aur gearbox diagnostics."}'::jsonb,
    '{"en": "Smooth gear shifting depends on healthy transmission fluid, clutch components, and shift solenoids. We service manual, automatic, and CVT transmissions.", "ur": "گیئرز کی ہموار تبدیلی کا انحصار درست گیئر آئل، کلچ پلیٹ اور سولینائیڈز پر ہوتا ہے۔ ہم مینوئل، آٹومیٹک اور سی وی ٹی گیئر باکس کا معائنہ اور سروس کرتے ہیں۔", "ur-roman": "Smooth gear shifting ke liye transmission fluid, clutch plate aur solenoids ka durust hona zaroori hai. Hum manual, automatic aur CVT gearboxes ki service karte hain."}'::jsonb,
    '{"en": ["Transmission fluid condition check and replacement", "Manual clutch plate and pressure plate replacement", "Clutch master and slave cylinder inspection", "Gear linkage and mount inspection", "Automatic / CVT shift diagnostics"], "ur": ["گیئر آئل کا معائنہ اور تبدیلی", "مینوئل کلچ پلیٹ اور پریشر پلیٹ کی تبدیلی", "کلچ سلنڈر کا معائنہ", "گیئر ماؤنٹ اور لنکیج چیک", "آٹومیٹک / سی وی ٹی شفٹنگ ڈائیگنوسٹکس"], "ur-roman": ["Transmission oil check aur tabdeeli", "Clutch plate aur pressure plate replacement", "Clutch cylinder check", "Gear mount aur linkage inspection", "Automatic / CVT shift diagnostics"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/kyT8ZxsNWafoe63unrAA/image.png', 'Settings', 12, true, false
  ),
  (
    'exhaust',
    '{"en": "Exhaust", "ur": "ایگزاسٹ اور سائلنسر", "ur-roman": "Exhaust aur Silencer"}'::jsonb,
    '{"en": "Exhaust pipe leak repair, muffler service, catalytic converter cleaning, and sensor check.", "ur": "ایگزاسٹ پائپ لیک کی مرمت، سائلنسر سروس، کیٹالیٹک کنورٹر کی صفائی اور سینسر چیک۔", "ur-roman": "Exhaust pipe leak repair, silencer service, catalytic converter safai aur sensor check."}'::jsonb,
    '{"en": "A clogged catalytic converter or leaking exhaust pipe can reduce fuel economy and increase noise. We inspect exhaust hangers, joints, mufflers, and oxygen sensors.", "ur": "بند کیٹالیٹک کنورٹر یا لیک سائلنسر فیول ایوریج کم کر سکتا ہے اور شور بڑھا سکتا ہے۔ ہم ایگزاسٹ جوائنٹس، مفلر اور آکسیجن سینسر کا معائنہ اور مرمت کرتے ہیں۔", "ur-roman": "Choke catalytic converter ya leak silencer fuel average kam karta hai aur shor barhata hai. Hum exhaust joints, muffler aur oxygen sensor check aur repair karte hain."}'::jsonb,
    '{"en": ["Exhaust manifold and pipe leak inspection", "Muffler and hanger bracket repair", "Catalytic converter inspection and cleaning", "Oxygen (O2) sensor check", "Exhaust gasket replacement"], "ur": ["ایگزاسٹ پائپ اور جوائنٹس کی لیک چیک", "سائلنسر اور ہینگر بریکٹ کی مرمت", "کیٹالیٹک کنورٹر کا معائنہ اور صفائی", "آکسیجن سینسر کی جانچ", "ایگزاسٹ گیسکٹ کی تبدیلی"], "ur-roman": ["Exhaust pipe leak inspection", "Silencer aur bracket repair", "Catalytic converter cleaning", "Oxygen (O2) sensor check", "Exhaust gasket replacement"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/7C3GbZs175K7YIKAfCdf/image.png', 'Wind', 13, true, false
  ),
  (
    'general-inspection',
    '{"en": "General Inspection", "ur": "جنرل انسپکشن اور چیک اپ", "ur-roman": "General Inspection aur Checkup"}'::jsonb,
    '{"en": "Pre-trip checkup, routine safety inspection, and pre-purchase vehicle assessment.", "ur": "سفر سے پہلے چیک اپ، روٹین سیفٹی معائنہ اور گاڑی خریدنے سے پہلے کی جانچ۔", "ur-roman": "Safar se pehle checkup, routine safety inspection aur gari kharidne se pehle muaina."}'::jsonb,
    '{"en": "Whether you are planning a long road trip or evaluating a used car, our general inspection covers key mechanical, electrical, fluid, brake, and suspension points.", "ur": "چاہے آپ لمبے سفر پر جا رہے ہوں یا استعمال شدہ گاڑی کا جائزہ لینا چاہتے ہوں، ہماری جنرل انسپکشن میں انجن، الیکٹریکل، فلوئڈز، بریک اور سسپنشن کے اہم پوائنٹس چیک کیے جاتے ہیں۔", "ur-roman": "Chahe aap lambe safar par ja rahe hon ya used gari check karwana chahte hon, general inspection mein engine, electrical, fluids, brakes aur suspension check kiye jate hain."}'::jsonb,
    '{"en": ["Engine bay fluids, belts, and hoses check", "Brake, tyre, and suspension visual check", "Battery and exterior lighting check", "OBD-II diagnostic scan", "Summary of recommended maintenance items"], "ur": ["انجن بے فلوئڈز، بیلٹس اور پائپ چیک", "بریک، ٹائر اور سسپنشن کا معائنہ", "بیٹری اور تمام لائٹس کی جانچ", "کمپیوٹر ڈائیگنوسٹک اسکین", "ضروری مرمت اور دیکھ بھال کی فہرست"], "ur-roman": ["Engine fluids, belts aur hoses check", "Brakes, tyres aur suspension visual check", "Battery aur lights check", "OBD-II diagnostic scan", "Recommended kaam ki summary"]}'::jsonb,
    null, null, null, null, 'https://plain-eeur-prod-public.komododecks.com/202610/10/PDlNr4YQspgdc2JsDsh7/image.jpg', 'ClipboardCheck', 14, true, false
  )
on conflict (slug) do update
set image_url = case
  when public.services.image_url = '' or public.services.image_url like 'https://kommodo.ai/i/%'
    then excluded.image_url
  else public.services.image_url
end;

-- =============================================================================
-- 8. SEED DATA — 10 FAQS (DETERMINISTIC UUIDS FOR IDEMPOTENCY)
-- =============================================================================
insert into public.faqs (
  id,
  question,
  answer,
  category,
  service_id,
  sort_order,
  is_active
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    '{"en": "How can I book a workshop service?", "ur": "میں ورکشاپ سروس کیسے بک کر سکتا ہوں؟", "ur-roman": "Main workshop service kaise book kar sakta hoon?"}'::jsonb,
    '{"en": "You can request a service slot online through our website or contact us directly by phone or WhatsApp with your vehicle make, model, and issue details.", "ur": "آپ ہماری ویب سائٹ کے ذریعے آن لائن وقت لے سکتے ہیں یا اپنی گاڑی کے میک، ماڈل اور مسئلے کی تفصیل کے ساتھ ہمیں فون یا واٹس ایپ پر رابطہ کر سکتے ہیں۔", "ur-roman": "Aap hamari website ke zariye online slot book kar sakte hain ya apni gari ke make, model aur masle ki tafseel ke sath phone ya WhatsApp par rabta kar sakte hain."}'::jsonb,
    'booking', null, 1, true
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    '{"en": "How do I track the status of my car in the workshop?", "ur": "میں ورکشاپ میں اپنی گاڑی کے کام کا اسٹیٹس کیسے ٹریک کروں؟", "ur-roman": "Main workshop mein apni gari ke kaam ka status kaise track karoon?"}'::jsonb,
    '{"en": "When your vehicle is received at the workshop, a Job Card number is assigned. You can check progress using your Job Card number and registered phone number on the Track Job page, or ask our team on WhatsApp.", "ur": "جب آپ کی گاڑی ورکشاپ میں وصول کی جاتی ہے تو ایک جاب کارڈ نمبر دیا جاتا ہے۔ آپ ٹریک جاب صفحے پر اپنے جاب کارڈ نمبر اور رجسٹرڈ فون نمبر سے اسٹیٹس دیکھ سکتے ہیں یا واٹس ایپ پر پوچھ سکتے ہیں۔", "ur-roman": "Jab aap ki gari workshop mein aati hai to ek Job Card number diya jata hai. Aap Track Job page par Job Card number aur phone number se status dekh sakte hain ya WhatsApp par pooch sakte hain."}'::jsonb,
    'services', null, 2, true
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    '{"en": "Is a physical inspection required for an exact repair quote?", "ur": "کیا درست تخمینے کے لیے گاڑی کا معائنہ ضروری ہے؟", "ur-roman": "Kya exact estimate ke liye gari ka physical inspection zaroori hai?"}'::jsonb,
    '{"en": "Yes. Initial price ranges are estimates only. A final quote is shared after inspecting your vehicle at the workshop and confirming the exact work items and parts required.", "ur": "جی ہاں۔ ابتدائی قیمتیں صرف اندازے کے لیے ہوتی ہیں۔ حتمی تخمینہ ورکشاپ میں گاڑی کے معائنے اور درکار کام و پارٹس کی تصدیق کے بعد دیا جاتا ہے۔", "ur-roman": "Jee haan. Shuru ki prices sirf andaza hoti hain. Final estimate workshop mein gari check karne aur zaroori kaam aur parts confirm karne ke baad diya jata hai."}'::jsonb,
    'services', null, 3, true
  ),
  (
    '00000000-0000-4000-8000-000000000104',
    '{"en": "What should I do before bringing my vehicle to the workshop?", "ur": "گاڑی ورکشاپ لانے سے پہلے مجھے کیا کرنا چاہیے؟", "ur-roman": "Gari workshop lane se pehle mujhe kya karna chahiye?"}'::jsonb,
    '{"en": "Please remove personal valuables from the cabin and trunk, note down any warning lights or symptoms you have observed, and share your contact number at reception.", "ur": "براہِ کرم گاڑی کے اندر اور ڈگی سے قیمتی ذاتی سامان نکال لیں، جو علامات یا وارننگ لائٹس آپ نے دیکھی ہوں انہیں نوٹ کر لیں اور استقبالیہ پر اپنا رابطہ نمبر درج کرائیں۔", "ur-roman": "Meharbani farma kar gari se apna qeemti zati saman nikal lein, jo warning lights ya masail aap ne dekhe hon unhein note kar lein aur reception par apna number darj karwayein."}'::jsonb,
    'general', null, 4, true
  ),
  (
    '00000000-0000-4000-8000-000000000105',
    '{"en": "What are the delivery charges for spare parts orders?", "ur": "اسپیئر پارٹس کے آرڈر پر ڈیلیوری چارجز کتنے ہیں؟", "ur-roman": "Spare parts orders par delivery charges kitne hain?"}'::jsonb,
    '{"en": "We offer free delivery within Sadiqabad, and a flat Rs. 300 delivery charge for the rest of Pakistan. Delivery charges are shown clearly at checkout.", "ur": "صادق آباد کے اندر ڈیلیوری بالکل مفت ہے، جبکہ باقی پورے پاکستان کے لیے فلیٹ 300 روپے ڈیلیوری چارجز ہیں۔ ڈیلیوری چارجز چیک آؤٹ پر واضح طور پر دکھائے جاتے ہیں۔", "ur-roman": "Sadiqabad ke andar delivery bilkul free hai, jabke baqi poore Pakistan ke liye flat Rs. 300 delivery charges hain. Delivery charges checkout par wazeh dikhaye jate hain."}'::jsonb,
    'delivery', null, 5, true
  ),
  (
    '00000000-0000-4000-8000-000000000106',
    '{"en": "What payment methods are supported?", "ur": "ادائیگی کے کون سے طریقے دستیاب ہیں؟", "ur-roman": "Payment ke kaun se tareeqay mojood hain?"}'::jsonb,
    '{"en": "We support Cash on Delivery (COD) and online payment options. Exact payment availability and instructions will be shown at checkout.", "ur": "ہم کیش آن ڈیلیوری (COD) اور آن لائن ادائیگی کی سہولت فراہم کرتے ہیں۔ ادائیگی کے دستیاب طریقے اور ہدایات چیک آؤٹ پر دکھائی جائیں گی۔", "ur-roman": "Hum Cash on Delivery (COD) aur online payment options support karte hain. Payment availability aur tafseelat checkout par dikhayi jayein gi."}'::jsonb,
    'payments', null, 6, true
  ),
  (
    '00000000-0000-4000-8000-000000000107',
    '{"en": "How do I know if a spare part fits my car?", "ur": "مجھے کیسے پتہ چلے گا کہ کوئی پارٹ میری گاڑی کے مطابق ہے؟", "ur-roman": "Mujhe kaise pata chale ga ke koi part meri gari mein fit aaye ga?"}'::jsonb,
    '{"en": "Each part listing includes compatibility details by vehicle make, model, and year. If you are unsure, message us on WhatsApp with your car details before ordering.", "ur": "ہر پارٹ کے ساتھ گاڑی کے میک، ماڈل اور سال کی مطابقت درج ہوتی ہے۔ اگر آپ کو شک ہو تو آرڈر کرنے سے پہلے واٹس ایپ پر اپنی گاڑی کی تفصیل بھیج کر تصدیق کر لیں۔", "ur-roman": "Har part ke sath gari ke make, model aur saal ki maloomat hoti hai. Agar aap confirm karna chahein to order se pehle WhatsApp par apni gari ki tafseel bhej dein."}'::jsonb,
    'parts', null, 7, true
  ),
  (
    '00000000-0000-4000-8000-000000000108',
    '{"en": "Can I buy parts and book installation at the same time?", "ur": "کیا میں پارٹس خریدنے کے ساتھ ان کی فٹنگ بھی بک کر سکتا ہوں؟", "ur-roman": "Kya main parts kharidne ke sath workshop fitting bhi book kar sakta hoon?"}'::jsonb,
    '{"en": "Yes. If you are visiting our workshop in person, we can supply the required parts and perform the installation during your service appointment.", "ur": "جی ہاں۔ اگر آپ ہماری ورکشاپ تشریف لا رہے ہیں تو ہم مطلوبہ پارٹس فراہم کرنے کے ساتھ آپ کی اپائنٹمنٹ کے دوران ان کی فٹنگ بھی کر سکتے ہیں۔", "ur-roman": "Jee haan. Agar aap hamari workshop aa rahe hain to hum zaroori parts faraham karne ke sath aap ki appointment mein fitting bhi kar sakte hain."}'::jsonb,
    'parts', null, 8, true
  ),
  (
    '00000000-0000-4000-8000-000000000109',
    '{"en": "How long does a typical service take?", "ur": "ایک عام سروس میں کتنا وقت لگتا ہے؟", "ur-roman": "Ek aam service mein kitna waqt lagta hai?"}'::jsonb,
    '{"en": "Service duration depends on the type of work and parts availability. Routine periodic maintenance is generally completed the same day, while major mechanical or body work takes longer. Our team shares an estimated completion time on your Job Card.", "ur": "سروس کا وقت کام کی نوعیت اور پارٹس کی دستیابی پر منحصر ہے۔ عام پیریوڈک سروس عموماً اسی دن مکمل ہو جاتی ہے، جبکہ بڑے مکینیکل یا باڈی کے کام میں زیادہ وقت لگ سکتا ہے۔ متوقع وقت آپ کے جاب کارڈ پر درج کیا جاتا ہے۔", "ur-roman": "Service ka waqt kaam ki noiyat par munhasir hai. Routine periodic service aam tor par usi din ho jati hai, jabke bare mechanical ya body kaam mein zyada waqt lagta hai. Estimated waqt Job Card par bataya jata hai."}'::jsonb,
    'booking', null, 9, true
  ),
  (
    '00000000-0000-4000-8000-000000000110',
    '{"en": "How can I contact Pak Auto Works & Parts for urgent questions?", "ur": "فوری معلومات کے لیے پاک آٹو ورکس اینڈ پارٹس سے کیسے رابطہ کریں؟", "ur-roman": "Fori maloomat ke liye Pak Auto Works & Parts se kaise rabta karein?"}'::jsonb,
    '{"en": "You can call us or message us on WhatsApp at 03126776844, or send a message using the form on our Contact page.", "ur": "آپ ہمیں 03126776844 پر کال یا واٹس ایپ میسج کر سکتے ہیں، یا ہمارے رابطہ صفحے پر موجود فارم کے ذریعے پیغام بھیج سکتے ہیں۔", "ur-roman": "Aap hamein 03126776844 par call ya WhatsApp message kar sakte hain, ya Contact page par mojood form se paigham bhej sakte hain."}'::jsonb,
    'general', null, 10, true
  )
on conflict (id) do nothing;

-- =============================================================================
-- 9. SEED DATA — 4 LEGAL PAGES (MARKDOWN DRAFTS WITH OWNER PLACEHOLDERS)
-- =============================================================================
insert into public.pages (slug, title, content, is_published)
values
  (
    'privacy',
    '{"en": "Privacy Policy", "ur": "پرائیویسی پالیسی", "ur-roman": "Privacy Policy"}'::jsonb,
    jsonb_build_object(
      'en', E'*Draft — to be reviewed by the owner before publishing.*\n\n## 1. Information We Collect\nWhen you use Pak Auto Works & Parts to submit a contact inquiry, book a workshop service, track a repair job, or place a spare parts order, we collect only the details necessary to fulfill your request:\n- **Contact details:** Name, phone number, email address (optional), and delivery address.\n- **Vehicle details:** Make, model, production year, registration plate number (optional), and service notes.\n- **Order and booking records:** Items ordered, payment verification references, and workshop job status history.\n\n## 2. How We Use Your Information\nWe use your information strictly to:\n- Confirm and manage workshop bookings and Job Cards.\n- Process and deliver spare parts orders across Pakistan.\n- Communicate updates via phone, SMS, WhatsApp, or email.\n- Prevent spam and abuse on public forms (using a non-reversible cryptographic hash of network headers).\n\n## 3. Data Sharing\nWe do not sell your personal data. We share delivery contact details only with courier partners when shipping orders outside our workshop, and with payment providers when applicable.\n\n## 4. Data Retention & Updates\n[Owner to confirm: data retention period and customer deletion request process]\n\n## 5. Contact Us\nFor any privacy questions, contact **Pak Auto Works & Parts** at **03126776844**.',
      'ur', E'*مسودہ (Draft) — شائع کرنے سے پہلے مالک کی جانب سے نظرِ ثانی درکار ہے۔*\n\n## 1. معلومات جو ہم جمع کرتے ہیں\nجب آپ پاک آٹو ورکس اینڈ پارٹس پر رابطہ فارم، سروس بکنگ، جاب ٹریکنگ یا پارٹس آرڈر استعمال کرتے ہیں تو ہم صرف ضروری معلومات لیتے ہیں جیسے نام، فون نمبر، پتہ اور گاڑی کی تفصیل۔\n\n## 2. معلومات کا استعمال\nآپ کی معلومات صرف بکنگ کی تصدیق، جاب کارڈ اپڈیٹس اور پارٹس کی ڈیلیوری کے لیے استعمال کی جاتی ہیں۔ ہم آپ کا ڈیٹا کسی کو فروخت نہیں کرتے۔\n\n[مالک کی تصدیق درکار ہے: ڈیٹا محفوظ رکھنے کی مدت]',
      'ur-roman', E'*Draft — publish karne se pehle owner ki taraf se review zaroori hai.*\n\n## 1. Maloomat Jo Hum Lete Hain\nJab aap Pak Auto Works & Parts par rabta form, service booking, job tracking ya parts order karte hain to hum sirf zaroori maloomat (naam, phone number, address aur gari ki tafseel) collect karte hain.\n\n## 2. Maloomat Ka Istemal\nYeh maloomat sirf aap ki booking, Job Card status aur parts delivery mukammal karne ke liye istemal hoti hain.\n\n[Owner to confirm: data retention period]'
    ),
    true
  ),
  (
    'terms',
    '{"en": "Terms & Conditions", "ur": "شرائط و ضوابط", "ur-roman": "Terms & Conditions"}'::jsonb,
    jsonb_build_object(
      'en', E'*Draft — to be reviewed by the owner before publishing.*\n\n## 1. General Use\nBy accessing Pak Auto Works & Parts, you agree to provide accurate contact and vehicle information when booking services, tracking jobs, or ordering spare parts.\n\n## 2. Workshop Estimates & Inspections\n- Any price ranges shown on the website are **initial estimates only**.\n- A final quote for repair or maintenance is provided only after a physical inspection of the vehicle at our workshop.\n- Additional work discovered during disassembly or testing will be communicated to the customer before proceeding.\n\n## 3. Spare Parts Orders & Compatibility\n- Customers are encouraged to verify vehicle make, model, and year compatibility before ordering.\n- Product availability and prices are validated on the server when an order is placed.\n\n## 4. Warranty & Liability\n- [Owner to confirm: workshop labor warranty terms]\n- [Owner to confirm: manufacturer warranty rules for spare parts]\n- Customers are advised to remove personal valuables from their vehicle prior to drop-off.\n\n## 5. Contact\nFor questions regarding these terms, call or WhatsApp **03126776844**.',
      'ur', E'*مسودہ (Draft) — شائع کرنے سے پہلے مالک کی جانب سے نظرِ ثانی درکار ہے۔*\n\n## 1. عمومی شرائط\nویب سائٹ پر دیے گئے نرخ صرف ابتدائی اندازے ہیں۔ حتمی بل اور کام کی تفصیل ورکشاپ میں گاڑی کے معائنے کے بعد طے کی جاتی ہے۔\n\n## 2. وارنٹی اور ذمہ داری\n- [مالک کی تصدیق درکار ہے: ورکشاپ سروس وارنٹی کی شرائط]\n- [مالک کی تصدیق درکار ہے: پارٹس کی وارنٹی پالیسی]',
      'ur-roman', E'*Draft — publish karne se pehle owner ki taraf se review zaroori hai.*\n\n## 1. Amoomi Sharaait\nWebsite par dikhaye gaye rates sirf initial estimates hain. Final estimate workshop mein gari ke physical inspection ke baad diya jata hai.\n\n## 2. Warranty\n- [Owner to confirm: workshop labor warranty terms]\n- [Owner to confirm: spare parts warranty policy]'
    ),
    true
  ),
  (
    'returns',
    '{"en": "Returns & Refund Policy", "ur": "واپسی اور ریفنڈ پالیسی", "ur-roman": "Returns & Refund Policy"}'::jsonb,
    jsonb_build_object(
      'en', E'*Draft — to be reviewed by the owner before publishing.*\n\n## 1. Eligibility for Returns\n- [Owner to confirm: return period in days from delivery]\n- Returned spare parts must be unused, unmounted, in their original packaging, and accompanied by the order reference number.\n- [Owner to confirm: non-returnable items such as opened fluids, electrical components, or special-order parts]\n\n## 2. Damaged or Incorrect Items\nIf you receive a damaged or incorrect part, please contact us on WhatsApp at **03126776844** with photos of the item and packaging as soon as possible.\n\n## 3. Return Shipping & Inspection\n- [Owner to confirm: who bears return courier charges for change-of-mind vs wrong/defective item]\n- All returned items are inspected upon arrival before a replacement or refund is processed.\n\n## 4. Refund Method & Timeline\n- [Owner to confirm: refund method (bank transfer / JazzCash / Easypaisa / store credit) and processing days]',
      'ur', E'*مسودہ (Draft) — شائع کرنے سے پہلے مالک کی جانب سے نظرِ ثانی درکار ہے۔*\n\n## 1. واپسی کی شرائط\n- [مالک کی تصدیق درکار ہے: ڈیلیوری کے بعد واپسی کی مدت]\n- واپس کیے جانے والے پارٹس غیر استعمال شدہ اور اصل پیکنگ میں ہونے چاہئیں۔\n- [مالک کی تصدیق درکار ہے: ریفنڈ کا طریقہ کار اور مدت]',
      'ur-roman', E'*Draft — publish karne se pehle owner ki taraf se review zaroori hai.*\n\n## 1. Wapsi Ki Sharaait\n- [Owner to confirm: return period in days]\n- Wapas kiye jane wale parts unused aur original packing mein hone chahiye.\n- [Owner to confirm: refund method aur timeline]'
    ),
    true
  ),
  (
    'delivery-policy',
    '{"en": "Delivery Policy", "ur": "ڈیلیوری پالیسی", "ur-roman": "Delivery Policy"}'::jsonb,
    jsonb_build_object(
      'en', E'*Draft — to be reviewed by the owner before publishing.*\n\n## 1. Delivery Coverage\nPak Auto Works & Parts delivers car spare parts and accessories across Pakistan.\n\n## 2. Delivery Charges\n- **Within Sadiqabad:** **Rs. 0 (Free Delivery)**\n- **All other cities in Pakistan:** **Flat Rs. 300**\n\n*Note: Delivery charges and free-delivery eligibility are displayed clearly as a separate line item in your cart and checkout, and may be updated by the workshop from time to time.*\n\n## 3. Dispatch & Transit Time\n- [Owner to confirm: order cut-off time and standard dispatch window]\n- [Owner to confirm: estimated transit days for Sadiqabad vs other cities in Pakistan]\n- [Owner to confirm: courier partners used for nationwide shipping]\n\n## 4. Order Tracking\nOnce your order is shipped, courier details and tracking information are updated against your order number. For delivery assistance, message us on WhatsApp at **03126776844**.',
      'ur', E'*مسودہ (Draft) — شائع کرنے سے پہلے مالک کی جانب سے نظرِ ثانی درکار ہے۔*\n\n## 1. ڈیلیوری چارجز\n- **صادق آباد کے اندر:** **0 روپے (مفت ڈیلیوری)**\n- **پاکستان کے دیگر تمام شہروں میں:** **فلیٹ 300 روپے**\n\n*نوٹ: ڈیلیوری چارجز وقت کے ساتھ تبدیل ہو سکتے ہیں اور چیک آؤٹ پر واضح طور پر دکھائے جاتے ہیں۔*\n\n- [مالک کی تصدیق درکار ہے: ڈیلیوری کا متوقع وقت اور کوریئر پارٹنرز]',
      'ur-roman', E'*Draft — publish karne se pehle owner ki taraf se review zaroori hai.*\n\n## 1. Delivery Charges\n- **Sadiqabad ke andar:** **Rs. 0 (Free Delivery)**\n- **Baqi poore Pakistan mein:** **Flat Rs. 300**\n\n*Note: Delivery charges waqt ke sath tabdeel ho sakte hain aur checkout par alag line mein dikhaye jate hain.*\n\n- [Owner to confirm: delivery transit time aur courier partners]'
    ),
    true
  )
on conflict (slug) do nothing;

-- =============================================================================
-- 10. VERIFICATION QUERIES (Commented out — run manually if desired)
-- =============================================================================
-- select count(*) as services_count from public.services;          -- Expected: 14
-- select count(*) as faqs_count from public.faqs;                  -- Expected: 10
-- select slug, is_published from public.pages order by slug;       -- Expected: 4 rows
