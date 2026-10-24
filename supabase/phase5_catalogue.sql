-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 5 PARTS & ACCESSORIES CATALOGUE SQL
-- =============================================================================
-- Safe to run multiple times (idempotent).
-- Requires Phase 1 (profiles, vehicle_makes, vehicle_models, vehicles,
-- site_settings, is_admin_or_staff, set_updated_at) and Phase 2 (services).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. PRODUCT CATEGORIES
-- -----------------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid null references public.product_categories(id) on delete set null,
  slug text not null unique,
  name jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  description jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  image_url text null,
  icon text null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_categories_parent_id on public.product_categories(parent_id);
create index if not exists idx_product_categories_sort_order on public.product_categories(sort_order, created_at);
create index if not exists idx_product_categories_active on public.product_categories(is_active);

drop trigger if exists trg_product_categories_updated_at on public.product_categories;
create trigger trg_product_categories_updated_at
before update on public.product_categories
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 2. BRANDS
-- -----------------------------------------------------------------------------
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text null,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_active on public.brands(is_active, name);

drop trigger if exists trg_brands_updated_at on public.brands;
create trigger trg_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 3. PRODUCTS
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  slug text not null unique,
  name jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  short_description jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  description jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  specs jsonb not null default '[]'::jsonb,
  category_id uuid null references public.product_categories(id) on delete set null,
  brand_id uuid null references public.brands(id) on delete set null,
  part_origin text not null default 'aftermarket' check (
    part_origin in ('genuine_oem', 'japanese_imported', 'aftermarket', 'local')
  ),
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2) null check (compare_at_price is null or compare_at_price >= 0),
  cost_price numeric(12,2) null check (cost_price is null or cost_price >= 0),
  stock_qty int not null default 0 check (stock_qty >= 0),
  low_stock_threshold int not null default 3 check (low_stock_threshold >= 0),
  is_universal boolean not null default false,
  warranty text null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_products_category_id on public.products(category_id);
create index if not exists idx_products_brand_id on public.products(brand_id);
create index if not exists idx_products_active_featured on public.products(is_active, is_featured);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_products_stock_qty on public.products(stock_qty);
create index if not exists idx_products_part_origin on public.products(part_origin);
create index if not exists idx_products_is_universal on public.products(is_universal);

drop trigger if exists trg_products_updated_at on public.products;
create trigger trg_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 4. PRODUCT IMAGES
-- -----------------------------------------------------------------------------
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_images_product_id on public.product_images(product_id, is_primary desc, sort_order asc);

