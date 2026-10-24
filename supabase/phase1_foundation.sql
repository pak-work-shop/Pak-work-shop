-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 1 FOUNDATION SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Creates extensions, helper functions, Phase 1 tables, triggers, RLS policies,
-- Storage bucket ('site-assets'), indexes, and initial seed data.
-- =============================================================================

-- 1. EXTENSIONS
create extension if not exists "pgcrypto";

-- =============================================================================
-- 2. HELPER FUNCTIONS
-- =============================================================================

-- Automatically update updated_at timestamp on row update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- 3. TABLES
-- =============================================================================

-- 3.1 PROFILES
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Helper: Check if the current authenticated user has role = 'admin'
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- Trigger function: Prevent non-admins from changing their role
-- Note: Allows updates from SQL Editor / service_role (where auth.uid() is null)
-- or from authenticated users who already pass public.is_admin().
create or replace function public.prevent_role_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not public.is_admin() then
      raise exception 'Privilege escalation denied: only administrators may change user roles.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_prevent_role_escalation on public.profiles;
create trigger trg_profiles_prevent_role_escalation
before update on public.profiles
for each row execute function public.prevent_role_escalation();

-- Trigger function: Automatically create a customer profile when a user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do update
  set
    full_name = case when public.profiles.full_name = '' then excluded.full_name else public.profiles.full_name end,
    phone = case when public.profiles.phone = '' then excluded.phone else public.profiles.phone end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- 3.2 SITE SETTINGS (Single-row configuration table)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'Pak Auto Works & Parts',
  tagline jsonb not null default '{"en": "One-Stop Auto Workshop & Genuine Spare Parts", "ur": "مکمل آٹو ورکشاپ اور اصلی کار پارٹس", "ur-roman": "Mukammal Auto Workshop aur Asli Car Parts"}'::jsonb,
  phone text not null default '03126776844',
  whatsapp text not null default '03126776844',
  email text not null default '',
  address jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  maps_embed_url text not null default '',
  working_hours jsonb not null default '{}'::jsonb,
  logo_url text not null default '',
  favicon_url text not null default '',
  facebook_url text not null default '',
  instagram_url text not null default '',
  youtube_url text not null default '',
  tiktok_url text not null default '',
  announcement jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  announcement_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

-- 3.3 VEHICLE MAKES
create table if not exists public.vehicle_makes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_vehicle_makes_updated_at on public.vehicle_makes;
create trigger trg_vehicle_makes_updated_at
before update on public.vehicle_makes
for each row execute function public.set_updated_at();

-- 3.4 VEHICLE MODELS
create table if not exists public.vehicle_models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.vehicle_makes(id) on delete cascade,
  name text not null,
  slug text not null,
  year_from int not null default 1990,
  year_to int null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (make_id, slug)
);

drop trigger if exists trg_vehicle_models_updated_at on public.vehicle_models;
create trigger trg_vehicle_models_updated_at
before update on public.vehicle_models
for each row execute function public.set_updated_at();

-- 3.5 CUSTOMER VEHICLES
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  make_id uuid not null references public.vehicle_makes(id) on delete restrict,
  model_id uuid not null references public.vehicle_models(id) on delete restrict,
  year int not null check (year >= 1970 and year <= 2100),
  plate_number text not null default '',
  fuel_type text not null default 'petrol' check (fuel_type in ('petrol', 'diesel', 'hybrid', 'cng', 'electric')),
  nickname text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_vehicles_updated_at on public.vehicles;
create trigger trg_vehicles_updated_at
before update on public.vehicles
for each row execute function public.set_updated_at();

-- 3.6 CUSTOMER ADDRESSES
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  full_name text not null,
  phone text not null,
  city text not null,
  address_line text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_addresses_updated_at on public.addresses;
create trigger trg_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

-- =============================================================================
-- 4. INDEXES
-- =============================================================================
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_phone on public.profiles(phone);
create index if not exists idx_vehicle_makes_slug on public.vehicle_makes(slug);
create index if not exists idx_vehicle_models_make_id on public.vehicle_models(make_id);
create index if not exists idx_vehicle_models_slug on public.vehicle_models(slug);
create index if not exists idx_vehicles_user_id on public.vehicles(user_id);
create index if not exists idx_vehicles_make_id on public.vehicles(make_id);
create index if not exists idx_vehicles_model_id on public.vehicles(model_id);
create index if not exists idx_addresses_user_id on public.addresses(user_id);

-- =============================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.vehicle_makes enable row level security;
alter table public.vehicle_models enable row level security;
alter table public.vehicles enable row level security;
alter table public.addresses enable row level security;

