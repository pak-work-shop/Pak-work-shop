-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 3 ONLINE BOOKING SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--
-- Time zone rule:
--   All "today", "now", minimum-advance, and slot calculations use 'Asia/Karachi'.
--
-- Working hours JSON shape in public.site_settings.working_hours (from Phase 1):
--   {
--     "monday":    { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "tuesday":   { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "wednesday": { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "thursday":  { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "friday":    { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "saturday":  { "isOpen": true,  "openTime": "09:00", "closeTime": "18:00" },
--     "sunday":    { "isOpen": false, "openTime": "10:00", "closeTime": "18:00" }
--   }
-- =============================================================================

-- Ensure demo_mode and is_demo columns exist for UI/Settings and demo filtering
alter table public.site_settings
  add column if not exists demo_mode boolean not null default false;

alter table public.contact_messages
  add column if not exists is_demo boolean not null default false;

-- =============================================================================
-- 1. BOOKING_SETTINGS TABLE (Single-row configuration, id = 1)
-- =============================================================================
create table if not exists public.booking_settings (
  id int primary key default 1 check (id = 1),
  online_booking_enabled boolean not null default true,
  slot_minutes int not null default 60 check (slot_minutes in (30, 45, 60, 90, 120)),
  max_bookings_per_slot int not null default 2 check (max_bookings_per_slot >= 1),
  min_advance_hours int not null default 2 check (min_advance_hours >= 0),
  max_advance_days int not null default 30 check (max_advance_days between 1 and 90),
  allow_pickup_drop boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_booking_settings_updated_at on public.booking_settings;
create trigger trg_booking_settings_updated_at
before update on public.booking_settings
for each row execute function public.set_updated_at();

insert into public.booking_settings (
  id,
  online_booking_enabled,
  slot_minutes,
  max_bookings_per_slot,
  min_advance_hours,
  max_advance_days,
  allow_pickup_drop
)
values (1, true, 60, 2, 2, 30, true)
on conflict (id) do nothing;

alter table public.booking_settings enable row level security;

drop policy if exists "Public can view booking settings" on public.booking_settings;
create policy "Public can view booking settings"
  on public.booking_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can update booking settings" on public.booking_settings;
create policy "Admins can update booking settings"
  on public.booking_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 2. BLOCKED_SLOTS TABLE
-- =============================================================================
create table if not exists public.blocked_slots (
  id uuid primary key default gen_random_uuid(),
  block_date date not null,
  start_time time null,
  end_time time null,
  reason text null,
  created_at timestamptz not null default now(),
  constraint chk_blocked_slots_time_range check (
    (start_time is null and end_time is null) or
    (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index if not exists idx_blocked_slots_date on public.blocked_slots(block_date);

alter table public.blocked_slots enable row level security;

drop policy if exists "Public can view blocked slots" on public.blocked_slots;
create policy "Public can view blocked slots"
  on public.blocked_slots for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert blocked slots" on public.blocked_slots;
create policy "Admins can insert blocked slots"
  on public.blocked_slots for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update blocked slots" on public.blocked_slots;
create policy "Admins can update blocked slots"
  on public.blocked_slots for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete blocked slots" on public.blocked_slots;
create policy "Admins can delete blocked slots"
  on public.blocked_slots for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 3. BOOKINGS SEQUENCE & TABLE
-- =============================================================================
create sequence if not exists public.booking_no_seq start 1;

create or replace function public.next_booking_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'BK-' || lpad(nextval('public.booking_no_seq')::text, 6, '0');
end;
$$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_no text not null unique default public.next_booking_no(),
  user_id uuid null references public.profiles(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (char_length(customer_phone) between 10 and 15),
  customer_email text null check (customer_email is null or char_length(customer_email) <= 120),
  make_id uuid null references public.vehicle_makes(id) on delete set null,
  model_id uuid null references public.vehicle_models(id) on delete set null,
  make_text text null,
  model_text text null,
  vehicle_year int null check (vehicle_year is null or vehicle_year between 1970 and 2035),
  plate_number text null check (plate_number is null or char_length(plate_number) <= 25),
  fuel_type text null check (fuel_type is null or fuel_type in ('petrol', 'diesel', 'hybrid', 'cng', 'electric')),
  mileage_km int null check (mileage_km is null or (mileage_km >= 0 and mileage_km <= 2000000)),
  booking_date date not null,
  slot_start time not null,
  slot_end time not null,
  problem_description text null check (problem_description is null or char_length(problem_description) <= 1500),
  photo_path text null,
  pickup_requested boolean not null default false,
  pickup_address text null check (pickup_address is null or char_length(pickup_address) <= 300),
  status text not null default 'pending' check (
    status in ('pending', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'rejected')
  ),
  admin_notes text null,
  source text not null default 'web' check (source in ('web', 'admin')),
  language text null default 'en',
  ip_hash text null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

create index if not exists idx_bookings_booking_no on public.bookings(booking_no);
create index if not exists idx_bookings_date_slot on public.bookings(booking_date, slot_start);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_phone on public.bookings(customer_phone);
create index if not exists idx_bookings_user_id on public.bookings(user_id);
create index if not exists idx_bookings_ip_hash_created on public.bookings(ip_hash, created_at);

alter table public.bookings enable row level security;

-- Customers can only SELECT their own bookings; all writes happen via RPCs or Admin
drop policy if exists "Customers can view own bookings" on public.bookings;
create policy "Customers can view own bookings"
  on public.bookings for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can insert bookings" on public.bookings;
create policy "Admins can insert bookings"
  on public.bookings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update bookings" on public.bookings;
create policy "Admins can update bookings"
  on public.bookings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete bookings" on public.bookings;
create policy "Admins can delete bookings"
  on public.bookings for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 4. BOOKING_SERVICES TABLE
-- =============================================================================
create table if not exists public.booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  service_id uuid null references public.services(id) on delete set null,
  service_name text not null
);

create index if not exists idx_booking_services_booking_id on public.booking_services(booking_id);

alter table public.booking_services enable row level security;

drop policy if exists "Customers can view own booking services" on public.booking_services;
create policy "Customers can view own booking services"
  on public.booking_services for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.bookings b
       where b.id = booking_services.booking_id
         and b.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert booking services" on public.booking_services;
create policy "Admins can insert booking services"
  on public.booking_services for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update booking services" on public.booking_services;
create policy "Admins can update booking services"
  on public.booking_services for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete booking services" on public.booking_services;
create policy "Admins can delete booking services"
  on public.booking_services for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 5. BOOKING_STATUS_HISTORY TABLE & LOGGING TRIGGER
-- =============================================================================
create table if not exists public.booking_status_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  from_status text null,
  to_status text not null,
  note text null,
  changed_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_status_history_booking_id
  on public.booking_status_history(booking_id, created_at);

alter table public.booking_status_history enable row level security;

drop policy if exists "Customers can view own booking status history" on public.booking_status_history;
create policy "Customers can view own booking status history"
  on public.booking_status_history for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.bookings b
       where b.id = booking_status_history.booking_id
         and b.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert booking status history" on public.booking_status_history;
create policy "Admins can insert booking status history"
  on public.booking_status_history for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can delete booking status history" on public.booking_status_history;
create policy "Admins can delete booking status history"
  on public.booking_status_history for delete
  to authenticated
  using (public.is_admin());

-- Lookup rate-limiting log table for get_booking_status (admin-only direct access)
create table if not exists public.booking_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_booking_lookup_attempts_ip_created
  on public.booking_lookup_attempts(ip_hash, created_at);

alter table public.booking_lookup_attempts enable row level security;

drop policy if exists "Admins can view lookup attempts" on public.booking_lookup_attempts;
create policy "Admins can view lookup attempts"
  on public.booking_lookup_attempts for select
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 6. PRIVATE STORAGE BUCKET: booking-uploads
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'booking-uploads',
  'booking-uploads',
  false,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = 2097152,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

drop policy if exists "Anyone can upload pending booking photos" on storage.objects;
create policy "Anyone can upload pending booking photos"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'booking-uploads'
    and name ~ '^pending/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$'
  );

drop policy if exists "Admins can view booking uploads" on storage.objects;
create policy "Admins can view booking uploads"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'booking-uploads' and public.is_admin());

drop policy if exists "Admins can delete booking uploads" on storage.objects;
create policy "Admins can delete booking uploads"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'booking-uploads' and public.is_admin());

-- =============================================================================
-- 7. INTERNAL HELPER: Request IP Hash & Weekday Key
-- =============================================================================
create or replace function public.get_request_ip_hash()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_headers json;
  v_forwarded text;
  v_raw_ip text;
begin
  begin
    v_headers := current_setting('request.headers', true)::json;
    v_forwarded := v_headers->>'x-forwarded-for';
  exception when others then
    v_forwarded := null;
  end;

  v_raw_ip := btrim(split_part(coalesce(v_forwarded, ''), ',', 1));
  if v_raw_ip <> '' then
    return encode(digest(v_raw_ip, 'sha256'), 'hex');
  end if;
  return null;
end;
$$;

create or replace function public.get_weekday_key(p_date date)
returns text
language sql
immutable
as $$
  select case extract(dow from p_date)::int
    when 0 then 'sunday'
    when 1 then 'monday'
    when 2 then 'tuesday'
    when 3 then 'wednesday'
    when 4 then 'thursday'
    when 5 then 'friday'
    when 6 then 'saturday'
  end;
$$;

-- =============================================================================
-- 8. RPC: get_available_slots(p_date date)
-- =============================================================================
create or replace function public.get_available_slots(p_date date)
returns table (
  slot_start time,
  slot_end time,
  remaining int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bs public.booking_settings%rowtype;
  v_wh jsonb;
  v_day_key text;
  v_day_cfg jsonb;
  v_is_open boolean;
  v_open_time time;
  v_close_time time;
  v_now_pkt timestamp;
  v_today_pkt date;
  v_min_allowed_ts timestamp;
  v_cur_start time;
  v_cur_end time;
  v_step interval;
  v_booked_count int;
  v_is_blocked boolean;
begin
  if p_date is null then
    return;
  end if;

  select * into v_bs from public.booking_settings where id = 1;
  if not found then
    return;
  end if;

  select working_hours into v_wh from public.site_settings where id = 1;
  if v_wh is null or v_wh = '{}'::jsonb then
    return;
  end if;

  -- Check if whole day is blocked
  if exists (
    select 1 from public.blocked_slots bs
     where bs.block_date = p_date
       and bs.start_time is null
       and bs.end_time is null
  ) then
    return;
  end if;

  v_day_key := public.get_weekday_key(p_date);
  v_day_cfg := v_wh->v_day_key;
  if v_day_cfg is null then
    return;
  end if;

  v_is_open := coalesce((v_day_cfg->>'isOpen')::boolean, false);
  if not v_is_open then
    return;
  end if;

  begin
    v_open_time := (v_day_cfg->>'openTime')::time;
    v_close_time := (v_day_cfg->>'closeTime')::time;
  exception when others then
    return;
  end;

  if v_open_time is null or v_close_time is null or v_close_time <= v_open_time then
    return;
  end if;

  v_now_pkt := now() at time zone 'Asia/Karachi';
  v_today_pkt := v_now_pkt::date;
  v_min_allowed_ts := v_now_pkt + make_interval(hours => v_bs.min_advance_hours);
  v_step := make_interval(mins => v_bs.slot_minutes);

  v_cur_start := v_open_time;
  while (v_cur_start + v_step) <= v_close_time loop
    v_cur_end := v_cur_start + v_step;

    -- Exclude slots in the past or before now + min_advance_hours
    if (p_date + v_cur_start) >= v_min_allowed_ts then
      -- Exclude slots overlapping any partial blocked range on that date
      select exists (
        select 1 from public.blocked_slots bs
         where bs.block_date = p_date
           and bs.start_time is not null
           and bs.end_time is not null
           and bs.start_time < v_cur_end
           and bs.end_time > v_cur_start
      ) into v_is_blocked;

      if not v_is_blocked then
        select count(*)::int
          into v_booked_count
          from public.bookings b
         where b.booking_date = p_date
           and b.slot_start = v_cur_start
           and b.status not in ('cancelled', 'rejected');

        slot_start := v_cur_start;
        slot_end := v_cur_end;
        remaining := greatest(0, v_bs.max_bookings_per_slot - v_booked_count);
        return next;
      end if;
    end if;

    -- Guard against midnight wrap-around
    if (v_cur_start + v_step) <= v_cur_start then
      exit;
    end if;
    v_cur_start := v_cur_start + v_step;
  end loop;
end;
$$;

grant execute on function public.get_available_slots(date) to anon, authenticated;

-- =============================================================================
-- 9. RPC: get_month_availability(p_year int, p_month int)
-- =============================================================================
create or replace function public.get_month_availability(p_year int, p_month int)
returns table (
  day date,
  status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bs public.booking_settings%rowtype;
  v_wh jsonb;
  v_start_date date;
  v_end_date date;
  v_cur_date date;
  v_now_pkt timestamp;
  v_today_pkt date;
  v_max_date date;
  v_day_key text;
  v_day_cfg jsonb;
  v_is_open boolean;
  v_total_slots int;
  v_open_slots int;
begin
  if p_year is null or p_month is null or p_month < 1 or p_month > 12 then
    return;
  end if;

  select * into v_bs from public.booking_settings where id = 1;
  select working_hours into v_wh from public.site_settings where id = 1;

  v_start_date := make_date(p_year, p_month, 1);
  v_end_date := (v_start_date + interval '1 month - 1 day')::date;

  v_now_pkt := now() at time zone 'Asia/Karachi';
  v_today_pkt := v_now_pkt::date;
  v_max_date := v_today_pkt + coalesce(v_bs.max_advance_days, 30);

  v_cur_date := v_start_date;
  while v_cur_date <= v_end_date loop
    day := v_cur_date;

    if v_cur_date < v_today_pkt or v_cur_date > v_max_date then
      status := 'past';
    elsif exists (
      select 1 from public.blocked_slots bs
       where bs.block_date = v_cur_date
         and bs.start_time is null
         and bs.end_time is null
    ) then
      status := 'blocked';
    else
      v_day_key := public.get_weekday_key(v_cur_date);
      v_day_cfg := case when v_wh is not null then v_wh->v_day_key else null end;
      v_is_open := coalesce((v_day_cfg->>'isOpen')::boolean, false);

      if not v_is_open then
        status := 'closed';
      else
        select count(*)::int,
               count(*) filter (where s.remaining > 0)::int
          into v_total_slots, v_open_slots
          from public.get_available_slots(v_cur_date) s;

        if v_total_slots = 0 then
          if v_cur_date = v_today_pkt then
            status := 'past';
          else
            status := 'blocked';
          end if;
        elsif v_open_slots = 0 then
          status := 'full';
        else
          status := 'open';
        end if;
      end if;
    end if;

    return next;
    v_cur_date := v_cur_date + 1;
  end loop;
end;
$$;

grant execute on function public.get_month_availability(int, int) to anon, authenticated;

-- =============================================================================
-- 10. RPC: submit_booking(...)
-- =============================================================================
create or replace function public.submit_booking(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_service_ids uuid[] default '{}',
  p_make_id uuid default null,
  p_model_id uuid default null,
  p_make_text text default null,
  p_model_text text default null,
  p_vehicle_year int default null,
  p_plate_number text default null,
  p_fuel_type text default null,
  p_mileage_km int default null,
  p_booking_date date default null,
  p_slot_start time default null,
  p_problem_description text default null,
  p_photo_path text default null,
  p_pickup_requested boolean default false,
  p_pickup_address text default null,
  p_language text default 'en'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_bs public.booking_settings%rowtype;
  v_name text;
  v_phone text;
  v_email text;
  v_make_text text;
  v_model_text text;
  v_plate text;
  v_fuel text;
  v_problem text;
  v_photo text;
  v_pickup_req boolean;
  v_pickup_addr text;
  v_lang text;
  v_ip_hash text;
  v_ip_count int;
  v_phone_count int;
  v_now_pkt timestamp;
  v_today_pkt date;
  v_max_date date;
  v_slot_end time;
  v_remaining int;
  v_service_count int;
  v_booking_id uuid;
  v_booking_no text;
  v_srv record;
  v_service_names text[] := array[]::text[];
begin
  select * into v_bs from public.booking_settings where id = 1;
  if not found or not v_bs.online_booking_enabled then
    raise exception 'online_booking_disabled';
  end if;

  v_name := btrim(coalesce(p_customer_name, ''));
  v_phone := regexp_replace(btrim(coalesce(p_customer_phone, '')), '[\s\-]+', '', 'g');
  v_email := nullif(btrim(coalesce(p_customer_email, '')), '');
  v_make_text := nullif(btrim(coalesce(p_make_text, '')), '');
  v_model_text := nullif(btrim(coalesce(p_model_text, '')), '');
  v_plate := nullif(upper(btrim(coalesce(p_plate_number, ''))), '');
  v_fuel := nullif(lower(btrim(coalesce(p_fuel_type, ''))), '');
  v_problem := nullif(btrim(coalesce(p_problem_description, '')), '');
  v_photo := nullif(btrim(coalesce(p_photo_path, '')), '');
  v_pickup_req := coalesce(p_pickup_requested, false);
  v_pickup_addr := nullif(btrim(coalesce(p_pickup_address, '')), '');
  v_lang := coalesce(nullif(btrim(p_language), ''), 'en');
  if v_lang not in ('en', 'ur', 'ur-roman') then
    v_lang := 'en';
  end if;

  -- Validate customer fields
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
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

  -- Validate vehicle fields
  if p_make_id is null and v_make_text is null then
    raise exception 'invalid_input';
  end if;

  if p_model_id is null and v_model_text is null then
    raise exception 'invalid_input';
  end if;

  if p_vehicle_year is null or p_vehicle_year < 1970 or p_vehicle_year > (extract(year from now())::int + 1) then
    raise exception 'invalid_input';
  end if;

  if v_fuel is not null and v_fuel not in ('petrol', 'diesel', 'hybrid', 'cng', 'electric') then
    raise exception 'invalid_input';
  end if;

  if p_mileage_km is not null and (p_mileage_km < 0 or p_mileage_km > 2000000) then
    raise exception 'invalid_input';
  end if;

  if v_problem is not null and char_length(v_problem) > 1500 then
    raise exception 'invalid_input';
  end if;

  if v_photo is not null and v_photo !~ '^pending/[a-zA-Z0-9_-]+\.(png|jpg|jpeg|webp)$' then
    raise exception 'invalid_input';
  end if;

  if v_pickup_req then
    if not v_bs.allow_pickup_drop then
      raise exception 'invalid_input';
    end if;
    if v_pickup_addr is null or char_length(v_pickup_addr) < 5 or char_length(v_pickup_addr) > 300 then
      raise exception 'invalid_input';
    end if;
  else
    v_pickup_addr := null;
  end if;

  -- Validate 1..5 active services
  if p_service_ids is null or array_length(p_service_ids, 1) is null then
    raise exception 'invalid_input';
  end if;

  if array_length(p_service_ids, 1) < 1 or array_length(p_service_ids, 1) > 5 then
    raise exception 'invalid_input';
  end if;

  select count(*)::int
    into v_service_count
    from public.services s
   where s.id = any(p_service_ids)
     and s.is_active = true;

  if v_service_count <> array_length(p_service_ids, 1) then
    raise exception 'invalid_input';
  end if;

  -- Validate date window in Asia/Karachi
  if p_booking_date is null or p_slot_start is null then
    raise exception 'invalid_input';
  end if;

  v_now_pkt := now() at time zone 'Asia/Karachi';
  v_today_pkt := v_now_pkt::date;
  v_max_date := v_today_pkt + v_bs.max_advance_days;

  if p_booking_date < v_today_pkt or p_booking_date > v_max_date then
    raise exception 'slot_unavailable';
  end if;

  -- Rate limiting by IP hash (max 5 per hour) and phone (max 5 per day)
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_ip_count
      from public.bookings b
     where b.ip_hash = v_ip_hash
       and b.created_at >= now() - interval '1 hour';

    if v_ip_count >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  select count(*)::int
    into v_phone_count
    from public.bookings b
   where b.customer_phone = v_phone
     and b.created_at >= now() - interval '24 hours';

  if v_phone_count >= 5 then
    raise exception 'rate_limited';
  end if;

  -- Acquire transaction-scoped advisory lock on (booking_date, slot_start) to prevent capacity race
  perform pg_advisory_xact_lock(
    hashtext('pak_auto_booking_' || p_booking_date::text || '_' || p_slot_start::text)
  );

  select s.slot_end, s.remaining
    into v_slot_end, v_remaining
    from public.get_available_slots(p_booking_date) s
   where s.slot_start = p_slot_start
   limit 1;

  if v_slot_end is null or coalesce(v_remaining, 0) <= 0 then
    raise exception 'slot_unavailable';
  end if;

  -- Resolve make_text / model_text snapshots if IDs were passed
  if p_make_id is not null and v_make_text is null then
    select m.name into v_make_text from public.vehicle_makes m where m.id = p_make_id;
  end if;
  if p_model_id is not null and v_model_text is null then
    select mo.name into v_model_text from public.vehicle_models mo where mo.id = p_model_id;
  end if;

  insert into public.bookings (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    make_id,
    model_id,
    make_text,
    model_text,
    vehicle_year,
    plate_number,
    fuel_type,
    mileage_km,
    booking_date,
    slot_start,
    slot_end,
    problem_description,
    photo_path,
    pickup_requested,
    pickup_address,
    status,
    source,
    language,
    ip_hash,
    is_demo
  )
  values (
    auth.uid(),
    v_name,
    v_phone,
    v_email,
    p_make_id,
    p_model_id,
    v_make_text,
    v_model_text,
    p_vehicle_year,
    v_plate,
    v_fuel,
    p_mileage_km,
    p_booking_date,
    p_slot_start,
    v_slot_end,
    v_problem,
    v_photo,
    v_pickup_req,
    v_pickup_addr,
    'pending',
    'web',
    v_lang,
    v_ip_hash,
    false
  )
  returning id, booking_no into v_booking_id, v_booking_no;

  -- Insert booking_services with English name snapshot
  for v_srv in
    select s.id, coalesce(nullif(btrim(s.name->>'en'), ''), s.slug) as en_name
      from public.services s
     where s.id = any(p_service_ids)
     order by s.sort_order asc
  loop
    insert into public.booking_services (booking_id, service_id, service_name)
    values (v_booking_id, v_srv.id, v_srv.en_name);
    v_service_names := array_append(v_service_names, v_srv.en_name);
  end loop;

  -- Log initial status in booking_status_history
  insert into public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_booking_id,
    null,
    'pending',
    'Online booking submitted',
    auth.uid()
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'booking_no', v_booking_no,
    'booking_date', p_booking_date,
    'slot_start', to_char(p_slot_start, 'HH24:MI'),
    'slot_end', to_char(v_slot_end, 'HH24:MI'),
    'status', 'pending',
    'services', to_jsonb(v_service_names),
    'vehicle_summary', btrim(coalesce(v_make_text, '') || ' ' || coalesce(v_model_text, '') || ' (' || p_vehicle_year::text || ')')
  );
end;
$$;

grant execute on function public.submit_booking(
  text, text, text, uuid[], uuid, uuid, text, text, int, text, text, int, date, time, text, text, boolean, text, text
) to anon, authenticated;

-- =============================================================================
-- 11. RPC: get_booking_status(p_booking_no text, p_phone text)
-- =============================================================================
create or replace function public.get_booking_status(
  p_booking_no text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_booking_no text;
  v_phone text;
  v_ip_hash text;
  v_attempts int;
  v_booking public.bookings%rowtype;
  v_services jsonb;
  v_history jsonb;
begin
  v_booking_no := upper(btrim(coalesce(p_booking_no, '')));
  v_phone := regexp_replace(btrim(coalesce(p_phone, '')), '[\s\-]+', '', 'g');

  if v_booking_no = '' or v_phone = '' then
    raise exception 'not_found';
  end if;

  -- Rate limit: max 10 lookup attempts per hour per IP hash
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_attempts
      from public.booking_lookup_attempts a
     where a.ip_hash = v_ip_hash
       and a.created_at >= now() - interval '1 hour';

    if v_attempts >= 10 then
      raise exception 'rate_limited';
    end if;

    insert into public.booking_lookup_attempts (ip_hash) values (v_ip_hash);
  end if;

  -- Compare last 10 digits so 03XXXXXXXXX and +923XXXXXXXXX match seamlessly
  select *
    into v_booking
    from public.bookings b
   where upper(b.booking_no) = v_booking_no
     and right(regexp_replace(b.customer_phone, '[\s\-]+', '', 'g'), 10) = right(v_phone, 10)
   limit 1;

  if not found then
    raise exception 'not_found';
  end if;

  select coalesce(jsonb_agg(bs.service_name), '[]'::jsonb)
    into v_services
    from public.booking_services bs
   where bs.booking_id = v_booking.id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'from_status', h.from_status,
        'to_status', h.to_status,
        'note', h.note,
        'created_at', h.created_at
      )
      order by h.created_at asc
    ),
    '[]'::jsonb
  )
    into v_history
    from public.booking_status_history h
   where h.booking_id = v_booking.id;

  return jsonb_build_object(
    'booking_no', v_booking.booking_no,
    'status', v_booking.status,
    'booking_date', v_booking.booking_date,
    'slot_start', to_char(v_booking.slot_start, 'HH24:MI'),
    'slot_end', to_char(v_booking.slot_end, 'HH24:MI'),
    'services', v_services,
    'vehicle_summary', btrim(
      coalesce(v_booking.make_text, '') || ' ' ||
      coalesce(v_booking.model_text, '') ||
      case when v_booking.vehicle_year is not null then ' (' || v_booking.vehicle_year::text || ')' else '' end
    ),
    'pickup_requested', v_booking.pickup_requested,
    'history', v_history
  );
end;
$$;

grant execute on function public.get_booking_status(text, text) to anon, authenticated;

-- =============================================================================
-- 12. RPC: cancel_my_booking(p_booking_id uuid)
-- =============================================================================
create or replace function public.cancel_my_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_now_pkt timestamp;
  v_slot_ts timestamp;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select * into v_booking
    from public.bookings b
   where b.id = p_booking_id
     and b.user_id = auth.uid();

  if not found then
    raise exception 'not_found';
  end if;

  if v_booking.status not in ('pending', 'confirmed') then
    raise exception 'cancel_not_allowed';
  end if;

  v_now_pkt := now() at time zone 'Asia/Karachi';
  v_slot_ts := v_booking.booking_date + v_booking.slot_start;

  if v_slot_ts < (v_now_pkt + interval '3 hours') then
    raise exception 'cancel_too_late';
  end if;

  update public.bookings
     set status = 'cancelled'
   where id = v_booking.id;

  insert into public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_booking.id,
    v_booking.status,
    'cancelled',
    'Cancelled by customer',
    auth.uid()
  );

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.cancel_my_booking(uuid) to authenticated;

-- =============================================================================
-- 13. ADMIN RPCs: admin_create_booking, admin_update_booking_status, admin_reschedule_booking
-- =============================================================================
create or replace function public.admin_create_booking(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_service_ids uuid[] default '{}',
  p_make_id uuid default null,
  p_model_id uuid default null,
  p_make_text text default null,
  p_model_text text default null,
  p_vehicle_year int default null,
  p_plate_number text default null,
  p_fuel_type text default null,
  p_mileage_km int default null,
  p_booking_date date default null,
  p_slot_start time default null,
  p_problem_description text default null,
  p_pickup_requested boolean default false,
  p_pickup_address text default null,
  p_admin_notes text default null,
  p_status text default 'confirmed',
  p_override_capacity boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bs public.booking_settings%rowtype;
  v_name text;
  v_phone text;
  v_email text;
  v_make_text text;
  v_model_text text;
  v_slot_end time;
  v_booked_count int;
  v_booking_id uuid;
  v_booking_no text;
  v_srv record;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_bs from public.booking_settings where id = 1;
  v_name := btrim(coalesce(p_customer_name, ''));
  v_phone := regexp_replace(btrim(coalesce(p_customer_phone, '')), '[\s\-]+', '', 'g');
  v_email := nullif(btrim(coalesce(p_customer_email, '')), '');
  v_make_text := nullif(btrim(coalesce(p_make_text, '')), '');
  v_model_text := nullif(btrim(coalesce(p_model_text, '')), '');

  if char_length(v_name) < 2 or v_phone !~ '^(\+92|0)3[0-9]{9}$' then
    raise exception 'invalid_input';
  end if;

  if p_booking_date is null or p_slot_start is null or array_length(p_service_ids, 1) is null then
    raise exception 'invalid_input';
  end if;

  if p_status not in ('pending', 'confirmed', 'in_progress') then
    raise exception 'invalid_input';
  end if;

  v_slot_end := p_slot_start + make_interval(mins => coalesce(v_bs.slot_minutes, 60));

  perform pg_advisory_xact_lock(
    hashtext('pak_auto_booking_' || p_booking_date::text || '_' || p_slot_start::text)
  );

  if not coalesce(p_override_capacity, false) then
    select count(*)::int
      into v_booked_count
      from public.bookings b
     where b.booking_date = p_booking_date
       and b.slot_start = p_slot_start
       and b.status not in ('cancelled', 'rejected');

    if v_booked_count >= coalesce(v_bs.max_bookings_per_slot, 2) then
      raise exception 'slot_unavailable';
    end if;
  end if;

  if p_make_id is not null and v_make_text is null then
    select m.name into v_make_text from public.vehicle_makes m where m.id = p_make_id;
  end if;
  if p_model_id is not null and v_model_text is null then
    select mo.name into v_model_text from public.vehicle_models mo where mo.id = p_model_id;
  end if;

  insert into public.bookings (
    customer_name,
    customer_phone,
    customer_email,
    make_id,
    model_id,
    make_text,
    model_text,
    vehicle_year,
    plate_number,
    fuel_type,
    mileage_km,
    booking_date,
    slot_start,
    slot_end,
    problem_description,
    pickup_requested,
    pickup_address,
    status,
    admin_notes,
    source,
    language,
    is_demo
  )
  values (
    v_name,
    v_phone,
    v_email,
    p_make_id,
    p_model_id,
    v_make_text,
    v_model_text,
    p_vehicle_year,
    nullif(upper(btrim(coalesce(p_plate_number, ''))), ''),
    nullif(lower(btrim(coalesce(p_fuel_type, ''))), ''),
    p_mileage_km,
    p_booking_date,
    p_slot_start,
    v_slot_end,
    nullif(btrim(coalesce(p_problem_description, '')), ''),
    coalesce(p_pickup_requested, false),
    nullif(btrim(coalesce(p_pickup_address, '')), ''),
    p_status,
    nullif(btrim(coalesce(p_admin_notes, '')), ''),
    'admin',
    'en',
    false
  )
  returning id, booking_no into v_booking_id, v_booking_no;

  for v_srv in
    select s.id, coalesce(nullif(btrim(s.name->>'en'), ''), s.slug) as en_name
      from public.services s
     where s.id = any(p_service_ids)
  loop
    insert into public.booking_services (booking_id, service_id, service_name)
    values (v_booking_id, v_srv.id, v_srv.en_name);
  end loop;

  insert into public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_booking_id,
    null,
    p_status,
    'Created by admin',
    auth.uid()
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'booking_no', v_booking_no
  );
end;
$$;

grant execute on function public.admin_create_booking(
  text, text, text, uuid[], uuid, uuid, text, text, int, text, text, int, date, time, text, boolean, text, text, text, boolean
) to authenticated;

create or replace function public.admin_update_booking_status(
  p_booking_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if p_status not in ('pending', 'confirmed', 'rescheduled', 'in_progress', 'completed', 'cancelled', 'rejected') then
    raise exception 'invalid_input';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'not_found';
  end if;

  -- Terminal states (completed, cancelled, rejected) cannot transition back to pending
  if v_booking.status in ('completed', 'cancelled', 'rejected') and p_status = 'pending' then
    raise exception 'invalid_transition';
  end if;

  if v_booking.status = 'completed' and p_status <> 'completed' then
    raise exception 'invalid_transition';
  end if;

  update public.bookings
     set status = p_status
   where id = p_booking_id;

  insert into public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    p_booking_id,
    v_booking.status,
    p_status,
    nullif(btrim(coalesce(p_note, '')), ''),
    auth.uid()
  );

  return jsonb_build_object('ok', true, 'status', p_status);
end;
$$;

grant execute on function public.admin_update_booking_status(uuid, text, text) to authenticated;

-- Rule: Rescheduling sets status = 'rescheduled' and enforces slot capacity
create or replace function public.admin_reschedule_booking(
  p_booking_id uuid,
  p_date date,
  p_slot_start time,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_bs public.booking_settings%rowtype;
  v_slot_end time;
  v_booked_count int;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id;
  if not found then
    raise exception 'not_found';
  end if;

  if v_booking.status in ('completed', 'cancelled', 'rejected') then
    raise exception 'invalid_transition';
  end if;

  select * into v_bs from public.booking_settings where id = 1;
  v_slot_end := p_slot_start + make_interval(mins => coalesce(v_bs.slot_minutes, 60));

  perform pg_advisory_xact_lock(
    hashtext('pak_auto_booking_' || p_date::text || '_' || p_slot_start::text)
  );

  select count(*)::int
    into v_booked_count
    from public.bookings b
   where b.booking_date = p_date
     and b.slot_start = p_slot_start
     and b.id <> p_booking_id
     and b.status not in ('cancelled', 'rejected');

  if v_booked_count >= coalesce(v_bs.max_bookings_per_slot, 2) then
    raise exception 'slot_unavailable';
  end if;

  update public.bookings
     set booking_date = p_date,
         slot_start = p_slot_start,
         slot_end = v_slot_end,
         status = 'rescheduled'
   where id = p_booking_id;

  insert into public.booking_status_history (
    booking_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    p_booking_id,
    v_booking.status,
    'rescheduled',
    coalesce(
      nullif(btrim(coalesce(p_note, '')), ''),
      'Rescheduled to ' || p_date::text || ' ' || to_char(p_slot_start, 'HH24:MI')
    ),
    auth.uid()
  );

  return jsonb_build_object(
    'ok', true,
    'booking_date', p_date,
    'slot_start', to_char(p_slot_start, 'HH24:MI'),
    'slot_end', to_char(v_slot_end, 'HH24:MI'),
    'status', 'rescheduled'
  );
end;
$$;

grant execute on function public.admin_reschedule_booking(uuid, date, time, text) to authenticated;

-- =============================================================================
-- 14. VERIFICATION QUERIES (Commented out — run manually if desired)
-- =============================================================================
-- select * from public.booking_settings;
-- select * from public.get_month_availability(extract(year from now())::int, extract(month from now())::int);
-- select * from public.get_available_slots((now() at time zone 'Asia/Karachi')::date + 1);

