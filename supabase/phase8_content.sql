-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 8: CONTENT & TRUST SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--   4. supabase/phase4_jobs.sql
--   5. supabase/phase5_catalogue.sql
--   6. supabase/phase6_orders.sql
--   7. supabase/phase7_payments.sql
--
-- What this script creates:
--   1. vehicle_models vehicle_class column & model classification
--   2. blog_categories table, RLS, and triggers
--   3. blog_posts table, indexes, RLS, and triggers
--   4. estimator_rules table, RLS, and seed multipliers
--   5. reviews table & public_reviews view
--   6. review_contacts table (admin-only, phone hash for verification)
--   7. RPC submit_review (rate limiting, automatic completed order/job/booking verification)
--   8. RPC get_review_summary (average rating, distribution, total)
--   9. gallery_items table, category check, RLS, and triggers
--   10. Storage bucket policies for blog/ and gallery/ assets
-- =============================================================================

-- =============================================================================
-- 1. VEHICLE MODELS EXTENSION: VEHICLE CLASS
-- =============================================================================
alter table public.vehicle_models
  add column if not exists vehicle_class text check (vehicle_class in ('hatchback', 'sedan', 'suv', 'pickup', 'van'));

-- Seed sensible vehicle classes for popular Pakistani vehicle models
update public.vehicle_models
set vehicle_class = case
  when slug in ('alto', 'cultus', 'wagon-r', 'swift', 'mehran', 'vitz', 'aqua', 'mira', 'move', 'passo', 'dayz', 'n-one', 'n-box', 'hustler', 'picanto', 'stonic') then 'hatchback'
  when slug in ('corolla', 'yaris', 'civic', 'city', 'alsvin', 'elantra', 'sonata', 'prius', 'accord', 'camry') then 'sedan'
  when slug in ('sportage', 'tucson', 'br-v', 'fortuner', 'prado', 'land-cruiser', 'vezel', 'hr-v', 'santa-fe', 'sorento', 'oada-5', 'haval-h6', 'haval-jolion', 'mg-hs', 'mg-zs') then 'suv'
  when slug in ('hilux', 'hilux-revo', 'd-max', 'isuzu-dmax') then 'pickup'
  when slug in ('bolan', 'every', 'hijet', 'hiace', 'karvaan', 'grand-cabin', 'apv') then 'van'
  else coalesce(vehicle_class, 'sedan')
end
where vehicle_class is null;

-- =============================================================================
-- 2. BLOG CATEGORIES
-- =============================================================================
create table if not exists public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_categories_sort on public.blog_categories(sort_order, created_at);
create index if not exists idx_blog_categories_active on public.blog_categories(is_active);

drop trigger if exists trg_blog_categories_updated_at on public.blog_categories;
create trigger trg_blog_categories_updated_at
before update on public.blog_categories
for each row execute function public.set_updated_at();

alter table public.blog_categories enable row level security;

drop policy if exists "Public can view active blog categories" on public.blog_categories;
create policy "Public can view active blog categories"
  on public.blog_categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert blog categories" on public.blog_categories;
create policy "Admins can insert blog categories"
  on public.blog_categories for insert
  with check (public.is_admin());

drop policy if exists "Admins can update blog categories" on public.blog_categories;
create policy "Admins can update blog categories"
  on public.blog_categories for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete blog categories" on public.blog_categories;
create policy "Admins can delete blog categories"
  on public.blog_categories for delete
  using (public.is_admin());