-- 5.1 PROFILES POLICIES
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "Users can update own profile without role change" on public.profiles;
create policy "Users can update own profile without role change"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role = (select p.role from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5.2 SITE SETTINGS POLICIES
drop policy if exists "Public can view site settings" on public.site_settings;
create policy "Public can view site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can update site settings" on public.site_settings;
create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 5.3 VEHICLE MAKES POLICIES
drop policy if exists "Public can view vehicle makes" on public.vehicle_makes;
create policy "Public can view vehicle makes"
  on public.vehicle_makes for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert vehicle makes" on public.vehicle_makes;
create policy "Admins can insert vehicle makes"
  on public.vehicle_makes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update vehicle makes" on public.vehicle_makes;
create policy "Admins can update vehicle makes"
  on public.vehicle_makes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete vehicle makes" on public.vehicle_makes;
create policy "Admins can delete vehicle makes"
  on public.vehicle_makes for delete
  to authenticated
  using (public.is_admin());

-- 5.4 VEHICLE MODELS POLICIES
drop policy if exists "Public can view vehicle models" on public.vehicle_models;
create policy "Public can view vehicle models"
  on public.vehicle_models for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert vehicle models" on public.vehicle_models;
create policy "Admins can insert vehicle models"
  on public.vehicle_models for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update vehicle models" on public.vehicle_models;
create policy "Admins can update vehicle models"
  on public.vehicle_models for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete vehicle models" on public.vehicle_models;
create policy "Admins can delete vehicle models"
  on public.vehicle_models for delete
  to authenticated
  using (public.is_admin());

-- 5.5 VEHICLES POLICIES
drop policy if exists "Users can view own vehicles and admins can view all" on public.vehicles;
create policy "Users can view own vehicles and admins can view all"
  on public.vehicles for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own vehicles" on public.vehicles;
create policy "Users can insert own vehicles"
  on public.vehicles for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own vehicles" on public.vehicles;
create policy "Users can update own vehicles"
  on public.vehicles for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own vehicles" on public.vehicles;
create policy "Users can delete own vehicles"
  on public.vehicles for delete
  to authenticated
  using (user_id = auth.uid());

-- 5.6 ADDRESSES POLICIES
drop policy if exists "Users can view own addresses and admins can view all" on public.addresses;
create policy "Users can view own addresses and admins can view all"
  on public.addresses for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own addresses" on public.addresses;
create policy "Users can insert own addresses"
  on public.addresses for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own addresses" on public.addresses;
create policy "Users can update own addresses"
  on public.addresses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own addresses" on public.addresses;
create policy "Users can delete own addresses"
  on public.addresses for delete
  to authenticated
  using (user_id = auth.uid());

-- =============================================================================
-- 6. STORAGE BUCKET ('site-assets')
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-assets',
  'site-assets',
  true,
  2097152, -- 2 MB limit
  array['image/png', 'image/jpeg', 'image/webp', 'image/x-icon']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read site-assets" on storage.objects;
create policy "Public can read site-assets"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'site-assets');

drop policy if exists "Admins can upload to site-assets" on storage.objects;
create policy "Admins can upload to site-assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "Admins can update site-assets" on storage.objects;
create policy "Admins can update site-assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin())
  with check (bucket_id = 'site-assets' and public.is_admin());

drop policy if exists "Admins can delete from site-assets" on storage.objects;
create policy "Admins can delete from site-assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'site-assets' and public.is_admin());

-- =============================================================================
-- 7. SEED DATA
-- =============================================================================

-- 7.1 Seed default site_settings row (id = 1)
-- Note: Address and working_hours are intentionally empty for the owner to fill later.
insert into public.site_settings (
  id,
  business_name,
  tagline,
  phone,
  whatsapp,
  email,
  address,
  maps_embed_url,
  working_hours,
  logo_url,
  favicon_url,
  facebook_url,
  instagram_url,
  youtube_url,
  tiktok_url,
  announcement,
  announcement_enabled
)
values (
  1,
  'Pak Auto Works & Parts',
  '{"en": "One-Stop Auto Workshop & Genuine Spare Parts", "ur": "مکمل آٹو ورکشاپ اور اصلی کار پارٹس", "ur-roman": "Mukammal Auto Workshop aur Asli Car Parts"}'::jsonb,
  '03126776844',
  '03126776844',
  '',
  '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  '',
  '{}'::jsonb,
  '',
  '',
  '',
  '',
  '',
  '',
  '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  false
)
on conflict (id) do nothing;

