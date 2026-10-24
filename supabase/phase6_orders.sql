-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 6: CART, CHECKOUT (COD), DELIVERY & ORDERS SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--   4. supabase/phase4_jobs.sql
--   5. supabase/phase5_catalogue.sql
--
-- What this script creates:
--   - Optional sale_price column on public.products (uses sale_price when set, else price)
--   - Extend stock_movements reason check constraint to include 'order_cancel'
--   - Tables:
--       1. public.pakistan_cities (~120 cities & major towns across Pakistan, Sadiqabad first)
--       2. public.delivery_settings (single row id = 1: Free in Sadiqabad, Rs. 300 elsewhere)
--       3. public.coupons (no public select; validated via RPC)
--       4. public.orders (sequence ORD-000001)
--       5. public.order_items
--       6. public.order_status_history
--       7. public.user_carts (logged-in cart sync)
--       8. public.order_lookup_attempts (rate-limit log)
--   - RLS Matrix:
--       * pakistan_cities: Public SELECT; Admin full CRUD
--       * delivery_settings: Public SELECT; Admin UPDATE/INSERT
--       * coupons: Anon/Customer NO direct access; Admin full CRUD
--       * orders: Anon none; Customer SELECT own orders; Admin full CRUD
--       * order_items: Anon none; Customer SELECT own order items; Admin full CRUD
--       * order_status_history: Anon none; Customer SELECT own order history; Admin full CRUD
--       * user_carts: Anon none; Customer full CRUD on own cart (user_id = auth.uid()); Admin SELECT
--       * order_lookup_attempts: Admin SELECT only
--   - SECURITY DEFINER RPCs:
--       1. public.quote_order(p_items, p_city, p_coupon)
--       2. public.place_order(p_items, p_customer, p_city, p_address_line, p_address_notes, p_payment_method, p_coupon, p_language)
--       3. public.lookup_order_status(p_order_no, p_phone)
--       4. public.cancel_my_order(p_order_id)
--       5. public.admin_update_order_status(p_order_id, p_status, p_note)
--       6. public.admin_set_shipping(p_order_id, p_courier, p_tracking_no, p_tracking_url)
--       7. public.admin_update_payment_status(p_order_id, p_payment_status, p_note)
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. ENSURE PRODUCT SALE_PRICE & STOCK_MOVEMENTS REASON SUPPORT
-- -----------------------------------------------------------------------------
alter table public.products
  add column if not exists sale_price numeric(12,2) null
  check (sale_price is null or sale_price >= 0);

-- Update stock_movements reason constraint to allow 'order_cancel' in addition to Phase 5 reasons
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'stock_movements_reason_check'
      and conrelid = 'public.stock_movements'::regclass
  ) then
    alter table public.stock_movements drop constraint stock_movements_reason_check;
  end if;
exception when others then
  null;
end;
$$;

alter table public.stock_movements
  add constraint stock_movements_reason_check
  check (reason in ('initial', 'restock', 'sale', 'order_cancel', 'job_use', 'return', 'adjustment', 'damage'));