-- -----------------------------------------------------------------------------
-- 5. PRODUCT VEHICLES (COMPATIBILITY LINK TABLE)
-- -----------------------------------------------------------------------------
create table if not exists public.product_vehicles (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  make_id uuid not null references public.vehicle_makes(id) on delete cascade,
  model_id uuid null references public.vehicle_models(id) on delete cascade,
  year_from int null check (year_from is null or (year_from >= 1960 and year_from <= 2100)),
  year_to int null check (year_to is null or (year_to >= 1960 and year_to <= 2100)),
  fuel_type text null check (
    fuel_type is null or fuel_type in ('petrol', 'diesel', 'hybrid', 'cng', 'electric', 'other')
  ),
  notes text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_vehicles_product_id on public.product_vehicles(product_id);
create index if not exists idx_product_vehicles_make_model on public.product_vehicles(make_id, model_id);

-- -----------------------------------------------------------------------------
-- 6. PRODUCT SERVICES (INSTALLATION WORKSHOP SERVICES LINK TABLE)
-- -----------------------------------------------------------------------------
create table if not exists public.product_services (
  product_id uuid not null references public.products(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete cascade,
  primary key (product_id, service_id)
);

create index if not exists idx_product_services_service_id on public.product_services(service_id);

-- -----------------------------------------------------------------------------
-- 7. STOCK MOVEMENTS (AUDIT LOG)
-- -----------------------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  delta int not null,
  reason text not null check (
    reason in ('initial', 'restock', 'manual_adjustment', 'order_reserved', 'order_cancelled', 'used_in_job', 'damaged')
  ),
  reference_type text null,
  reference_id uuid null,
  note text null,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product_id on public.stock_movements(product_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 8. STORAGE BUCKET: product-images (public read, admin/staff write)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "product_images_storage_public_read" on storage.objects;
create policy "product_images_storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists "product_images_storage_admin_insert" on storage.objects;
create policy "product_images_storage_admin_insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'product-images' and public.is_admin_or_staff());

drop policy if exists "product_images_storage_admin_update" on storage.objects;
create policy "product_images_storage_admin_update"
on storage.objects
for update
to authenticated
using (bucket_id = 'product-images' and public.is_admin_or_staff())
with check (bucket_id = 'product-images' and public.is_admin_or_staff());

drop policy if exists "product_images_storage_admin_delete" on storage.objects;
create policy "product_images_storage_admin_delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'product-images' and public.is_admin_or_staff());

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
alter table public.product_categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_vehicles enable row level security;
alter table public.product_services enable row level security;
alter table public.stock_movements enable row level security;

-- product_categories: public reads active, admin/staff full CRUD
drop policy if exists "product_categories_public_read_active" on public.product_categories;
create policy "product_categories_public_read_active"
on public.product_categories
for select
to anon, authenticated
using (is_active = true or public.is_admin_or_staff());

drop policy if exists "product_categories_admin_insert" on public.product_categories;
create policy "product_categories_admin_insert"
on public.product_categories
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "product_categories_admin_update" on public.product_categories;
create policy "product_categories_admin_update"
on public.product_categories
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "product_categories_admin_delete" on public.product_categories;
create policy "product_categories_admin_delete"
on public.product_categories
for delete
to authenticated
using (public.is_admin_or_staff());

-- brands: public reads active, admin/staff full CRUD
drop policy if exists "brands_public_read_active" on public.brands;
create policy "brands_public_read_active"
on public.brands
for select
to anon, authenticated
using (is_active = true or public.is_admin_or_staff());

drop policy if exists "brands_admin_insert" on public.brands;
create policy "brands_admin_insert"
on public.brands
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "brands_admin_update" on public.brands;
create policy "brands_admin_update"
on public.brands
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "brands_admin_delete" on public.brands;
create policy "brands_admin_delete"
on public.brands
for delete
to authenticated
using (public.is_admin_or_staff());

-- products: public reads active, admin/staff full CRUD
drop policy if exists "products_public_read_active" on public.products;
create policy "products_public_read_active"
on public.products
for select
to anon, authenticated
using (is_active = true or public.is_admin_or_staff());

drop policy if exists "products_admin_insert" on public.products;
create policy "products_admin_insert"
on public.products
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "products_admin_update" on public.products;
create policy "products_admin_update"
on public.products
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "products_admin_delete" on public.products;
create policy "products_admin_delete"
on public.products
for delete
to authenticated
using (public.is_admin_or_staff());

-- product_images: public reads images for active products, admin/staff full CRUD
drop policy if exists "product_images_public_read" on public.product_images;
create policy "product_images_public_read"
on public.product_images
for select
to anon, authenticated
using (
  public.is_admin_or_staff()
  or exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.is_active = true
  )
);

drop policy if exists "product_images_admin_insert" on public.product_images;
create policy "product_images_admin_insert"
on public.product_images
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "product_images_admin_update" on public.product_images;
create policy "product_images_admin_update"
on public.product_images
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "product_images_admin_delete" on public.product_images;
create policy "product_images_admin_delete"
on public.product_images
for delete
to authenticated
using (public.is_admin_or_staff());

-- product_vehicles: public reads compatibility for active products, admin/staff full CRUD
drop policy if exists "product_vehicles_public_read" on public.product_vehicles;
create policy "product_vehicles_public_read"
on public.product_vehicles
for select
to anon, authenticated
using (
  public.is_admin_or_staff()
  or exists (
    select 1 from public.products p
    where p.id = product_vehicles.product_id
      and p.is_active = true
  )
);

drop policy if exists "product_vehicles_admin_insert" on public.product_vehicles;
create policy "product_vehicles_admin_insert"
on public.product_vehicles
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "product_vehicles_admin_update" on public.product_vehicles;
create policy "product_vehicles_admin_update"
on public.product_vehicles
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "product_vehicles_admin_delete" on public.product_vehicles;
create policy "product_vehicles_admin_delete"
on public.product_vehicles
for delete
to authenticated
using (public.is_admin_or_staff());

-- product_services: public reads service links for active products, admin/staff full CRUD
drop policy if exists "product_services_public_read" on public.product_services;
create policy "product_services_public_read"
on public.product_services
for select
to anon, authenticated
using (
  public.is_admin_or_staff()
  or exists (
    select 1 from public.products p
    where p.id = product_services.product_id
      and p.is_active = true
  )
);

drop policy if exists "product_services_admin_insert" on public.product_services;
create policy "product_services_admin_insert"
on public.product_services
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "product_services_admin_update" on public.product_services;
create policy "product_services_admin_update"
on public.product_services
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "product_services_admin_delete" on public.product_services;
create policy "product_services_admin_delete"
on public.product_services
for delete
to authenticated
using (public.is_admin_or_staff());

-- stock_movements: admin/staff only
drop policy if exists "stock_movements_admin_select" on public.stock_movements;
create policy "stock_movements_admin_select"
on public.stock_movements
for select
to authenticated
using (public.is_admin_or_staff());

drop policy if exists "stock_movements_admin_insert" on public.stock_movements;
create policy "stock_movements_admin_insert"
on public.stock_movements
for insert
to authenticated
with check (public.is_admin_or_staff());

drop policy if exists "stock_movements_admin_update" on public.stock_movements;
create policy "stock_movements_admin_update"
on public.stock_movements
for update
to authenticated
using (public.is_admin_or_staff())
with check (public.is_admin_or_staff());

drop policy if exists "stock_movements_admin_delete" on public.stock_movements;
create policy "stock_movements_admin_delete"
on public.stock_movements
for delete
to authenticated
using (public.is_admin_or_staff());

-- -----------------------------------------------------------------------------
-- 10. RPC: search_products
-- -----------------------------------------------------------------------------
-- Public SECURITY DEFINER RPC for searching & filtering active products.
-- Supports:
--   - Text search across SKU and localized names/short_description (en/ur/ur-roman)
--   - Category filter (matches selected category or its direct child subcategories)
--   - Multi-brand filter (p_brand_ids)
--   - Multi-part-origin filter (p_part_origins)
--   - Price range (p_price_min, p_price_max)
--   - In-stock only toggle (p_in_stock_only)
--   - Vehicle compatibility filter (p_make_id, p_model_id, p_year, p_fuel_type, p_include_universal)
--   - Sorting: featured, price_asc, price_desc, newest, name_asc
--   - Pagination: p_page, p_page_size
-- Returns jsonb: { items: [...], total_count, page, page_size }
-- Note: NEVER exposes cost_price to public callers.
-- -----------------------------------------------------------------------------
create or replace function public.search_products(
  p_query text default null,
  p_category_id uuid default null,
  p_brand_ids uuid[] default null,
  p_part_origins text[] default null,
  p_price_min numeric default null,
  p_price_max numeric default null,
  p_in_stock_only boolean default false,
  p_make_id uuid default null,
  p_model_id uuid default null,
  p_year int default null,
  p_fuel_type text default null,
  p_include_universal boolean default true,
  p_sort text default 'featured',
  p_page int default 1,
  p_page_size int default 12
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_q text := nullif(btrim(coalesce(p_query, '')), '');
  v_page int := greatest(coalesce(p_page, 1), 1);
  v_page_size int := least(greatest(coalesce(p_page_size, 12), 1), 100);
  v_offset int := (v_page - 1) * v_page_size;
  v_total int := 0;
  v_items jsonb := '[]'::jsonb;
begin
  with matched as (
    select
      p.id,
      p.sku,
      p.slug,
      p.name,
      p.short_description,
      p.category_id,
      c.slug as category_slug,
      c.name as category_name,
      c.icon as category_icon,
      p.brand_id,
      b.name as brand_name,
      b.slug as brand_slug,
      b.logo_url as brand_logo_url,
      p.part_origin,
      p.price,
      p.compare_at_price,
      p.stock_qty,
      p.low_stock_threshold,
      p.is_universal,
      p.warranty,
      p.is_featured,
      p.is_demo,
      p.created_at,
      (
        select pi.url
        from public.product_images pi
        where pi.product_id = p.id
        order by pi.is_primary desc, pi.sort_order asc, pi.created_at asc
        limit 1
      ) as primary_image_url,
      (
        select pi.alt
        from public.product_images pi
        where pi.product_id = p.id
        order by pi.is_primary desc, pi.sort_order asc, pi.created_at asc
        limit 1
      ) as primary_image_alt,
      case
        when p_make_id is not null and exists (
          select 1
          from public.product_vehicles pv
          where pv.product_id = p.id
            and pv.make_id = p_make_id
            and (p_model_id is null or pv.model_id is null or pv.model_id = p_model_id)
            and (p_year is null or (
              (pv.year_from is null or pv.year_from <= p_year)
              and (pv.year_to is null or pv.year_to >= p_year)
            ))
            and (p_fuel_type is null or p_fuel_type = '' or pv.fuel_type is null or pv.fuel_type = p_fuel_type)
        ) then true
        else false
      end as matches_selected_vehicle
    from public.products p
    left join public.product_categories c on c.id = p.category_id
    left join public.brands b on b.id = p.brand_id
    where p.is_active = true
      and (p.category_id is null or c.is_active = true)
      and (p.brand_id is null or b.is_active = true)
      -- Search query filter
      and (
        v_q is null
        or p.sku ilike '%' || v_q || '%'
        or coalesce(p.name->>'en', '') ilike '%' || v_q || '%'
        or coalesce(p.name->>'ur', '') ilike '%' || v_q || '%'
        or coalesce(p.name->>'ur-roman', '') ilike '%' || v_q || '%'
        or coalesce(p.short_description->>'en', '') ilike '%' || v_q || '%'
        or coalesce(p.short_description->>'ur', '') ilike '%' || v_q || '%'
        or coalesce(p.short_description->>'ur-roman', '') ilike '%' || v_q || '%'
        or coalesce(b.name, '') ilike '%' || v_q || '%'
      )
      -- Category filter (selected category or its subcategories)
      and (
        p_category_id is null
        or p.category_id = p_category_id
        or c.parent_id = p_category_id
      )
      -- Brand filter
      and (
        p_brand_ids is null
        or cardinality(p_brand_ids) = 0
        or p.brand_id = any(p_brand_ids)
      )
      -- Part origin filter
      and (
        p_part_origins is null
        or cardinality(p_part_origins) = 0
        or p.part_origin = any(p_part_origins)
      )
      -- Price range
      and (p_price_min is null or p.price >= p_price_min)
      and (p_price_max is null or p.price <= p_price_max)
      -- Stock filter
      and (not coalesce(p_in_stock_only, false) or p.stock_qty > 0)
      -- Vehicle compatibility filter
      and (
        p_make_id is null
        or (coalesce(p_include_universal, true) and p.is_universal = true)
        or exists (
          select 1
          from public.product_vehicles pv
          where pv.product_id = p.id
            and pv.make_id = p_make_id
            and (p_model_id is null or pv.model_id is null or pv.model_id = p_model_id)
            and (p_year is null or (
              (pv.year_from is null or pv.year_from <= p_year)
              and (pv.year_to is null or pv.year_to >= p_year)
            ))
            and (p_fuel_type is null or p_fuel_type = '' or pv.fuel_type is null or pv.fuel_type = p_fuel_type)
        )
      )
  ),
  counted as (
    select count(*)::int as cnt from matched
  ),
  paged as (
    select m.*
    from matched m
    order by
      case when p_sort = 'featured' then (case when m.is_featured then 0 else 1 end) else 0 end asc,
      case when p_sort = 'featured' and p_make_id is not null then (case when m.matches_selected_vehicle then 0 else 1 end) else 0 end asc,
      case when p_sort = 'price_asc' then m.price end asc nulls last,
      case when p_sort = 'price_desc' then m.price end desc nulls last,
      case when p_sort = 'newest' then m.created_at end desc nulls last,
      case when p_sort = 'name_asc' then lower(coalesce(m.name->>'en', '')) end asc nulls last,
      m.is_featured desc,
      m.created_at desc,
      m.id asc
    limit v_page_size
    offset v_offset
  )
  select
    coalesce((select cnt from counted), 0),
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'id', pg.id,
            'sku', pg.sku,
            'slug', pg.slug,
            'name', pg.name,
            'short_description', pg.short_description,
            'category_id', pg.category_id,
            'category_slug', pg.category_slug,
            'category_name', pg.category_name,
            'category_icon', pg.category_icon,
            'brand_id', pg.brand_id,
            'brand_name', pg.brand_name,
            'brand_slug', pg.brand_slug,
            'brand_logo_url', pg.brand_logo_url,
            'part_origin', pg.part_origin,
            'price', pg.price,
            'compare_at_price', pg.compare_at_price,
            'stock_qty', pg.stock_qty,
            'low_stock_threshold', pg.low_stock_threshold,
            'is_universal', pg.is_universal,
            'warranty', pg.warranty,
            'is_featured', pg.is_featured,
            'is_demo', pg.is_demo,
            'primary_image_url', pg.primary_image_url,
            'primary_image_alt', pg.primary_image_alt,
            'matches_selected_vehicle', pg.matches_selected_vehicle,
            'created_at', pg.created_at
          )
        )
        from paged pg
      ),
      '[]'::jsonb
    )
  into v_total, v_items;

  return jsonb_build_object(
    'items', v_items,
    'total_count', v_total,
    'page', v_page,
    'page_size', v_page_size
  );