-- 7.2 Seed Popular Vehicle Makes in Pakistan
insert into public.vehicle_makes (name, slug, is_active)
values
  ('Suzuki', 'suzuki', true),
  ('Toyota', 'toyota', true),
  ('Honda', 'honda', true),
  ('KIA', 'kia', true),
  ('Hyundai', 'hyundai', true),
  ('Changan', 'changan', true),
  ('MG', 'mg', true),
  ('Haval', 'haval', true),
  ('Daihatsu', 'daihatsu', true),
  ('Nissan', 'nissan', true),
  ('Proton', 'proton', true),
  ('Mitsubishi', 'mitsubishi', true)
on conflict (slug) do nothing;

-- 7.3 Seed Popular Vehicle Models in Pakistan
with model_seed (make_slug, name, slug, year_from, year_to) as (
  values
    -- Suzuki
    ('suzuki', 'Alto', 'alto', 2000, null),
    ('suzuki', 'Cultus', 'cultus', 2000, null),
    ('suzuki', 'Wagon R', 'wagon-r', 2010, null),
    ('suzuki', 'Swift', 'swift', 2010, null),
    ('suzuki', 'Mehran', 'mehran', 1989, 2019),
    ('suzuki', 'Bolan', 'bolan', 1990, 2024),
    ('suzuki', 'Every', 'every', 2010, null),
    ('suzuki', 'Ravi', 'ravi', 1990, null),
    -- Toyota
    ('toyota', 'Corolla', 'corolla', 1990, null),
    ('toyota', 'Yaris', 'yaris', 2020, null),
    ('toyota', 'Vitz', 'vitz', 2005, 2020),
    ('toyota', 'Passo', 'passo', 2006, 2023),
    ('toyota', 'Aqua', 'aqua', 2012, null),
    ('toyota', 'Prius', 'prius', 2009, null),
    ('toyota', 'Hilux', 'hilux', 1995, null),
    ('toyota', 'Fortuner', 'fortuner', 2012, null),
    ('toyota', 'Land Cruiser', 'land-cruiser', 1995, null),
    ('toyota', 'Prado', 'prado', 1996, null),
    -- Honda
    ('honda', 'Civic', 'civic', 1992, null),
    ('honda', 'City', 'city', 1998, null),
    ('honda', 'BR-V', 'br-v', 2017, null),
    ('honda', 'HR-V', 'hr-v', 2022, null),
    ('honda', 'Vezel', 'vezel', 2014, null),
    ('honda', 'Fit', 'fit', 2010, 2021),
    -- KIA
    ('kia', 'Picanto', 'picanto', 2019, null),
    ('kia', 'Sportage', 'sportage', 2019, null),
    ('kia', 'Stonic', 'stonic', 2021, null),
    ('kia', 'Sorento', 'sorento', 2021, null),
    -- Hyundai
    ('hyundai', 'Elantra', 'elantra', 2021, null),
    ('hyundai', 'Tucson', 'tucson', 2020, null),
    ('hyundai', 'Sonata', 'sonata', 2021, null),
    -- Changan
    ('changan', 'Alsvin', 'alsvin', 2021, null),
    ('changan', 'Oshan X7', 'oshan-x7', 2022, null),
    ('changan', 'Karvaan', 'karvaan', 2018, null),
    -- MG
    ('mg', 'HS', 'hs', 2020, null),
    ('mg', 'ZS', 'zs', 2021, null),
    -- Haval
    ('haval', 'H6', 'h6', 2022, null),
    ('haval', 'Jolion', 'jolion', 2022, null),
    -- Daihatsu
    ('daihatsu', 'Mira', 'mira', 2007, null),
    ('daihatsu', 'Cuore', 'cuore', 2000, 2012),
    ('daihatsu', 'Move', 'move', 2008, null),
    -- Nissan
    ('nissan', 'Dayz', 'dayz', 2013, null),
    ('nissan', 'Sunny', 'sunny', 1995, 2012),
    -- Proton
    ('proton', 'Saga', 'saga', 2021, null),
    ('proton', 'X70', 'x70', 2020, null),
    -- Mitsubishi
    ('mitsubishi', 'Lancer', 'lancer', 1995, 2016),
    ('mitsubishi', 'Pajero', 'pajero', 1992, 2021)
)
insert into public.vehicle_models (make_id, name, slug, year_from, year_to, is_active)
select
  m.id,
  ms.name,
  ms.slug,
  ms.year_from,
  ms.year_to::int,
  true
from model_seed ms
join public.vehicle_makes m on m.slug = ms.make_slug
on conflict (make_id, slug) do nothing;

-- =============================================================================
-- 8. ADMIN PROMOTION SNIPPET (Run manually after creating admin user)
-- =============================================================================
-- After creating your admin user in Supabase Auth, run this (replace the UUID):
-- update public.profiles set role = 'admin' where id = 'PASTE-ADMIN-USER-UUID-HERE';