-- Ensure helper functions exist (in case Phase 4 wasn't run yet)
create or replace function public.normalize_phone_last10(p_phone text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
$$;

-- =============================================================================
-- 1. TABLE: pakistan_cities
-- =============================================================================
create table if not exists public.pakistan_cities (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(btrim(name)) between 2 and 80),
  province text not null check (char_length(btrim(province)) between 2 and 60),
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_pakistan_cities_active_sort
  on public.pakistan_cities(is_active, sort_order asc, name asc);

-- Seed ~120 cities and major towns across Pakistan (including Sadiqabad first)
insert into public.pakistan_cities (name, province, sort_order, is_active)
values
  -- Priority Local & Regional Hub Cities
  ('Sadiqabad', 'Punjab', 1, true),
  ('Rahim Yar Khan', 'Punjab', 2, true),
  ('Khanpur', 'Punjab', 3, true),
  ('Liaquatpur', 'Punjab', 4, true),
  ('Zahpir', 'Punjab', 5, true),
  ('Sanjarpur', 'Punjab', 6, true),
  ('Ahmadpur Lamma', 'Punjab', 7, true),
  ('Bhong', 'Punjab', 8, true),
  ('jamal Din Wali', 'Punjab', 9, true),
  ('Kot Sabzal', 'Punjab', 10, true),
  -- Major Metropolitan Cities
  ('Lahore', 'Punjab', 11, true),
  ('Karachi', 'Sindh', 12, true),
  ('Islamabad', 'Islamabad Capital Territory', 13, true),
  ('Rawalpindi', 'Punjab', 14, true),
  ('Faisalabad', 'Punjab', 15, true),
  ('Multan', 'Punjab', 16, true),
  ('Bahawalpur', 'Punjab', 17, true),
  ('Gujranwala', 'Punjab', 18, true),
  ('Peshawar', 'Khyber Pakhtunkhwa', 19, true),
  ('Quetta', 'Balochistan', 20, true),
  ('Sialkot', 'Punjab', 21, true),
  ('Hyderabad', 'Sindh', 22, true),
  ('Sukkur', 'Sindh', 23, true),
  ('Sargodha', 'Punjab', 24, true),
  -- Punjab Cities & Towns
  ('Ahmedpur East', 'Punjab', 30, true),
  ('Arifwala', 'Punjab', 31, true),
  ('Attock', 'Punjab', 32, true),
  ('Bahawalnagar', 'Punjab', 33, true),
  ('Bhalwal', 'Punjab', 34, true),
  ('Bhakkar', 'Punjab', 35, true),
  ('Burewala', 'Punjab', 36, true),
  ('Chakwal', 'Punjab', 37, true),
  ('Chiniot', 'Punjab', 38, true),
  ('Chishtian', 'Punjab', 39, true),
  ('Daska', 'Punjab', 40, true),
  ('Depalpur', 'Punjab', 41, true),
  ('Dera Ghazi Khan', 'Punjab', 42, true),
  ('Fort Abbas', 'Punjab', 43, true),
  ('Gojra', 'Punjab', 44, true),
  ('Gujrat', 'Punjab', 45, true),
  ('Hafizabad', 'Punjab', 46, true),
  ('Haroonabad', 'Punjab', 47, true),
  ('Hasilpur', 'Punjab', 48, true),
  ('Hassan Abdal', 'Punjab', 49, true),
  ('Jampur', 'Punjab', 50, true),
  ('Jaranwala', 'Punjab', 51, true),
  ('Jauharabad', 'Punjab', 52, true),
  ('Jhang', 'Punjab', 53, true),
  ('Jhelum', 'Punjab', 54, true),
  ('Kabirwala', 'Punjab', 55, true),
  ('Kamalia', 'Punjab', 56, true),
  ('Kamoke', 'Punjab', 57, true),
  ('Kasur', 'Punjab', 58, true),
  ('Khanewal', 'Punjab', 59, true),
  ('Kharian', 'Punjab', 60, true),
  ('Khushab', 'Punjab', 61, true),
  ('Kot Addu', 'Punjab', 62, true),
  ('Lalamusa', 'Punjab', 63, true),
  ('Layyah', 'Punjab', 64, true),
  ('Lodhran', 'Punjab', 65, true),
  ('Mailsi', 'Punjab', 66, true),
  ('Mandi Bahauddin', 'Punjab', 67, true),
  ('Mian Channu', 'Punjab', 68, true),
  ('Mianwali', 'Punjab', 69, true),
  ('Muridke', 'Punjab', 70, true),
  ('Murree', 'Punjab', 71, true),
  ('Muzaffargarh', 'Punjab', 72, true),
  ('Nankana Sahib', 'Punjab', 73, true),
  ('Narowal', 'Punjab', 74, true),
  ('Okara', 'Punjab', 75, true),
  ('Pakpattan', 'Punjab', 76, true),
  ('Pattoki', 'Punjab', 77, true),
  ('Phalia', 'Punjab', 78, true),
  ('Rajanpur', 'Punjab', 79, true),
  ('Rojhan', 'Punjab', 80, true),
  ('Sahiwal', 'Punjab', 81, true),
  ('Samundri', 'Punjab', 82, true),
  ('Sarai Alamgir', 'Punjab', 83, true),
  ('Shakargarh', 'Punjab', 84, true),
  ('Sheikhupura', 'Punjab', 85, true),
  ('Shujabad', 'Punjab', 86, true),
  ('Talagang', 'Punjab', 87, true),
  ('Taunsa Sharif', 'Punjab', 88, true),
  ('Taxila', 'Punjab', 89, true),
  ('Toba Tek Singh', 'Punjab', 90, true),
  ('Vehari', 'Punjab', 91, true),
  ('Wah Cantt', 'Punjab', 92, true),
  ('Wazirabad', 'Punjab', 93, true),
  ('Yazman', 'Punjab', 94, true),
  -- Sindh Cities & Towns
  ('Daharki', 'Sindh', 95, true),
  ('Ghotki', 'Sindh', 96, true),
  ('Mirpur Mathelo', 'Sindh', 97, true),
  ('Ubauro', 'Sindh', 98, true),
  ('Kandhkot', 'Sindh', 99, true),
  ('Kashmore', 'Sindh', 100, true),
  ('Jacobabad', 'Sindh', 101, true),
  ('Shikarpur', 'Sindh', 102, true),
  ('Rohri', 'Sindh', 103, true),
  ('Khairpur', 'Sindh', 104, true),
  ('Larkana', 'Sindh', 105, true),
  ('Nawabshah', 'Sindh', 106, true),
  ('Moro', 'Sindh', 107, true),
  ('Sanghar', 'Sindh', 108, true),
  ('Tando Adam', 'Sindh', 109, true),
  ('Mirpurkhas', 'Sindh', 110, true),
  ('Tando Allahyar', 'Sindh', 111, true),
  ('Badin', 'Sindh', 112, true),
  ('Thatta', 'Sindh', 113, true),
  ('Kotri', 'Sindh', 114, true),
  ('Jamshoro', 'Sindh', 115, true),
  ('Dadu', 'Sindh', 116, true),
  -- Khyber Pakhtunkhwa Cities & Towns
  ('Abbottabad', 'Khyber Pakhtunkhwa', 120, true),
  ('Bannu', 'Khyber Pakhtunkhwa', 121, true),
  ('Charsadda', 'Khyber Pakhtunkhwa', 122, true),
  ('Chitral', 'Khyber Pakhtunkhwa', 123, true),
  ('Dera Ismail Khan', 'Khyber Pakhtunkhwa', 124, true),
  ('Haripur', 'Khyber Pakhtunkhwa', 125, true),
  ('Kohat', 'Khyber Pakhtunkhwa', 126, true),
  ('Mansehra', 'Khyber Pakhtunkhwa', 127, true),
  ('Mardan', 'Khyber Pakhtunkhwa', 128, true),
  ('Mingora (Swat)', 'Khyber Pakhtunkhwa', 129, true),
  ('Nowshera', 'Khyber Pakhtunkhwa', 130, true),
  ('Swabi', 'Khyber Pakhtunkhwa', 131, true),
  ('Timergara', 'Khyber Pakhtunkhwa', 132, true),
  -- Balochistan, AJK & Gilgit-Baltistan
  ('Chaman', 'Balochistan', 140, true),
  ('Dera Murad Jamali', 'Balochistan', 141, true),
  ('Gwadar', 'Balochistan', 142, true),
  ('Hub', 'Balochistan', 143, true),
  ('Khuzdar', 'Balochistan', 144, true),
  ('Sibi', 'Balochistan', 145, true),
  ('Turbat', 'Balochistan', 146, true),
  ('Zhob', 'Balochistan', 147, true),
  ('Muzaffarabad', 'Azad Kashmir', 150, true),
  ('Mirpur (AJK)', 'Azad Kashmir', 151, true),
  ('Kotli', 'Azad Kashmir', 152, true),
  ('Rawalakot', 'Azad Kashmir', 153, true),
  ('Gilgit', 'Gilgit-Baltistan', 160, true),
  ('Skardu', 'Gilgit-Baltistan', 161, true),
  ('Hunza', 'Gilgit-Baltistan', 162, true)
on conflict (name) do update
set
  province = excluded.province,
  sort_order = excluded.sort_order;

-- =============================================================================
-- 2. TABLE: delivery_settings (Single row id = 1)
-- =============================================================================
create table if not exists public.delivery_settings (
  id int primary key default 1 check (id = 1),
  flat_rate numeric(10,2) not null default 300 check (flat_rate >= 0),
  free_cities text[] not null default '{Sadiqabad}',
  free_over_amount numeric(12,2) null check (free_over_amount is null or free_over_amount >= 0),
  min_order_amount numeric(12,2) not null default 0 check (min_order_amount >= 0),
  cod_enabled boolean not null default true,
  cod_max_amount numeric(12,2) null check (cod_max_amount is null or cod_max_amount >= 0),
  cod_blocked_cities text[] not null default '{}',
  online_payment_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_delivery_settings_updated_at on public.delivery_settings;
create trigger trg_delivery_settings_updated_at
before update on public.delivery_settings
for each row execute function public.set_updated_at();

insert into public.delivery_settings (
  id,
  flat_rate,
  free_cities,
  free_over_amount,
  min_order_amount,
  cod_enabled,
  cod_max_amount,
  cod_blocked_cities,
  online_payment_enabled
)
values (
  1,
  300.00,
  array['Sadiqabad'],
  null,
  0.00,
  true,
  null,
  array[]::text[],
  false
)
on conflict (id) do nothing;

-- =============================================================================
-- 3. TABLE: coupons (No public select; validated via quote_order / place_order)
-- =============================================================================
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (char_length(btrim(code)) between 2 and 40),
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  value numeric(12,2) not null check (
    value > 0 and (discount_type <> 'percent' or value <= 100)
  ),
  min_order numeric(12,2) not null default 0 check (min_order >= 0),
  max_discount numeric(12,2) null check (max_discount is null or max_discount >= 0),
  starts_at timestamptz null,
  expires_at timestamptz null,
  usage_limit int null check (usage_limit is null or usage_limit >= 1),
  used_count int not null default 0 check (used_count >= 0),
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.normalize_coupon_code()
returns trigger
language plpgsql
as $$
begin
  new.code := upper(btrim(new.code));
  return new;
end;
$$;

drop trigger if exists trg_coupons_normalize_code on public.coupons;
create trigger trg_coupons_normalize_code
before insert or update on public.coupons
for each row execute function public.normalize_coupon_code();

drop trigger if exists trg_coupons_updated_at on public.coupons;
create trigger trg_coupons_updated_at
before update on public.coupons
for each row execute function public.set_updated_at();

create index if not exists idx_coupons_code_upper on public.coupons(upper(code));

-- =============================================================================
-- 4. TABLE: orders (Sequence ORD-000001)
-- =============================================================================
create sequence if not exists public.order_no_seq start 1;

create or replace function public.next_order_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'ORD-' || lpad(nextval('public.order_no_seq')::text, 6, '0');
end;
$$;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique default public.next_order_no(),
  user_id uuid null references public.profiles(id) on delete set null,
  customer_name text not null check (char_length(btrim(customer_name)) between 2 and 100),
  customer_phone text not null check (char_length(btrim(customer_phone)) between 10 and 15),
  customer_email text null check (customer_email is null or char_length(customer_email) <= 120),
  city text not null check (char_length(btrim(city)) between 2 and 80),
  address_line text not null check (char_length(btrim(address_line)) between 5 and 300),
  address_notes text null check (address_notes is null or char_length(address_notes) <= 300),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  delivery_charge numeric(12,2) not null default 0 check (delivery_charge >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  coupon_code text null,
  payment_method text not null default 'cod' check (payment_method in ('cod', 'online', 'manual')),
  payment_status text not null default 'cod_pending' check (
    payment_status in ('cod_pending', 'pending', 'paid', 'failed', 'refunded', 'cod_collected')
  ),
  status text not null default 'placed' check (
    status in ('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned')
  ),
  courier_name text null check (courier_name is null or char_length(courier_name) <= 80),
  tracking_number text null check (tracking_number is null or char_length(tracking_number) <= 80),
  tracking_url text null check (tracking_url is null or char_length(tracking_url) <= 500),
  customer_notes text null check (customer_notes is null or char_length(customer_notes) <= 1000),
  admin_notes text null,
  language text null default 'en',
  ip_hash text null,
  is_demo boolean not null default false,
  placed_at timestamptz not null default now(),
  delivered_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create index if not exists idx_orders_order_no on public.orders(order_no);
create index if not exists idx_orders_user_id on public.orders(user_id, placed_at desc);
create index if not exists idx_orders_status on public.orders(status, placed_at desc);
create index if not exists idx_orders_phone on public.orders(customer_phone);
create index if not exists idx_orders_ip_hash_placed on public.orders(ip_hash, placed_at);

-- =============================================================================
-- 5. TABLE: order_items
-- =============================================================================
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid null references public.products(id) on delete set null,
  sku text not null,
  name text not null,
  name_i18n jsonb not null default '{}'::jsonb,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0)
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- =============================================================================
-- 6. TABLE: order_status_history
-- =============================================================================
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  from_status text null,
  to_status text not null,
  note text null,
  changed_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id
  on public.order_status_history(order_id, created_at asc);

-- =============================================================================
-- 7. TABLE: user_carts (Logged-in customer cart sync)
-- =============================================================================
create table if not exists public.user_carts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_user_carts_updated_at on public.user_carts;
create trigger trg_user_carts_updated_at
before update on public.user_carts
for each row execute function public.set_updated_at();

-- =============================================================================
-- 8. TABLE: order_lookup_attempts (Rate-limit log, admin-only)
-- =============================================================================
create table if not exists public.order_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_lookup_attempts_ip_created
  on public.order_lookup_attempts(ip_hash, created_at);

-- =============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
alter table public.pakistan_cities enable row level security;
alter table public.delivery_settings enable row level security;
alter table public.coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.user_carts enable row level security;
alter table public.order_lookup_attempts enable row level security;

-- 9.1 pakistan_cities: Public SELECT; Admin full CRUD
drop policy if exists "Public can view pakistan cities" on public.pakistan_cities;
create policy "Public can view pakistan cities"
  on public.pakistan_cities for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert pakistan cities" on public.pakistan_cities;
create policy "Admins can insert pakistan cities"
  on public.pakistan_cities for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update pakistan cities" on public.pakistan_cities;
create policy "Admins can update pakistan cities"
  on public.pakistan_cities for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete pakistan cities" on public.pakistan_cities;
create policy "Admins can delete pakistan cities"
  on public.pakistan_cities for delete
  to authenticated
  using (public.is_admin());

-- 9.2 delivery_settings: Public SELECT; Admin UPDATE / INSERT
drop policy if exists "Public can view delivery settings" on public.delivery_settings;
create policy "Public can view delivery settings"
  on public.delivery_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can insert delivery settings" on public.delivery_settings;
create policy "Admins can insert delivery settings"
  on public.delivery_settings for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update delivery settings" on public.delivery_settings;
create policy "Admins can update delivery settings"
  on public.delivery_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 9.3 coupons: NO public select; Admin full CRUD
drop policy if exists "Admins can view coupons" on public.coupons;
create policy "Admins can view coupons"
  on public.coupons for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert coupons" on public.coupons;
create policy "Admins can insert coupons"
  on public.coupons for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update coupons" on public.coupons;
create policy "Admins can update coupons"
  on public.coupons for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete coupons" on public.coupons;
create policy "Admins can delete coupons"
  on public.coupons for delete
  to authenticated
  using (public.is_admin());

-- 9.4 orders: Customers can SELECT own orders; Admin full CRUD; no direct customer writes
drop policy if exists "Customers can view own orders" on public.orders;
create policy "Customers can view own orders"
  on public.orders for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can insert orders" on public.orders;
create policy "Admins can insert orders"
  on public.orders for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- 9.5 order_items: Customers can SELECT own order items; Admin full CRUD
drop policy if exists "Customers can view own order items" on public.order_items;
create policy "Customers can view own order items"
  on public.order_items for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
       where o.id = order_items.order_id
         and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert order items" on public.order_items;
create policy "Admins can insert order items"
  on public.order_items for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update order items" on public.order_items;
create policy "Admins can update order items"
  on public.order_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete order items" on public.order_items;
create policy "Admins can delete order items"
  on public.order_items for delete
  to authenticated
  using (public.is_admin());

-- 9.6 order_status_history: Customers can SELECT own order history; Admin full CRUD
drop policy if exists "Customers can view own order status history" on public.order_status_history;
create policy "Customers can view own order status history"
  on public.order_status_history for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
       where o.id = order_status_history.order_id
         and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert order status history" on public.order_status_history;
create policy "Admins can insert order status history"
  on public.order_status_history for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can delete order status history" on public.order_status_history;
create policy "Admins can delete order status history"
  on public.order_status_history for delete
  to authenticated
  using (public.is_admin());

-- 9.7 user_carts: Owner-only RLS (plus admin select)
drop policy if exists "Users can view own cart" on public.user_carts;
create policy "Users can view own cart"
  on public.user_carts for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Users can insert own cart" on public.user_carts;
create policy "Users can insert own cart"
  on public.user_carts for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Users can update own cart" on public.user_carts;
create policy "Users can update own cart"
  on public.user_carts for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "Users can delete own cart" on public.user_carts;
create policy "Users can delete own cart"
  on public.user_carts for delete
  to authenticated
  using (user_id = auth.uid());

-- 9.8 order_lookup_attempts: Admin only
drop policy if exists "Admins can view order lookup attempts" on public.order_lookup_attempts;
create policy "Admins can view order lookup attempts"
  on public.order_lookup_attempts for select
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 10. RPC 1: quote_order(p_items jsonb, p_city text, p_coupon text)
-- =============================================================================
-- Authoritative pricing from database (uses sale_price when set, else price).
-- Validates each product is active and in stock, computes subtotal, coupon
-- discount, delivery charge (free in Sadiqabad / free_cities, else flat_rate,
-- or free_over_amount), total, COD availability, and online payment availability.
-- Caps cart at 30 distinct lines and 20 units per line.
-- =============================================================================
create or replace function public.quote_order(
  p_items jsonb,
  p_city text default null,
  p_coupon text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ds public.delivery_settings%rowtype;
  v_item jsonb;
  v_prod_id uuid;
  v_req_qty int;
  v_client_price numeric(12,2);
  v_prod public.products%rowtype;
  v_img_url text;
  v_unit_price numeric(12,2);
  v_eff_qty int;
  v_line_total numeric(12,2);
  v_line_problems text[];
  v_lines jsonb := '[]'::jsonb;
  v_problems jsonb := '[]'::jsonb;
  v_has_blocking boolean := false;
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_delivery_charge numeric(12,2) := 0;
  v_delivery_rule text := 'flat_rate';
  v_total numeric(12,2) := 0;
  v_coupon_clean text := upper(btrim(coalesce(p_coupon, '')));
  v_coupon_row public.coupons%rowtype;
  v_coupon_valid boolean := false;
  v_coupon_error text := null;
  v_city_clean text := lower(btrim(coalesce(p_city, '')));
  v_is_free_city boolean := false;
  v_is_cod_blocked_city boolean := false;
  v_cod_allowed boolean := true;
  v_cod_reason text := null;
  v_line_count int := 0;
begin
  -- Load delivery_settings (fallback to defaults if missing)
  select * into v_ds from public.delivery_settings where id = 1;
  if not found then
    v_ds.flat_rate := 300.00;
    v_ds.free_cities := array['Sadiqabad'];
    v_ds.free_over_amount := null;
    v_ds.min_order_amount := 0;
    v_ds.cod_enabled := true;
    v_ds.cod_max_amount := null;
    v_ds.cod_blocked_cities := array[]::text[];
    v_ds.online_payment_enabled := false;
  end if;

  if p_items is not null and jsonb_typeof(p_items) = 'array' then
    for v_item in
      select value from jsonb_array_elements(p_items) limit 30
    loop
      v_line_count := v_line_count + 1;
      v_line_problems := array[]::text[];

      begin
        v_prod_id := (v_item->>'product_id')::uuid;
      exception when others then
        v_prod_id := null;
      end;

      v_req_qty := coalesce((v_item->>'quantity')::int, 1);
      if v_req_qty < 1 then
        v_req_qty := 1;
      end if;
      if v_req_qty > 20 then
        v_req_qty := 20;
      end if;

      begin
        v_client_price := (v_item->>'client_unit_price')::numeric(12,2);
      exception when others then
        v_client_price := null;
      end;

      if v_prod_id is null then
        continue;
      end if;

      select * into v_prod from public.products where id = v_prod_id;
      if not found then
        v_line_problems := array_append(v_line_problems, 'inactive');
        v_has_blocking := true;
        v_problems := v_problems || jsonb_build_array(
          jsonb_build_object(
            'product_id', v_prod_id,
            'code', 'inactive'
          )
        );
        v_lines := v_lines || jsonb_build_array(
          jsonb_build_object(
            'product_id', v_prod_id,
            'sku', coalesce(v_item->>'sku', 'UNKNOWN'),
            'slug', coalesce(v_item->>'slug', ''),
            'name', coalesce(v_item->'name', '{"en": "Unavailable Item"}'::jsonb),
            'unit_price', coalesce(v_client_price, 0),
            'quantity', v_req_qty,
            'available_stock', 0,
            'line_total', 0,
            'is_active', false,
            'problems', to_jsonb(v_line_problems)
          )
        );
        continue;
      end if;

      -- Primary image
      select pi.url into v_img_url
      from public.product_images pi
      where pi.product_id = v_prod.id
      order by pi.is_primary desc, pi.sort_order asc, pi.created_at asc
      limit 1;

      -- Effective authoritative unit price (uses sale_price when set, else price)
      v_unit_price := case
        when v_prod.sale_price is not null and v_prod.sale_price > 0 then v_prod.sale_price
        else v_prod.price
      end;

      if not v_prod.is_active then
        v_line_problems := array_append(v_line_problems, 'inactive');
        v_has_blocking := true;
        v_problems := v_problems || jsonb_build_array(
          jsonb_build_object(
            'product_id', v_prod.id,
            'sku', v_prod.sku,
            'code', 'inactive'
          )
        );
      end if;

      if v_prod.stock_qty <= 0 or v_prod.stock_qty < v_req_qty then
        v_line_problems := array_append(v_line_problems, 'out_of_stock');
        v_has_blocking := true;
        v_problems := v_problems || jsonb_build_array(
          jsonb_build_object(
            'product_id', v_prod.id,
            'sku', v_prod.sku,
            'code', 'out_of_stock',
            'available_stock', greatest(v_prod.stock_qty, 0),
            'requested_qty', v_req_qty
          )
        );
      end if;

      if v_client_price is not null and v_client_price <> v_unit_price then
        v_line_problems := array_append(v_line_problems, 'price_changed');
        v_problems := v_problems || jsonb_build_array(
          jsonb_build_object(
            'product_id', v_prod.id,
            'sku', v_prod.sku,
            'code', 'price_changed',
            'old_price', v_client_price,
            'new_price', v_unit_price
          )
        );
      end if;

      if v_prod.is_active and v_prod.stock_qty > 0 then
        v_eff_qty := least(v_req_qty, v_prod.stock_qty, 20);
        v_line_total := round(v_unit_price * v_eff_qty, 2);
        v_subtotal := v_subtotal + v_line_total;
      else
        v_eff_qty := v_req_qty;
        v_line_total := 0;
      end if;

      v_lines := v_lines || jsonb_build_array(
        jsonb_build_object(
          'product_id', v_prod.id,
          'sku', v_prod.sku,
          'slug', v_prod.slug,
          'name', v_prod.name,
          'primary_image_url', v_img_url,
          'part_origin', v_prod.part_origin,
          'unit_price', v_unit_price,
          'compare_at_price', v_prod.compare_at_price,
          'quantity', v_req_qty,
          'available_stock', greatest(v_prod.stock_qty, 0),
          'line_total', v_line_total,
          'is_active', v_prod.is_active,
          'problems', to_jsonb(v_line_problems)
        )
      );
    end loop;
  end if;

  -- Coupon evaluation
  if v_coupon_clean <> '' and v_subtotal > 0 then
    select * into v_coupon_row
    from public.coupons c
    where upper(c.code) = v_coupon_clean
    limit 1;

    if not found or not v_coupon_row.is_active then
      v_coupon_valid := false;
      v_coupon_error := 'invalid_coupon';
    elsif v_coupon_row.starts_at is not null and now() < v_coupon_row.starts_at then
      v_coupon_valid := false;
      v_coupon_error := 'not_started';
    elsif v_coupon_row.expires_at is not null and now() > v_coupon_row.expires_at then
      v_coupon_valid := false;
      v_coupon_error := 'expired';
    elsif v_coupon_row.usage_limit is not null and v_coupon_row.used_count >= v_coupon_row.usage_limit then
      v_coupon_valid := false;
      v_coupon_error := 'usage_limit';
    elsif v_subtotal < v_coupon_row.min_order then
      v_coupon_valid := false;
      v_coupon_error := 'min_order';
    else
      v_coupon_valid := true;
      if v_coupon_row.discount_type = 'percent' then
        v_discount := round(v_subtotal * (v_coupon_row.value / 100.0), 2);
      else
        v_discount := v_coupon_row.value;
      end if;

      if v_coupon_row.max_discount is not null then
        v_discount := least(v_discount, v_coupon_row.max_discount);
      end if;

      v_discount := least(v_discount, v_subtotal);
    end if;
  end if;

  -- Delivery charge evaluation:
  -- City in free_cities (case-insensitive and trimmed) -> 0;
  -- Otherwise free_over_amount when set and met -> 0;
  -- Otherwise flat_rate.
  if v_city_clean <> '' then
    select exists (
      select 1
      from unnest(coalesce(v_ds.free_cities, array[]::text[])) as fc
      where lower(btrim(fc)) = v_city_clean
    ) into v_is_free_city;

    select exists (
      select 1
      from unnest(coalesce(v_ds.cod_blocked_cities, array[]::text[])) as bc
      where lower(btrim(bc)) = v_city_clean
    ) into v_is_cod_blocked_city;
  end if;

  if v_subtotal <= 0 then
    v_delivery_charge := 0;
    v_delivery_rule := 'empty_cart';
  elsif v_is_free_city then
    v_delivery_charge := 0;
    v_delivery_rule := 'free_city';
  elsif v_ds.free_over_amount is not null and (v_subtotal - v_discount) >= v_ds.free_over_amount then
    v_delivery_charge := 0;
    v_delivery_rule := 'free_over_amount';
  else
    v_delivery_charge := v_ds.flat_rate;
    v_delivery_rule := 'flat_rate';
  end if;

  v_total := greatest(0, v_subtotal - v_discount) + v_delivery_charge;

  -- COD availability check
  if not v_ds.cod_enabled then
    v_cod_allowed := false;
    v_cod_reason := 'cod_disabled';
  elsif v_is_cod_blocked_city then
    v_cod_allowed := false;
    v_cod_reason := 'city_blocked';
  elsif v_ds.cod_max_amount is not null and v_total > v_ds.cod_max_amount then
    v_cod_allowed := false;
    v_cod_reason := 'exceeds_max_amount';
  end if;

  return jsonb_build_object(
    'lines', v_lines,
    'problems', v_problems,
    'has_blocking_problems', v_has_blocking,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'coupon_code', case when v_coupon_valid then v_coupon_row.code else null end,
    'coupon_valid', v_coupon_valid,
    'coupon_error', v_coupon_error,
    'coupon_min_order', case when v_coupon_row.id is not null then v_coupon_row.min_order else null end,
    'delivery_charge', v_delivery_charge,
    'delivery_rule', v_delivery_rule,
    'free_cities', to_jsonb(coalesce(v_ds.free_cities, array['Sadiqabad'])),
    'flat_rate', v_ds.flat_rate,
    'free_over_amount', v_ds.free_over_amount,
    'min_order_amount', v_ds.min_order_amount,
    'meets_min_order', (v_subtotal >= v_ds.min_order_amount),
    'total', v_total,
    'cod_allowed', v_cod_allowed,
    'cod_reason', v_cod_reason,
    'cod_max_amount', v_ds.cod_max_amount,
    'online_payment_enabled', v_ds.online_payment_enabled
  );
end;
$$;

grant execute on function public.quote_order(jsonb, text, text) to anon, authenticated;

-- =============================================================================
-- 11. RPC 2: place_order(...)
-- =============================================================================
-- Re-runs all quote logic inside the transaction, locks product rows FOR UPDATE
-- in stable UUID order, rechecks stock, decrements stock, writes stock_movements
-- ('sale'), increments coupon usage, inserts order + order_items + history.
-- Error codes: empty_cart, out_of_stock, invalid_coupon, cod_not_allowed,
--              online_unavailable, min_order, rate_limited, invalid_input
-- =============================================================================
create or replace function public.place_order(
  p_items jsonb,
  p_customer jsonb,
  p_city text,
  p_address_line text,
  p_address_notes text default null,
  p_payment_method text default 'cod',
  p_coupon text default null,
  p_language text default 'en'
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_ds public.delivery_settings%rowtype;
  v_cust_name text;
  v_cust_phone text;
  v_cust_phone_last10 text;
  v_cust_email text;
  v_cust_notes text;
  v_city text;
  v_city_lower text;
  v_addr_line text;
  v_addr_notes text;
  v_pay_method text;
  v_coupon_clean text;
  v_coupon_row public.coupons%rowtype;
  v_ip_hash text;
  v_ip_orders_hour int;
  v_phone_orders_day int;
  v_prod_row public.products%rowtype;
  v_req record;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_delivery_charge numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_is_free_city boolean := false;
  v_is_cod_blocked boolean := false;
  v_payment_status text;
  v_is_demo_mode boolean := false;
  v_order public.orders%rowtype;
  v_distinct_count int := 0;
begin
  -- 1. Validate cart array
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  if jsonb_array_length(p_items) > 30 then
    raise exception 'invalid_input';
  end if;

  -- 2. Extract and validate customer & address inputs
  v_cust_name := btrim(coalesce(p_customer->>'name', p_customer->>'customer_name', ''));
  v_cust_phone := regexp_replace(btrim(coalesce(p_customer->>'phone', p_customer->>'customer_phone', '')), '[\s\-]', '', 'g');
  v_cust_email := nullif(btrim(coalesce(p_customer->>'email', p_customer->>'customer_email', '')), '');
  v_cust_notes := nullif(btrim(coalesce(p_customer->>'notes', p_customer->>'customer_notes', '')), '');

  v_city := btrim(coalesce(p_city, ''));
  v_city_lower := lower(v_city);
  v_addr_line := btrim(coalesce(p_address_line, ''));
  v_addr_notes := nullif(btrim(coalesce(p_address_notes, '')), '');
  v_pay_method := lower(btrim(coalesce(p_payment_method, 'cod')));
  v_coupon_clean := upper(btrim(coalesce(p_coupon, '')));

  if char_length(v_cust_name) < 2 or char_length(v_cust_name) > 100 then
    raise exception 'invalid_input';
  end if;

  if v_cust_phone !~ '^(\+92|0)3[0-9]{9}$' then
    raise exception 'invalid_input';
  end if;

  v_cust_phone_last10 := public.normalize_phone_last10(v_cust_phone);

  if v_cust_email is not null and (char_length(v_cust_email) > 120 or v_cust_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
    raise exception 'invalid_input';
  end if;

  if char_length(v_city) < 2 or char_length(v_city) > 80 then
    raise exception 'invalid_input';
  end if;

  if char_length(v_addr_line) < 5 or char_length(v_addr_line) > 300 then
    raise exception 'invalid_input';
  end if;

  if v_addr_notes is not null and char_length(v_addr_notes) > 300 then
    raise exception 'invalid_input';
  end if;

  if v_cust_notes is not null and char_length(v_cust_notes) > 1000 then
    raise exception 'invalid_input';
  end if;

  if v_pay_method not in ('cod', 'online', 'manual') then
    raise exception 'invalid_input';
  end if;

  -- 3. Rate limiting: max 5 orders/hour per IP hash AND max 5 orders/day per phone
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_ip_orders_hour
      from public.orders o
     where o.ip_hash = v_ip_hash
       and o.placed_at >= now() - interval '1 hour';

    if v_ip_orders_hour >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  select count(*)::int
    into v_phone_orders_day
    from public.orders o
   where public.normalize_phone_last10(o.customer_phone) = v_cust_phone_last10
     and o.placed_at >= now() - interval '24 hours';

  if v_phone_orders_day >= 5 then
    raise exception 'rate_limited';
  end if;

  -- 4. Load delivery_settings
  select * into v_ds from public.delivery_settings where id = 1;
  if not found then
    v_ds.flat_rate := 300.00;
    v_ds.free_cities := array['Sadiqabad'];
    v_ds.free_over_amount := null;
    v_ds.min_order_amount := 0;
    v_ds.cod_enabled := true;
    v_ds.cod_max_amount := null;
    v_ds.cod_blocked_cities := array[]::text[];
    v_ds.online_payment_enabled := false;
  end if;

  -- Payment method gate
  if v_pay_method = 'online' and not v_ds.online_payment_enabled then
    raise exception 'online_unavailable';
  end if;

  if v_pay_method = 'cod' then
    if not v_ds.cod_enabled then
      raise exception 'cod_not_allowed';
    end if;

    select exists (
      select 1
      from unnest(coalesce(v_ds.cod_blocked_cities, array[]::text[])) as bc
      where lower(btrim(bc)) = v_city_lower
    ) into v_is_cod_blocked;

    if v_is_cod_blocked then
      raise exception 'cod_not_allowed';
    end if;
  end if;

  -- 5. Aggregate requested items by product_id and lock products in stable UUID order
  for v_req in
    select
      (elem->>'product_id')::uuid as product_id,
      sum(coalesce((elem->>'quantity')::int, 0))::int as qty
    from jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::uuid
    order by (elem->>'product_id')::uuid asc
  loop
    v_distinct_count := v_distinct_count + 1;
    if v_req.product_id is null or v_req.qty < 1 or v_req.qty > 20 or v_distinct_count > 30 then
      raise exception 'invalid_input';
    end if;

    select *
      into v_prod_row
      from public.products p
     where p.id = v_req.product_id
     for update;

    if not found or not v_prod_row.is_active or v_prod_row.stock_qty < v_req.qty then
      raise exception 'out_of_stock';
    end if;

    v_unit_price := case
      when v_prod_row.sale_price is not null and v_prod_row.sale_price > 0 then v_prod_row.sale_price
      else v_prod_row.price
    end;

    v_line_total := round(v_unit_price * v_req.qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if v_distinct_count = 0 or v_subtotal <= 0 then
    raise exception 'empty_cart';
  end if;

  -- 6. Check minimum order amount
  if v_subtotal < v_ds.min_order_amount then
    raise exception 'min_order';
  end if;

  -- 7. Validate & lock coupon if supplied
  if v_coupon_clean <> '' then
    select *
      into v_coupon_row
      from public.coupons c
     where upper(c.code) = v_coupon_clean
     for update;

    if not found
       or not v_coupon_row.is_active
       or (v_coupon_row.starts_at is not null and now() < v_coupon_row.starts_at)
       or (v_coupon_row.expires_at is not null and now() > v_coupon_row.expires_at)
       or (v_coupon_row.usage_limit is not null and v_coupon_row.used_count >= v_coupon_row.usage_limit)
       or (v_subtotal < v_coupon_row.min_order)
    then
      raise exception 'invalid_coupon';
    end if;

    if v_coupon_row.discount_type = 'percent' then
      v_discount := round(v_subtotal * (v_coupon_row.value / 100.0), 2);
    else
      v_discount := v_coupon_row.value;
    end if;

    if v_coupon_row.max_discount is not null then
      v_discount := least(v_discount, v_coupon_row.max_discount);
    end if;

    v_discount := least(v_discount, v_subtotal);

    update public.coupons
       set used_count = used_count + 1,
           updated_at = now()
     where id = v_coupon_row.id;
  end if;

  -- 8. Compute delivery charge
  select exists (
    select 1
    from unnest(coalesce(v_ds.free_cities, array[]::text[])) as fc
    where lower(btrim(fc)) = v_city_lower
  ) into v_is_free_city;

  if v_is_free_city then
    v_delivery_charge := 0;
  elsif v_ds.free_over_amount is not null and (v_subtotal - v_discount) >= v_ds.free_over_amount then
    v_delivery_charge := 0;
  else
    v_delivery_charge := v_ds.flat_rate;
  end if;

  v_total := greatest(0, v_subtotal - v_discount) + v_delivery_charge;

  -- Re-check COD max amount
  if v_pay_method = 'cod' and v_ds.cod_max_amount is not null and v_total > v_ds.cod_max_amount then
    raise exception 'cod_not_allowed';
  end if;

  v_payment_status := case
    when v_pay_method = 'cod' then 'cod_pending'
    else 'pending'
  end;

  select coalesce(demo_mode, false) into v_is_demo_mode from public.site_settings where id = 1;

  -- 9. Insert order
  insert into public.orders (
    user_id,
    customer_name,
    customer_phone,
    customer_email,
    city,
    address_line,
    address_notes,
    subtotal,
    discount,
    delivery_charge,
    total,
    coupon_code,
    payment_method,
    payment_status,
    status,
    customer_notes,
    language,
    ip_hash,
    is_demo,
    placed_at
  )
  values (
    auth.uid(),
    v_cust_name,
    v_cust_phone,
    v_cust_email,
    v_city,
    v_addr_line,
    v_addr_notes,
    v_subtotal,
    v_discount,
    v_delivery_charge,
    v_total,
    case when v_coupon_clean <> '' then v_coupon_row.code else null end,
    v_pay_method,
    v_payment_status,
    'placed',
    v_cust_notes,
    coalesce(nullif(btrim(p_language), ''), 'en'),
    v_ip_hash,
    coalesce(v_is_demo_mode, false),
    now()
  )
  returning * into v_order;

  -- 10. Insert order_items, decrement stock, and log stock_movements
  for v_req in
    select
      (elem->>'product_id')::uuid as product_id,
      sum(coalesce((elem->>'quantity')::int, 0))::int as qty
    from jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::uuid
    order by (elem->>'product_id')::uuid asc
  loop
    select * into v_prod_row from public.products where id = v_req.product_id;

    v_unit_price := case
      when v_prod_row.sale_price is not null and v_prod_row.sale_price > 0 then v_prod_row.sale_price
      else v_prod_row.price
    end;
    v_line_total := round(v_unit_price * v_req.qty, 2);

    insert into public.order_items (
      order_id,
      product_id,
      sku,
      name,
      name_i18n,
      unit_price,
      quantity,
      line_total
    )
    values (
      v_order.id,
      v_prod_row.id,
      v_prod_row.sku,
      coalesce(nullif(btrim(v_prod_row.name->>'en'), ''), v_prod_row.sku),
      v_prod_row.name,
      v_unit_price,
      v_req.qty,
      v_line_total
    );

    update public.products
       set stock_qty = stock_qty - v_req.qty,
           updated_at = now()
     where id = v_prod_row.id;

    insert into public.stock_movements (
      product_id,
      delta,
      reason,
      reference_type,
      reference_id,
      note,
      created_by
    )
    values (
      v_prod_row.id,
      -v_req.qty,
      'sale',
      'order',
      v_order.id,
      'Order ' || v_order.order_no,
      auth.uid()
    );
  end loop;

  -- 11. Insert initial order_status_history
  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_order.id,
    null,
    'placed',
    'Order placed via ' || upper(v_pay_method),
    auth.uid()
  );

  -- 12. Clear synced cart if logged in
  if auth.uid() is not null then
    delete from public.user_carts where user_id = auth.uid();
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'delivery_charge', v_order.delivery_charge,
    'total', v_order.total,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'status', v_order.status,
    'city', v_order.city,
    'placed_at', v_order.placed_at
  );
end;
$$;

grant execute on function public.place_order(jsonb, jsonb, text, text, text, text, text, text) to anon, authenticated;

-- =============================================================================
-- 12. RPC 3: lookup_order_status(p_order_no text, p_phone text)
-- =============================================================================
-- Public two-factor order lookup (order_no + phone), rate-limited to 10 attempts
-- per 15 minutes per IP hash. Returns privacy-safe minimal order view (no full
-- address, email, phone, or internal notes).
-- =============================================================================
create or replace function public.lookup_order_status(
  p_order_no text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order_no text;
  v_phone_last10 text;
  v_ip_hash text;
  v_attempts int;
  v_order public.orders%rowtype;
  v_items jsonb;
  v_history jsonb;
begin
  v_order_no := upper(btrim(coalesce(p_order_no, '')));
  v_phone_last10 := public.normalize_phone_last10(p_phone);

  if v_order_no = '' or char_length(v_phone_last10) < 10 then
    raise exception 'not_found';
  end if;

  -- Rate limit: max 10 lookup attempts per 15 minutes per IP hash
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_attempts
      from public.order_lookup_attempts a
     where a.ip_hash = v_ip_hash
       and a.created_at >= now() - interval '15 minutes';

    if v_attempts >= 10 then
      raise exception 'rate_limited';
    end if;

    insert into public.order_lookup_attempts (ip_hash) values (v_ip_hash);
  end if;

  select *
    into v_order
    from public.orders o
   where upper(o.order_no) = v_order_no
     and public.normalize_phone_last10(o.customer_phone) = v_phone_last10
   limit 1;

  if not found then
    raise exception 'not_found';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'sku', oi.sku,
        'name', oi.name,
        'name_i18n', oi.name_i18n,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'line_total', oi.line_total
      )
      order by oi.sku asc
    ),
    '[]'::jsonb
  )
    into v_items
    from public.order_items oi
   where oi.order_id = v_order.id;

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
    from public.order_status_history h
   where h.order_id = v_order.id;

  return jsonb_build_object(
    'order_no', v_order.order_no,
    'status', v_order.status,
    'payment_method', v_order.payment_method,
    'payment_status', v_order.payment_status,
    'city', v_order.city,
    'subtotal', v_order.subtotal,
    'discount', v_order.discount,
    'delivery_charge', v_order.delivery_charge,
    'total', v_order.total,
    'coupon_code', v_order.coupon_code,
    'courier_name', v_order.courier_name,
    'tracking_number', v_order.tracking_number,
    'tracking_url', v_order.tracking_url,
    'placed_at', v_order.placed_at,
    'delivered_at', v_order.delivered_at,
    'items', v_items,
    'history', v_history
  );
end;
$$;

grant execute on function public.lookup_order_status(text, text) to anon, authenticated;

-- =============================================================================
-- 13. RPC 4: cancel_my_order(p_order_id uuid)
-- =============================================================================
-- Authenticated customer can cancel their own order ONLY while status is
-- 'placed' or 'confirmed'. Restores product stock ('order_cancel') and coupon usage.
-- =============================================================================
create or replace function public.cancel_my_order(
  p_order_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  select *
    into v_order
    from public.orders o
   where o.id = p_order_id
     and o.user_id = auth.uid()
   for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_order.status not in ('placed', 'confirmed') then
    raise exception 'cannot_cancel';
  end if;

  -- Restore stock for each item
  for v_item in
    select product_id, quantity, sku
    from public.order_items
    where order_id = v_order.id
  loop
    if v_item.product_id is not null then
      update public.products
         set stock_qty = stock_qty + v_item.quantity,
             updated_at = now()
       where id = v_item.product_id;

      insert into public.stock_movements (
        product_id,
        delta,
        reason,
        reference_type,
        reference_id,
        note,
        created_by
      )
      values (
        v_item.product_id,
        v_item.quantity,
        'order_cancel',
        'order',
        v_order.id,
        'Customer cancelled ' || v_order.order_no,
        auth.uid()
      );
    end if;
  end loop;

  -- Restore coupon usage if any
  if v_order.coupon_code is not null then
    update public.coupons
       set used_count = greatest(0, used_count - 1),
           updated_at = now()
     where upper(code) = upper(v_order.coupon_code);
  end if;

  update public.orders
     set status = 'cancelled',
         updated_at = now()
   where id = v_order.id;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_order.id,
    v_order.status,
    'cancelled',
    'Cancelled by customer',
    auth.uid()
  );

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'status', 'cancelled'
  );
end;
$$;

grant execute on function public.cancel_my_order(uuid) to authenticated;

-- =============================================================================
-- 14. RPC 5: admin_update_order_status(p_order_id uuid, p_status text, p_note text)
-- =============================================================================
-- Validates transitions:
--   placed -> confirmed -> packed -> shipped -> delivered
--   cancelled allowed before shipped (placed, confirmed, packed)
--   returned allowed only after shipped or delivered
-- Restores stock on cancel/return, sets delivered_at, and for COD sets
-- payment_status = 'cod_collected' on delivery.
-- =============================================================================
create or replace function public.admin_update_order_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_new_status text := lower(btrim(coalesce(p_status, '')));
  v_clean_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_Valid boolean := false;
  v_item record;
  v_prev_status text;
  v_new_pay_status text;
  v_new_delivered_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if v_new_status not in ('placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned') then
    raise exception 'invalid_status';
  end if;

  select *
    into v_order
    from public.orders o
   where o.id = p_order_id
   for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_order.status = v_new_status then
    return to_jsonb(v_order);
  end if;

  v_prev_status := v_order.status;

  -- Validate allowed transition
  case v_order.status
    when 'placed' then
      v_valid := v_new_status in ('confirmed', 'packed', 'cancelled');
    when 'confirmed' then
      v_valid := v_new_status in ('packed', 'shipped', 'cancelled');
    when 'packed' then
      v_valid := v_new_status in ('shipped', 'cancelled');
    when 'shipped' then
      v_valid := v_new_status in ('delivered', 'returned');
    when 'delivered' then
      v_valid := v_new_status in ('returned');
    else
      v_valid := false;
  end case;

  if not v_valid then
    raise exception 'invalid_transition';
  end if;

  v_new_pay_status := v_order.payment_status;
  v_new_delivered_at := v_order.delivered_at;

  -- Restore stock if cancelling or returning
  if v_new_status in ('cancelled', 'returned') and v_order.status not in ('cancelled', 'returned') then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = v_order.id
    loop
      if v_item.product_id is not null then
        update public.products
           set stock_qty = stock_qty + v_item.quantity,
               updated_at = now()
         where id = v_item.product_id;

        insert into public.stock_movements (
          product_id,
          delta,
          reason,
          reference_type,
          reference_id,
          note,
          created_by
        )
        values (
          v_item.product_id,
          v_item.quantity,
          case when v_new_status = 'cancelled' then 'order_cancel' else 'return' end,
          'order',
          v_order.id,
          coalesce(v_clean_note, initcap(v_new_status) || ' order ' || v_order.order_no),
          auth.uid()
        );
      end if;
    end loop;

    if v_new_status = 'cancelled' and v_order.coupon_code is not null then
      update public.coupons
         set used_count = greatest(0, used_count - 1),
             updated_at = now()
       where upper(code) = upper(v_order.coupon_code);
    end if;

    if v_new_status = 'returned' and v_order.payment_status in ('paid', 'cod_collected') then
      v_new_pay_status := 'refunded';
    end if;
  end if;

  if v_new_status = 'delivered' then
    v_new_delivered_at := coalesce(v_order.delivered_at, now());
    if v_order.payment_method = 'cod' then
      v_new_pay_status := 'cod_collected';
    end if;
  end if;

  update public.orders
     set status = v_new_status,
         payment_status = v_new_pay_status,
         delivered_at = v_new_delivered_at,
         updated_at = now()
   where id = v_order.id
   returning * into v_order;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_order.id,
    v_prev_status,
    v_new_status,
    v_clean_note,
    auth.uid()
  );

  return to_jsonb(v_order);
end;
$$;

grant execute on function public.admin_update_order_status(uuid, text, text) to authenticated;

-- =============================================================================
-- 15. RPC 6: admin_set_shipping(p_order_id, p_courier, p_tracking_no, p_tracking_url)
-- =============================================================================
create or replace function public.admin_set_shipping(
  p_order_id uuid,
  p_courier text,
  p_tracking_no text,
  p_tracking_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_courier text := nullif(btrim(coalesce(p_courier, '')), '');
  v_tracking_no text := nullif(btrim(coalesce(p_tracking_no, '')), '');
  v_tracking_url text := nullif(btrim(coalesce(p_tracking_url, '')), '');
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if v_tracking_url is not null and v_tracking_url !~* '^https://' then
    raise exception 'invalid_tracking_url';
  end if;

  update public.orders
     set courier_name = v_courier,
         tracking_number = v_tracking_no,
         tracking_url = v_tracking_url,
         updated_at = now()
   where id = p_order_id
   returning * into v_order;

  if not found then
    raise exception 'not_found';
  end if;

  return to_jsonb(v_order);
end;
$$;

grant execute on function public.admin_set_shipping(uuid, text, text, text) to authenticated;

-- =============================================================================
-- 16. RPC 7: admin_update_payment_status(p_order_id, p_payment_status, p_note)
-- =============================================================================
create or replace function public.admin_update_payment_status(
  p_order_id uuid,
  p_payment_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_pay text := lower(btrim(coalesce(p_payment_status, '')));
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if v_pay not in ('cod_pending', 'pending', 'paid', 'failed', 'refunded', 'cod_collected') then
    raise exception 'invalid_payment_status';
  end if;

  update public.orders
     set payment_status = v_pay,
         admin_notes = case
           when nullif(btrim(coalesce(p_note, '')), '') is not null
             then btrim(p_note)
           else admin_notes
         end,
         updated_at = now()
   where id = p_order_id
   returning * into v_order;

  if not found then
    raise exception 'not_found';
  end if;

  return to_jsonb(v_order);
end;
$$;

grant execute on function public.admin_update_payment_status(uuid, text, text) to authenticated;

-- =============================================================================
-- 17. RPC 7B: admin_set_payment_status(p_order_id, p_status, p_note)
-- =============================================================================
-- Manual payment status override by admin, logged in order_status_history.
-- =============================================================================
create or replace function public.admin_set_payment_status(
  p_order_id uuid,
  p_status text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_pay text := lower(btrim(coalesce(p_status, '')));
  v_clean_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_prev_pay text;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if v_pay not in ('cod_pending', 'pending', 'paid', 'failed', 'refunded', 'cod_collected') then
    raise exception 'invalid_payment_status';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'not_found';
  end if;

  v_prev_pay := v_order.payment_status;

  update public.orders
     set payment_status = v_pay,
         updated_at = now()
   where id = p_order_id
   returning * into v_order;

  insert into public.order_status_history (
    order_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_order.id,
    v_order.status,
    v_order.status,
    coalesce(v_clean_note, 'Payment status changed from ' || v_prev_pay || ' to ' || v_pay),
    auth.uid()
  );

  return to_jsonb(v_order);
end;
$$;

grant execute on function public.admin_set_payment_status(uuid, text, text) to authenticated;

-- =============================================================================
-- 18. RPC 8: admin_create_order(...) (Phone / Walk-in Order by Admin)
-- =============================================================================
-- Uses the same server-side pricing, stock decrement, and coupon logic as
-- place_order, but requires is_admin() and skips public rate limits.
-- =============================================================================
create or replace function public.admin_create_order(
  p_items jsonb,
  p_customer jsonb,
  p_city text,
  p_address_line text,
  p_address_notes text default null,
  p_payment_method text default 'cod',
  p_coupon text default null,
  p_admin_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_ds public.delivery_settings%rowtype;
  v_cust_name text;
  v_cust_phone text;
  v_cust_email text;
  v_cust_notes text;
  v_city text;
  v_city_lower text;
  v_addr_line text;
  v_addr_notes text;
  v_pay_method text;
  v_coupon_clean text;
  v_coupon_row public.coupons%rowtype;
  v_prod_row public.products%rowtype;
  v_req record;
  v_unit_price numeric(12,2);
  v_line_total numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_discount numeric(12,2) := 0;
  v_delivery_charge numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
  v_is_free_city boolean := false;
  v_payment_status text;
  v_order public.orders%rowtype;
  v_distinct_count int := 0;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'empty_cart';
  end if;

  v_cust_name := btrim(coalesce(p_customer->>'name', p_customer->>'customer_name', ''));
  v_cust_phone := regexp_replace(btrim(coalesce(p_customer->>'phone', p_customer->>'customer_phone', '')), '[\s\-]', '', 'g');
  v_cust_email := nullif(btrim(coalesce(p_customer->>'email', p_customer->>'customer_email', '')), '');
  v_cust_notes := nullif(btrim(coalesce(p_customer->>'notes', p_customer->>'customer_notes', '')), '');
  v_city := btrim(coalesce(p_city, 'Sadiqabad'));
  v_city_lower := lower(v_city);
  v_addr_line := btrim(coalesce(p_address_line, ''));
  v_addr_notes := nullif(btrim(coalesce(p_address_notes, '')), '');
  v_pay_method := lower(btrim(coalesce(p_payment_method, 'cod')));
  v_coupon_clean := upper(btrim(coalesce(p_coupon, '')));

  if char_length(v_cust_name) < 2 or v_cust_phone !~ '^(\+92|0)3[0-9]{9}$' or char_length(v_addr_line) < 5 then
    raise exception 'invalid_input';
  end if;

  select * into v_ds from public.delivery_settings where id = 1;
  if not found then
    v_ds.flat_rate := 300.00;
    v_ds.free_cities := array['Sadiqabad'];
    v_ds.free_over_amount := null;
  end if;

  for v_req in
    select
      (elem->>'product_id')::uuid as product_id,
      sum(coalesce((elem->>'quantity')::int, 0))::int as qty
    from jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::uuid
    order by (elem->>'product_id')::uuid asc
  loop
    v_distinct_count := v_distinct_count + 1;
    if v_req.product_id is null or v_req.qty < 1 or v_req.qty > 20 or v_distinct_count > 30 then
      raise exception 'invalid_input';
    end if;

    select * into v_prod_row from public.products p where p.id = v_req.product_id for update;
    if not found or not v_prod_row.is_active or v_prod_row.stock_qty < v_req.qty then
      raise exception 'out_of_stock';
    end if;

    v_unit_price := case
      when v_prod_row.sale_price is not null and v_prod_row.sale_price > 0 then v_prod_row.sale_price
      else v_prod_row.price
    end;
    v_line_total := round(v_unit_price * v_req.qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  if v_coupon_clean <> '' then
    select * into v_coupon_row from public.coupons c where upper(c.code) = v_coupon_clean for update;
    if found and v_coupon_row.is_active and v_subtotal >= v_coupon_row.min_order then
      if v_coupon_row.discount_type = 'percent' then
        v_discount := round((v_subtotal * v_coupon_row.value) / 100.0, 2);
      else
        v_discount := round(v_coupon_row.value, 2);
      end if;
      if v_coupon_row.max_discount is not null and v_discount > v_coupon_row.max_discount then
        v_discount := round(v_coupon_row.max_discount, 2);
      end if;
      if v_discount > v_subtotal then
        v_discount := v_subtotal;
      end if;
      update public.coupons set used_count = used_count + 1, updated_at = now() where id = v_coupon_row.id;
    else
      v_coupon_clean := '';
    end if;
  end if;

  select exists (
    select 1
    from unnest(coalesce(v_ds.free_cities, array['Sadiqabad'])) as fc
    where lower(btrim(fc)) = v_city_lower
  ) into v_is_free_city;

  if v_is_free_city or (v_ds.free_over_amount is not null and v_subtotal >= v_ds.free_over_amount) then
    v_delivery_charge := 0;
  else
    v_delivery_charge := coalesce(v_ds.flat_rate, 300.00);
  end if;

  v_total := greatest(0, round(v_subtotal - v_discount + v_delivery_charge, 2));
  v_payment_status := case when v_pay_method = 'cod' then 'cod_pending' else 'pending' end;

  insert into public.orders (
    customer_name,
    customer_phone,
    customer_email,
    city,
    address_line,
    address_notes,
    subtotal,
    discount,
    delivery_charge,
    total,
    coupon_code,
    payment_method,
    payment_status,
    status,
    customer_notes,
    admin_notes,
    placed_at
  )
  values (
    v_cust_name,
    v_cust_phone,
    v_cust_email,
    v_city,
    v_addr_line,
    v_addr_notes,
    v_subtotal,
    v_discount,
    v_delivery_charge,
    v_total,
    nullif(v_coupon_clean, ''),
    v_pay_method,
    v_payment_status,
    'confirmed',
    v_cust_notes,
    nullif(btrim(coalesce(p_admin_notes, '')), ''),
    now()
  )
  returning * into v_order;

  for v_req in
    select
      (elem->>'product_id')::uuid as product_id,
      sum(coalesce((elem->>'quantity')::int, 0))::int as qty
    from jsonb_array_elements(p_items) as elem
    group by (elem->>'product_id')::uuid
    order by (elem->>'product_id')::uuid asc
  loop
    select * into v_prod_row from public.products p where p.id = v_req.product_id;
    v_unit_price := case
      when v_prod_row.sale_price is not null and v_prod_row.sale_price > 0 then v_prod_row.sale_price
      else v_prod_row.price
    end;
    v_line_total := round(v_unit_price * v_req.qty, 2);

    insert into public.order_items (
      order_id, product_id, sku, name, name_i18n, unit_price, quantity, line_total
    )
    values (
      v_order.id,
      v_prod_row.id,
      v_prod_row.sku,
      coalesce(v_prod_row.name->>'en', v_prod_row.sku),
      v_prod_row.name,
      v_unit_price,
      v_req.qty,
      v_line_total
    );

    update public.products
       set stock_qty = stock_qty - v_req.qty,
           updated_at = now()
     where id = v_prod_row.id;

    insert into public.stock_movements (
      product_id, delta, reason, reference_type, reference_id, note, created_by
    )
    values (
      v_prod_row.id,
      -v_req.qty,
      'sale',
      'order',
      v_order.id,
      'Walk-in/Phone Order ' || v_order.order_no,
      auth.uid()
    );
  end loop;

  insert into public.order_status_history (
    order_id, from_status, to_status, note, changed_by
  )
  values (
    v_order.id, null, 'confirmed', 'Created by Admin (Phone / Walk-in Order)', auth.uid()
  );

  return jsonb_build_object(
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'total', v_order.total,
    'delivery_charge', v_order.delivery_charge,
    'payment_status', v_order.payment_status,
    'status', v_order.status
  );
end;
$$;

grant execute on function public.admin_create_order(jsonb, jsonb, text, text, text, text, text, text) to authenticated;

-- =============================================================================
-- 19. VERIFICATION BLOCK
-- =============================================================================
do $$
declare
  v_city_count int;
  v_ds_exists boolean;
begin
  select count(*) into v_city_count from public.pakistan_cities;
  select exists(select 1 from public.delivery_settings where id = 1) into v_ds_exists;
  raise notice 'Phase 6 verification: % Pakistan cities seeded, delivery_settings row id=1 exists: %', v_city_count, v_ds_exists;
end $$;