-- =============================================================================
-- 3. BLOG POSTS
-- =============================================================================
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  excerpt jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  content jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  cover_image_url text null,
  category_id uuid null references public.blog_categories(id) on delete set null,
  tags text[] not null default '{}',
  author_name text not null default 'Pak Auto Works Team',
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  related_service_ids uuid[] not null default '{}',
  related_category_ids uuid[] not null default '{}',
  seo_title jsonb null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  seo_description jsonb null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_blog_posts_published on public.blog_posts(is_published, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts(slug);
create index if not exists idx_blog_posts_category on public.blog_posts(category_id);
create index if not exists idx_blog_posts_demo on public.blog_posts(is_demo);

drop trigger if exists trg_blog_posts_updated_at on public.blog_posts;
create trigger trg_blog_posts_updated_at
before update on public.blog_posts
for each row execute function public.set_updated_at();

alter table public.blog_posts enable row level security;

drop policy if exists "Public can view published blog posts" on public.blog_posts;
create policy "Public can view published blog posts"
  on public.blog_posts for select
  using ((is_published = true and published_at <= now()) or public.is_admin());

drop policy if exists "Admins can insert blog posts" on public.blog_posts;
create policy "Admins can insert blog posts"
  on public.blog_posts for insert
  with check (public.is_admin());

drop policy if exists "Admins can update blog posts" on public.blog_posts;
create policy "Admins can update blog posts"
  on public.blog_posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete blog posts" on public.blog_posts;
create policy "Admins can delete blog posts"
  on public.blog_posts for delete
  using (public.is_admin());

-- =============================================================================
-- 4. ESTIMATOR RULES
-- =============================================================================
create table if not exists public.estimator_rules (
  id uuid primary key default gen_random_uuid(),
  vehicle_class text unique not null check (vehicle_class in ('hatchback', 'sedan', 'suv', 'pickup', 'van')),
  label jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  multiplier numeric(4,2) not null default 1.00 check (multiplier >= 0.50 and multiplier <= 5.00),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.estimator_rules enable row level security;

drop policy if exists "Public can view estimator rules" on public.estimator_rules;
create policy "Public can view estimator rules"
  on public.estimator_rules for select
  using (true);

drop policy if exists "Admins can insert estimator rules" on public.estimator_rules;
create policy "Admins can insert estimator rules"
  on public.estimator_rules for insert
  with check (public.is_admin());

drop policy if exists "Admins can update estimator rules" on public.estimator_rules;
create policy "Admins can update estimator rules"
  on public.estimator_rules for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete estimator rules" on public.estimator_rules;
create policy "Admins can delete estimator rules"
  on public.estimator_rules for delete
  using (public.is_admin());

-- Seed baseline estimator rules
insert into public.estimator_rules (vehicle_class, label, multiplier, sort_order)
values
  ('hatchback', '{"en": "Hatchback (Small / Kei Car)", "ur": "ہیچ بیک (چھوٹی کار)", "ur-roman": "Hatchback (Chhoti Gaari)"}'::jsonb, 0.90, 1),
  ('sedan',     '{"en": "Sedan (Standard 4-Door)", "ur": "سیڈان (معیاری کار)", "ur-roman": "Sedan (Standard Gaari)"}'::jsonb, 1.00, 2),
  ('suv',       '{"en": "SUV / Crossover (4x4)", "ur": "ایس یو وی / کراس اوور", "ur-roman": "SUV / Crossover"}'::jsonb, 1.30, 3),
  ('pickup',    '{"en": "Pickup / 4x4 Commercial", "ur": "پک اپ / کمرشل", "ur-roman": "Pickup / Commercial"}'::jsonb, 1.35, 4),
  ('van',       '{"en": "Van / MPV / Minivan", "ur": "وین / ایم پی وی", "ur-roman": "Van / MPV"}'::jsonb, 1.25, 5)
on conflict (vehicle_class) do update
set
  label = excluded.label,
  multiplier = excluded.multiplier,
  sort_order = excluded.sort_order;

-- =============================================================================
-- 5. REVIEWS & REVIEW CONTACTS
-- =============================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete set null,
  reviewer_name text not null,
  rating int not null check (rating >= 1 and rating <= 5),
  title text null,
  body text not null check (char_length(btrim(body)) >= 10 and char_length(body) <= 1200),
  service_id uuid null references public.services(id) on delete set null,
  language text not null default 'en',
  status text not null check (status in ('pending', 'approved', 'hidden')) default 'pending',
  is_verified boolean not null default false,
  admin_reply jsonb null,
  ip_hash text null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reviews_status_created on public.reviews(status, created_at desc);
create index if not exists idx_reviews_service on public.reviews(service_id);
create index if not exists idx_reviews_rating on public.reviews(rating);
create index if not exists idx_reviews_user on public.reviews(user_id);
create index if not exists idx_reviews_demo on public.reviews(is_demo);

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- Contact verification hash storage (Admin-only / RPC internal, never exposed to public)
create table if not exists public.review_contacts (
  review_id uuid primary key references public.reviews(id) on delete cascade,
  phone_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_review_contacts_hash on public.review_contacts(phone_hash);

alter table public.review_contacts enable row level security;

drop policy if exists "Admins can view review contacts" on public.review_contacts;
create policy "Admins can view review contacts"
  on public.review_contacts for all
  using (public.is_admin());

-- Secure public view that completely excludes ip_hash and any internal metadata
create or replace view public.public_reviews as
select
  r.id,
  r.reviewer_name,
  r.rating,
  r.title,
  r.body,
  r.service_id,
  r.language,
  r.status,
  r.is_verified,
  r.admin_reply,
  r.is_demo,
  r.created_at,
  r.updated_at
from public.reviews r
where r.status = 'approved';

alter table public.reviews enable row level security;

drop policy if exists "Public can select approved reviews" on public.reviews;
create policy "Public can select approved reviews"
  on public.reviews for select
  using (status = 'approved' or public.is_admin());

drop policy if exists "Admins can manage all reviews" on public.reviews;
create policy "Admins can manage all reviews"
  on public.reviews for all
  using (public.is_admin());

-- =============================================================================
-- 6. RPC: SUBMIT REVIEW (Rate limited, verified badge calculation)
-- =============================================================================
create or replace function public.submit_review(
  p_name text,
  p_rating int,
  p_title text,
  p_body text,
  p_service_id uuid default null,
  p_phone text default null,
  p_language text default 'en'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_title text;
  v_body text;
  v_phone_clean text;
  v_phone_last10 text;
  v_phone_hash text;
  v_is_verified boolean := false;
  v_client_ip text;
  v_ip_hash text;
  v_reviews_today_ip int := 0;
  v_reviews_recent_phone int := 0;
  v_new_review_id uuid;
begin
  v_name := btrim(coalesce(p_name, ''));
  v_title := nullif(btrim(coalesce(p_title, '')), '');
  v_body := btrim(coalesce(p_body, ''));

  -- 1. Validation
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Please provide a valid reviewer name (2 to 80 characters).';
  end if;

  if p_rating is null or p_rating < 1 or p_rating > 5 then
    raise exception 'Rating must be between 1 and 5 stars.';
  end if;

  if char_length(v_body) < 10 or char_length(v_body) > 1200 then
    raise exception 'Review text must be between 10 and 1200 characters.';
  end if;

  -- 2. IP hash calculation for rate limiting
  begin
    v_client_ip := current_setting('request.headers', true)::json->>'x-forwarded-for';
    if v_client_ip is not null then
      v_client_ip := split_part(v_client_ip, ',', 1);
    end if;
  exception when others then
    v_client_ip := null;
  end;

  if v_client_ip is not null and btrim(v_client_ip) <> '' then
    v_ip_hash := md5(btrim(v_client_ip) || '_review_salt');
  else
    v_ip_hash := md5(v_name || coalesce(p_language, 'en') || current_date::text);
  end if;

  -- Max 3 reviews per day per IP
  select count(*)
  into v_reviews_today_ip
  from public.reviews
  where ip_hash = v_ip_hash
    and created_at >= now() - interval '24 hours';

  if v_reviews_today_ip >= 3 then
    raise exception 'You have reached the review submission limit for today. Thank you!';
  end if;

  -- 3. Phone verification check (Optional phone provided)
  v_phone_clean := btrim(coalesce(p_phone, ''));
  if v_phone_clean <> '' then
    v_phone_last10 := public.normalize_phone_last10(v_phone_clean);
    v_phone_hash := md5(v_phone_last10 || '_phone_salt');

    -- Max 1 review per phone per service per 30 days
    select count(*)
    into v_reviews_recent_phone
    from public.review_contacts rc
    join public.reviews r on r.id = rc.review_id
    where rc.phone_hash = v_phone_hash
      and (p_service_id is null or r.service_id = p_service_id)
      and r.created_at >= now() - interval '30 days';

    if v_reviews_recent_phone >= 1 then
      raise exception 'A review has already been submitted for this service from this contact number recently.';
    end if;

    -- Check if this phone number exists in completed/delivered workshop records:
    -- A) Delivered/Ready job cards
    if exists (
      select 1 from public.job_cards jc
      where jc.status in ('ready', 'delivered')
        and public.normalize_phone_last10(jc.customer_phone) = v_phone_last10
    ) then
      v_is_verified := true;
    -- B) Completed service bookings
    elsif exists (
      select 1 from public.bookings bk
      where bk.status = 'completed'
        and public.normalize_phone_last10(bk.customer_phone) = v_phone_last10
    ) then
      v_is_verified := true;
    -- C) Delivered parts store orders
    elsif exists (
      select 1 from public.orders ord
      where ord.status = 'delivered'
        and public.normalize_phone_last10(ord.customer_phone) = v_phone_last10
    ) then
      v_is_verified := true;
    end if;
  end if;

  -- 4. Insert review row (status is pending moderation, phone is never saved in reviews table)
  insert into public.reviews (
    user_id,
    reviewer_name,
    rating,
    title,
    body,
    service_id,
    language,
    status,
    is_verified,
    admin_reply,
    ip_hash,
    is_demo
  )
  values (
    auth.uid(),
    v_name,
    p_rating,
    v_title,
    v_body,
    p_service_id,
    coalesce(p_language, 'en'),
    'pending',
    v_is_verified,
    null,
    v_ip_hash,
    false
  )
  returning id into v_new_review_id;

  -- Store contact phone hash in private table
  if v_phone_hash is not null then
    insert into public.review_contacts (review_id, phone_hash)
    values (v_new_review_id, v_phone_hash)
    on conflict (review_id) do nothing;
  end if;

  return jsonb_build_object('ok', true, 'id', v_new_review_id);
end;
$$;

-- =============================================================================
-- 7. RPC: GET REVIEW SUMMARY
-- =============================================================================
create or replace function public.get_review_summary()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int := 0;
  v_avg numeric(3,1) := 0.0;
  v_star_1 int := 0;
  v_star_2 int := 0;
  v_star_3 int := 0;
  v_star_4 int := 0;
  v_star_5 int := 0;
begin
  select
    count(*),
    coalesce(round(avg(rating)::numeric, 1), 0.0),
    count(*) filter (where rating = 1),
    count(*) filter (where rating = 2),
    count(*) filter (where rating = 3),
    count(*) filter (where rating = 4),
    count(*) filter (where rating = 5)
  into
    v_total,
    v_avg,
    v_star_1,
    v_star_2,
    v_star_3,
    v_star_4,
    v_star_5
  from public.reviews
  where status = 'approved';

  return jsonb_build_object(
    'total_reviews', v_total,
    'average_rating', v_avg,
    'star_counts', jsonb_build_object(
      '1', v_star_1,
      '2', v_star_2,
      '3', v_star_3,
      '4', v_star_4,
      '5', v_star_5
    )
  );
end;
$$;

-- =============================================================================
-- 8. GALLERY ITEMS
-- =============================================================================
create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  caption jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  category text not null check (category in ('workshop', 'repairs', 'before_after', 'parts', 'team')),
  image_url text not null,
  before_image_url text null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_gallery_items_active_sort on public.gallery_items(is_active, sort_order, created_at desc);
create index if not exists idx_gallery_items_category on public.gallery_items(category);
create index if not exists idx_gallery_items_demo on public.gallery_items(is_demo);

drop trigger if exists trg_gallery_items_updated_at on public.gallery_items;
create trigger trg_gallery_items_updated_at
before update on public.gallery_items
for each row execute function public.set_updated_at();

alter table public.gallery_items enable row level security;

drop policy if exists "Public can view active gallery items" on public.gallery_items;
create policy "Public can view active gallery items"
  on public.gallery_items for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert gallery items" on public.gallery_items;
create policy "Admins can insert gallery items"
  on public.gallery_items for insert
  with check (public.is_admin());

drop policy if exists "Admins can update gallery items" on public.gallery_items;
create policy "Admins can update gallery items"
  on public.gallery_items for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete gallery items" on public.gallery_items;
create policy "Admins can delete gallery items"
  on public.gallery_items for delete
  using (public.is_admin());

-- =============================================================================
-- 9. VERIFICATION BLOCK
-- =============================================================================
/*
select count(*) from public.blog_categories;
select count(*) from public.blog_posts;
select count(*) from public.estimator_rules;
select count(*) from public.reviews;
select count(*) from public.gallery_items;
select public.get_review_summary();
*/