end;
$$;

grant execute on function public.search_products(
  text, uuid, uuid[], text[], numeric, numeric, boolean, uuid, uuid, int, text, boolean, text, int, int
) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 11. RPC: admin_adjust_stock
-- -----------------------------------------------------------------------------
-- Admin/staff SECURITY DEFINER RPC that atomically adjusts products.stock_qty
-- (forbidding resulting stock_qty < 0) and writes an audit row into stock_movements.
-- -----------------------------------------------------------------------------
create or replace function public.admin_adjust_stock(
  p_product_id uuid,
  p_delta int,
  p_reason text,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old_qty int;
  v_new_qty int;
  v_movement_id uuid;
begin
  if not public.is_admin_or_staff() then
    raise exception 'Unauthorized: admin or staff role required.';
  end if;

  if p_product_id is null then
    raise exception 'Product ID is required.';
  end if;

  if p_delta is null or p_delta = 0 then
    raise exception 'Stock adjustment delta must be a non-zero integer.';
  end if;

  if p_reason is null or p_reason not in (
    'initial', 'restock', 'manual_adjustment', 'order_reserved', 'order_cancelled', 'used_in_job', 'damaged'
  ) then
    raise exception 'Invalid stock movement reason: %', coalesce(p_reason, 'null');
  end if;

  select stock_qty
  into v_old_qty
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Product not found.';
  end if;

  v_new_qty := v_old_qty + p_delta;

  if v_new_qty < 0 then
    raise exception 'Insufficient stock: current stock is %, cannot change by %.', v_old_qty, p_delta;
  end if;

  update public.products
  set
    stock_qty = v_new_qty,
    updated_at = now()
  where id = p_product_id;

  insert into public.stock_movements (
    product_id,
    delta,
    reason,
    reference_type,
    note,
    created_by
  )
  values (
    p_product_id,
    p_delta,
    p_reason,
    'admin_adjustment',
    nullif(btrim(coalesce(p_note, '')), ''),
    auth.uid()
  )
  returning id into v_movement_id;

  return jsonb_build_object(
    'ok', true,
    'movement_id', v_movement_id,
    'product_id', p_product_id,
    'previous_stock_qty', v_old_qty,
    'new_stock_qty', v_new_qty,
    'delta', p_delta,
    'reason', p_reason
  );
end;
$$;

grant execute on function public.admin_adjust_stock(uuid, int, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 12. SEED 11 TOP-LEVEL PRODUCT CATEGORIES (Structural Reference Data)
-- -----------------------------------------------------------------------------
-- Uses ON CONFLICT (slug) DO NOTHING so admin edits are never overwritten.
-- is_demo = false (core structural taxonomy).
-- -----------------------------------------------------------------------------
insert into public.product_categories (
  slug,
  name,
  description,
  icon,
  sort_order,
  is_active,
  is_demo
)
values
  (
    'engine-parts',
    jsonb_build_object(
      'en', 'Engine Parts',
      'ur', 'انجن پارٹس',
      'ur-roman', 'Engine Parts'
    ),
    jsonb_build_object(
      'en', 'Spark plugs, timing belts, mounts, gaskets, coils, and precision internal engine components.',
      'ur', 'اسپارک پلگ، ٹائمنگ بیلٹ، ماؤنٹس، گیسکٹ، کوائلز اور انجن کے دیگر اہم پرزے۔',
      'ur-roman', 'Spark plugs, timing belts, mounts, gaskets, coils aur engine ke ahem purzay.'
    ),
    'Cog',
    1,
    true,
    false
  ),
  (
    'oils-lubricants',
    jsonb_build_object(
      'en', 'Oils & Lubricants',
      'ur', 'آئلز اور لبریکنٹس',
      'ur-roman', 'Oils & Lubricants'
    ),
    jsonb_build_object(
      'en', 'Fully synthetic and mineral motor oils, ATF/CVT transmission fluids, brake fluids, and long-life coolants.',
      'ur', 'سنتھیٹک اور منرل انجن آئل، گیئر آئل، بریک آئل اور کولنٹ۔',
      'ur-roman', 'Synthetic aur mineral engine oil, CVT/ATF gear oil, brake fluid aur coolant.'
    ),
    'Droplet',
    2,
    true,
    false
  ),
  (
    'filters',
    jsonb_build_object(
      'en', 'Filters (Oil, Air, Cabin, Fuel)',
      'ur', 'فلٹرز (آئل، ایئر، کیبن، فیول)',
      'ur-roman', 'Filters (Oil, Air, Cabin, Fuel)'
    ),
    jsonb_build_object(
      'en', 'Genuine and high-efficiency oil filters, engine air filters, AC cabin filters, and fuel filters.',
      'ur', 'اصلی اور معیاری آئل فلٹر، ایئر فلٹر، اے سی کیبن فلٹر اور فیول فلٹر۔',
      'ur-roman', 'Genuine aur high-efficiency oil filter, air filter, AC cabin filter aur fuel filter.'
    ),
    'Filter',
    3,
    true,
    false
  ),
  (
    'brakes',
    jsonb_build_object(
      'en', 'Brakes (Pads, Discs, Shoes)',
      'ur', 'بریکس (پیڈز، ڈسک، شوز)',
      'ur-roman', 'Brakes (Pads, Discs, Shoes)'
    ),
    jsonb_build_object(
      'en', 'Ceramic and OEM brake pads, ventilated brake discs/rotors, rear brake shoes, and wheel cylinders.',
      'ur', 'سیرامک اور معیاری بریک پیڈز، بریک ڈسک روٹرز اور بریک شوز۔',
      'ur-roman', 'Ceramic aur OEM brake pads, ventilated brake discs/rotors aur rear brake shoes.'
    ),
    'Disc3',
    4,
    true,
    false
  ),
  (
    'suspension-steering',
    jsonb_build_object(
      'en', 'Suspension & Steering',
      'ur', 'سسپنشن اور اسٹیئرنگ',
      'ur-roman', 'Suspension & Steering'
    ),
    jsonb_build_object(
      'en', 'Shock absorbers, stabilizer links, control arms, ball joints, tie-rod ends, and rack boots.',
      'ur', 'شاک ایبزاربرز، اسٹیبلائزر لنکس، کنٹرول آرمز، بال جوائنٹس اور ٹائی راڈ اینڈز۔',
      'ur-roman', 'Shock absorbers, stabilizer links, control arms, ball joints aur tie-rod ends.'
    ),
    'Wrench',
    5,
    true,
    false
  ),
  (
    'electrical-lighting',
    jsonb_build_object(
      'en', 'Electrical & Lighting',
      'ur', 'الیکٹریکل اور لائٹنگ',
      'ur-roman', 'Electrical & Lighting'
    ),
    jsonb_build_object(
      'en', 'LED and halogen headlight bulbs, sensors, relays, fuses, horns, and alternator components.',
      'ur', 'ایل ای ڈی اور ہیلوجن ہیڈ لائٹ بلب، سینسرز، ریلے، فیوز اور ہارن۔',
      'ur-roman', 'LED aur halogen headlight bulbs, sensors, relays, fuses aur horns.'
    ),
    'Zap',
    6,
    true,
    false
  ),
  (
    'batteries',
    jsonb_build_object(
      'en', 'Batteries',
      'ur', 'بیٹریاں',
      'ur-roman', 'Batteries'
    ),
    jsonb_build_object(
      'en', 'Maintenance-free dry and lead-acid automotive batteries, hybrid auxiliary batteries, and terminals.',
      'ur', 'مینٹیننس فری ڈرائی اور تیزاب والی کار بیٹریاں اور ٹرمینلز۔',
      'ur-roman', 'Maintenance-free dry aur lead-acid car batteries aur terminals.'
    ),
    'BatteryCharging',
    7,
    true,
    false
  ),
  (
    'tyres-wheels',
    jsonb_build_object(
      'en', 'Tyres & Wheels',
      'ur', 'ٹائرز اور ویلز',
      'ur-roman', 'Tyres & Wheels'
    ),
    jsonb_build_object(
      'en', 'Touring and radial tyres, tubeless valves, wheel nuts, and balancing weights for sedans, hatchbacks, and SUVs.',
      'ur', 'معیاری ٹائر، ٹیوب لیس والوز، ویل نٹس اور بیلنسنگ ویٹس۔',
      'ur-roman', 'Touring aur radial tyres, tubeless valves, wheel nuts aur balancing weights.'
    ),
    'CircleDot',
    8,
    true,
    false
  ),
  (
    'ac-cooling',
    jsonb_build_object(
      'en', 'AC & Cooling',
      'ur', 'اے سی اور کولنگ',
      'ur-roman', 'AC & Cooling'
    ),
    jsonb_build_object(
      'en', 'AC condensers, evaporator coils, compressor valves, radiators, thermostat valves, and R134a refrigerant.',
      'ur', 'اے سی کنڈینسر، ایویپوریٹر کوائل، کمپریسر والو، ریڈی ایٹر اور تھرموسٹیٹ والو۔',
      'ur-roman', 'AC condensers, evaporator coils, compressor valves, radiators aur thermostat valves.'
    ),
    'Snowflake',
    9,
    true,
    false
  ),
  (
    'body-exterior-accessories',
    jsonb_build_object(
      'en', 'Body & Exterior Accessories',
      'ur', 'باڈی اور ایکسٹیریئر ایکسیسریز',
      'ur-roman', 'Body & Exterior Accessories'
    ),
    jsonb_build_object(
      'en', 'Silicone wiper blades, side mirrors, door visors, mud flaps, bumper clips, and weather covers.',
      'ur', 'سلیکون وائپر بلیڈز، سائیڈ مررز، ڈور وائزرز، مڈ فلیپس اور کار کورز۔',
      'ur-roman', 'Silicone wiper blades, side mirrors, door visors, mud flaps aur car covers.'
    ),
    'Shield',
    10,
    true,
    false
  ),
  (
    'interior-car-care',
    jsonb_build_object(
      'en', 'Car Care & Accessories',
      'ur', 'کار کیئر اور لوازمات',
      'ur-roman', 'Car Care & Accessories'
    ),
    jsonb_build_object(
      'en', 'Microfiber towels, dashboard protectants, ceramic wash shampoos, and car fresheners.',
      'ur', 'مائیکرو فائبر ٹاولز، ڈیش بورڈ پالش، کار شیمپو اور ایئر فریشنرز۔',
      'ur-roman', 'Microfiber towels, dashboard polish, car shampoo aur air fresheners.'
    ),
    'Sparkles',
    11,
    true,
    false
  ),
  (
    'wipers',
    jsonb_build_object(
      'en', 'Wipers',
      'ur', 'وائپرز',
      'ur-roman', 'Wipers'
    ),
    jsonb_build_object(
      'en', 'All-weather silicone and hybrid windscreen wiper blades.',
      'ur', 'سلیکون اور ہائبرڈ ونڈ اسکرین وائپر بلیڈز۔',
      'ur-roman', 'Silicone aur hybrid windscreen wiper blades.'
    ),
    'Shield',
    12,
    true,
    false
  ),
  (
    'belts-cooling',
    jsonb_build_object(
      'en', 'Belts & Cooling',
      'ur', 'بیلٹس اور کولنگ',
      'ur-roman', 'Belts & Cooling'
    ),
    jsonb_build_object(
      'en', 'Timing belts, serpentine fan belts, water pumps, and radiators.',
      'ur', 'ٹائمنگ بیلٹ، فین بیلٹ، واٹر پمپ اور ریڈی ایٹر۔',
      'ur-roman', 'Timing belts, fan belts, water pumps aur radiators.'
    ),
    'Cog',
    13,
    true,
    false
  ),
  (
    'exhaust-intake',
    jsonb_build_object(
      'en', 'Exhaust & Intake',
      'ur', 'ایگزاسٹ اور انٹیک',
      'ur-roman', 'Exhaust & Intake'
    ),
    jsonb_build_object(
      'en', 'Exhaust silencers, catalytic converters, and air intake hoses.',
      'ur', 'ایگزاسٹ سائلنسر، کیٹلیٹک کنورٹر اور انٹیک ہوز۔',
      'ur-roman', 'Exhaust silencer, catalytic converter aur intake pipes.'
    ),
    'Shield',
    14,
    true,
    false
  ),
  (
    'seat-covers-mats',
    jsonb_build_object(
      'en', 'Seat Covers & Mats',
      'ur', 'سیٹ کورز اور میٹس',
      'ur-roman', 'Seat Covers & Mats'
    ),
    jsonb_build_object(
      'en', 'Custom fit seat covers, 7D floor mats, and trunk trays.',
      'ur', 'کسٹم سیٹ کورز، 7D فلور میٹس اور ڈگی ٹرے۔',
      'ur-roman', 'Custom seat covers, 7D floor mats aur trunk liners.'
    ),
    'Armchair',
    15,
    true,
    false
  ),
  (
    'tools-equipment',
    jsonb_build_object(
      'en', 'Tools & Equipment',
      'ur', 'اوزار اور آلات',
      'ur-roman', 'Tools & Equipment'
    ),
    jsonb_build_object(
      'en', 'Hydraulic bottle jacks, socket sets, tyre inflators, and wrenches.',
      'ur', 'ہائیڈرولک جیک، اسپیڈ پمپ، ٹائر پریشر گیج اور ٹول سیٹس۔',
      'ur-roman', 'Hydraulic jacks, tyre inflators aur tool sets.'
    ),
    'Wrench',
    16,
    true,
    false
  )
on conflict (slug) do nothing;
