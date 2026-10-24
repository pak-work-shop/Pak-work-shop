-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 4: JOB CARDS, JOB TRACKING & INVOICES SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--
-- What this script creates:
--   - Sequences & generators: job_no_seq (JC-000001), invoice_no_seq (INV-000001)
--   - Tables:
--       2.1 public.job_cards
--       2.2 public.job_items (with generated stored line_total)
--       2.3 public.job_status_history
--       2.4 public.job_notes
--       2.5 public.invoices
--       2.6 public.job_payments
--       2.7 public.job_lookup_attempts
--   - Row Level Security (RLS) policies on all 7 tables
--   - Helper functions & SECURITY DEFINER RPCs:
--       * normalize_phone_last10(p_phone)
--       * mask_plate_number(p_plate)
--       * lookup_job_status(p_job_no, p_phone)
--       * get_my_job_detail(p_job_id)
--       * admin_find_customer(p_phone)
--       * admin_create_job_from_booking(p_booking_id)
--       * admin_create_job(...)
--       * admin_update_job_status(p_job_id, p_status, p_note, p_public_note)
--       * admin_save_draft_invoice(p_job_id, p_discount, p_due_date, p_notes)
--       * admin_issue_invoice(p_job_id, p_discount, p_due_date, p_notes)
--       * admin_void_invoice(p_invoice_id, p_note)
--       * admin_record_payment(p_invoice_id, p_amount, p_method, p_reference, p_note)
-- =============================================================================

-- =============================================================================
-- 1. SEQUENCES & HELPER FUNCTIONS
-- =============================================================================
create sequence if not exists public.job_no_seq start 1;
create sequence if not exists public.invoice_no_seq start 1;

create or replace function public.next_job_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'JC-' || lpad(nextval('public.job_no_seq')::text, 6, '0');
end;
$$;

create or replace function public.next_invoice_no()
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  return 'INV-' || lpad(nextval('public.invoice_no_seq')::text, 6, '0');
end;
$$;

-- Trigger function to ensure job_no is populated if null/empty on insert
create or replace function public.assign_job_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.job_no is null or btrim(new.job_no) = '' then
    new.job_no := public.next_job_no();
  else
    new.job_no := upper(btrim(new.job_no));
  end if;
  return new;
end;
$$;

-- Trigger function to ensure invoice_no is populated if null/empty on insert
create or replace function public.assign_invoice_no()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invoice_no is null or btrim(new.invoice_no) = '' then
    new.invoice_no := public.next_invoice_no();
  else
    new.invoice_no := upper(btrim(new.invoice_no));
  end if;
  return new;
end;
$$;

-- Normalise any Pakistani phone string (03XXXXXXXXX or +923XXXXXXXXX) to its last 10 digits
create or replace function public.normalize_phone_last10(p_phone text)
returns text
language sql
immutable
as $$
  select right(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), 10);
$$;

-- Mask a vehicle registration plate for public tracking (e.g. 'LEA-21-4589' -> 'LEA-••-4589')
create or replace function public.mask_plate_number(p_plate text)
returns text
language plpgsql
immutable
as $$
declare
  v_clean text;
  v_parts text[];
  v_len int;
begin
  v_clean := upper(btrim(coalesce(p_plate, '')));
  if v_clean = '' then
    return null;
  end if;

  v_parts := string_to_array(v_clean, '-');
  if array_length(v_parts, 1) >= 3 then
    return v_parts[1] || '-••-' || v_parts[array_length(v_parts, 1)];
  elsif array_length(v_parts, 1) = 2 then
    if char_length(v_parts[2]) > 2 then
      return v_parts[1] || '-••' || right(v_parts[2], 2);
    else
      return v_parts[1] || '-••';
    end if;
  else
    v_len := char_length(v_clean);
    if v_len <= 4 then
      return left(v_clean, 1) || '••' || right(v_clean, 1);
    else
      return left(v_clean, 2) || '••' || right(v_clean, 2);
    end if;
  end if;
end;
$$;

-- =============================================================================
-- 2. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.1 job_cards
-- -----------------------------------------------------------------------------
create table if not exists public.job_cards (
  id uuid primary key default gen_random_uuid(),
  job_no text not null unique default public.next_job_no(),
  booking_id uuid null references public.bookings(id) on delete set null,
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
  mileage_in int null check (mileage_in is null or (mileage_in >= 0 and mileage_in <= 2000000)),
  status text not null default 'received' check (
    status in (
      'received',
      'inspection',
      'awaiting_approval',
      'in_progress',
      'quality_check',
      'ready',
      'delivered',
      'on_hold',
      'cancelled'
    )
  ),
  complaint text null check (complaint is null or char_length(complaint) <= 2000),
  estimated_completion date null,
  public_note text null check (public_note is null or char_length(public_note) <= 1000),
  internal_notes text null,
  show_cost_to_customer boolean not null default false,
  received_at timestamptz not null default now(),
  delivered_at timestamptz null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_job_cards_assign_job_no on public.job_cards;
create trigger trg_job_cards_assign_job_no
before insert on public.job_cards
for each row execute function public.assign_job_no();

drop trigger if exists trg_job_cards_updated_at on public.job_cards;
create trigger trg_job_cards_updated_at
before update on public.job_cards
for each row execute function public.set_updated_at();

create index if not exists idx_job_cards_job_no on public.job_cards(job_no);
create index if not exists idx_job_cards_status on public.job_cards(status);
create index if not exists idx_job_cards_customer_phone on public.job_cards(customer_phone);
create index if not exists idx_job_cards_plate_number on public.job_cards(plate_number);
create index if not exists idx_job_cards_user_id on public.job_cards(user_id);
create index if not exists idx_job_cards_booking_id on public.job_cards(booking_id);
create unique index if not exists idx_job_cards_unique_booking_id
  on public.job_cards(booking_id)
  where booking_id is not null;

-- -----------------------------------------------------------------------------
-- 2.2 job_items
-- Note: Future phases may add product_id referencing public.products(id).
-- -----------------------------------------------------------------------------
create table if not exists public.job_items (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_cards(id) on delete cascade,
  item_type text not null check (item_type in ('service', 'part', 'labor', 'other')),
  description text not null check (char_length(btrim(description)) between 1 and 300),
  service_id uuid null references public.services(id) on delete set null,
  quantity numeric(10,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0 check (unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_job_items_updated_at on public.job_items;
create trigger trg_job_items_updated_at
before update on public.job_items
for each row execute function public.set_updated_at();

create index if not exists idx_job_items_job_id on public.job_items(job_id, sort_order);

-- -----------------------------------------------------------------------------
-- 2.3 job_status_history
-- -----------------------------------------------------------------------------
create table if not exists public.job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_cards(id) on delete cascade,
  from_status text null,
  to_status text not null,
  note text null,
  changed_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_status_history_job_id
  on public.job_status_history(job_id, created_at);

-- -----------------------------------------------------------------------------
-- 2.4 job_notes
-- -----------------------------------------------------------------------------
create table if not exists public.job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_cards(id) on delete cascade,
  note text not null check (char_length(btrim(note)) between 1 and 1000),
  is_customer_visible boolean not null default true,
  created_by uuid null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_notes_job_id
  on public.job_notes(job_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 2.5 invoices
-- -----------------------------------------------------------------------------
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_no text not null unique default public.next_invoice_no(),
  job_id uuid not null references public.job_cards(id) on delete restrict,
  status text not null default 'draft' check (
    status in ('draft', 'issued', 'partially_paid', 'paid', 'void')
  ),
  items_snapshot jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  discount numeric(12,2) not null default 0 check (discount >= 0),
  total numeric(12,2) not null default 0 check (total >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  notes text null,
  issued_at timestamptz null,
  due_date date null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_invoices_assign_invoice_no on public.invoices;
create trigger trg_invoices_assign_invoice_no
before insert on public.invoices
for each row execute function public.assign_invoice_no();

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create index if not exists idx_invoices_invoice_no on public.invoices(invoice_no);
create index if not exists idx_invoices_job_id on public.invoices(job_id);
create index if not exists idx_invoices_status on public.invoices(status);

-- Enforce at most one non-void invoice per job card
create unique index if not exists idx_invoices_one_active_per_job
  on public.invoices(job_id)
  where status <> 'void';

-- -----------------------------------------------------------------------------
-- 2.6 job_payments
-- -----------------------------------------------------------------------------
create table if not exists public.job_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (
    method in ('cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'other')
  ),
  reference text null,
  paid_at timestamptz not null default now(),
  received_by uuid null references public.profiles(id) on delete set null,
  note text null
);

create index if not exists idx_job_payments_invoice_id
  on public.job_payments(invoice_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- 2.7 job_lookup_attempts (rate-limit log — admin-only direct access)
-- -----------------------------------------------------------------------------
create table if not exists public.job_lookup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_job_lookup_attempts_ip_created
  on public.job_lookup_attempts(ip_hash, created_at);

-- =============================================================================
-- 2.8 ROW LEVEL SECURITY (RLS)
-- =============================================================================
alter table public.job_cards enable row level security;
alter table public.job_items enable row level security;
alter table public.job_status_history enable row level security;
alter table public.job_notes enable row level security;
alter table public.invoices enable row level security;
alter table public.job_payments enable row level security;
alter table public.job_lookup_attempts enable row level security;

-- 2.8.1 job_cards policies (Anon: none; Customer: own rows; Admin: full)
drop policy if exists "Customers can view own job cards" on public.job_cards;
create policy "Customers can view own job cards"
  on public.job_cards for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can insert job cards" on public.job_cards;
create policy "Admins can insert job cards"
  on public.job_cards for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update job cards" on public.job_cards;
create policy "Admins can update job cards"
  on public.job_cards for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete job cards" on public.job_cards;
create policy "Admins can delete job cards"
  on public.job_cards for delete
  to authenticated
  using (public.is_admin());

-- 2.8.2 job_items policies (Customer: own rows ONLY if show_cost_to_customer = true; Admin: full)
drop policy if exists "Customers can view own job items" on public.job_items;
drop policy if exists "Customers can view own job items when allowed" on public.job_items;
create policy "Customers can view own job items when allowed"
  on public.job_items for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.job_cards jc
       where jc.id = job_items.job_id
         and jc.user_id = auth.uid()
         and jc.show_cost_to_customer = true
    )
  );

drop policy if exists "Admins can insert job items" on public.job_items;
create policy "Admins can insert job items"
  on public.job_items for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update job items" on public.job_items;
create policy "Admins can update job items"
  on public.job_items for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete job items" on public.job_items;
create policy "Admins can delete job items"
  on public.job_items for delete
  to authenticated
  using (public.is_admin());

-- 2.8.3 job_status_history policies (Customer: own jobs; Admin: full)
drop policy if exists "Customers can view own job status history" on public.job_status_history;
create policy "Customers can view own job status history"
  on public.job_status_history for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.job_cards jc
       where jc.id = job_status_history.job_id
         and jc.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert job status history" on public.job_status_history;
create policy "Admins can insert job status history"
  on public.job_status_history for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can delete job status history" on public.job_status_history;
create policy "Admins can delete job status history"
  on public.job_status_history for delete
  to authenticated
  using (public.is_admin());

-- 2.8.4 job_notes policies (Customer: own customer-visible notes only; Admin: full)
drop policy if exists "Customers can view own visible job notes" on public.job_notes;
create policy "Customers can view own visible job notes"
  on public.job_notes for select
  to authenticated
  using (
    public.is_admin() or (
      is_customer_visible = true and exists (
        select 1 from public.job_cards jc
         where jc.id = job_notes.job_id
           and jc.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins can insert job notes" on public.job_notes;
create policy "Admins can insert job notes"
  on public.job_notes for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update job notes" on public.job_notes;
create policy "Admins can update job notes"
  on public.job_notes for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete job notes" on public.job_notes;
create policy "Admins can delete job notes"
  on public.job_notes for delete
  to authenticated
  using (public.is_admin());

-- 2.8.5 invoices policies (Customer: own issued/partially_paid/paid invoices; Admin: full)
drop policy if exists "Customers can view own issued or paid invoices" on public.invoices;
create policy "Customers can view own issued or paid invoices"
  on public.invoices for select
  to authenticated
  using (
    public.is_admin() or (
      status in ('issued', 'partially_paid', 'paid') and exists (
        select 1 from public.job_cards jc
         where jc.id = invoices.job_id
           and jc.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Admins can insert invoices" on public.invoices;
create policy "Admins can insert invoices"
  on public.invoices for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update invoices" on public.invoices;
create policy "Admins can update invoices"
  on public.invoices for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete invoices" on public.invoices;
create policy "Admins can delete invoices"
  on public.invoices for delete
  to authenticated
  using (public.is_admin());

-- 2.8.6 job_payments policies (Customer: payments on own issued/paid invoices; Admin: full)
drop policy if exists "Customers can view own job payments" on public.job_payments;
create policy "Customers can view own job payments"
  on public.job_payments for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1
        from public.invoices inv
        join public.job_cards jc on jc.id = inv.job_id
       where inv.id = job_payments.invoice_id
         and inv.status in ('issued', 'partially_paid', 'paid')
         and jc.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert job payments" on public.job_payments;
create policy "Admins can insert job payments"
  on public.job_payments for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update job payments" on public.job_payments;
create policy "Admins can update job payments"
  on public.job_payments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete job payments" on public.job_payments;
create policy "Admins can delete job payments"
  on public.job_payments for delete
  to authenticated
  using (public.is_admin());

-- 2.8.7 job_lookup_attempts policies (Admin only)
drop policy if exists "Admins can view job lookup attempts" on public.job_lookup_attempts;
create policy "Admins can view job lookup attempts"
  on public.job_lookup_attempts for select
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 2.9 RPCs (SECURITY DEFINER)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 2.9.1 lookup_job_status(p_job_no text, p_phone text)
-- Public + authenticated lookup with 10 attempts / 15 min / IP rate limit.
-- -----------------------------------------------------------------------------
create or replace function public.lookup_job_status(
  p_job_no text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_job_no text;
  v_phone_last10 text;
  v_ip_hash text;
  v_attempts int;
  v_job public.job_cards%rowtype;
  v_items jsonb;
  v_notes jsonb;
  v_history jsonb;
  v_invoice_status text;
begin
  v_job_no := upper(btrim(coalesce(p_job_no, '')));
  v_phone_last10 := public.normalize_phone_last10(p_phone);

  if v_job_no = '' or char_length(v_phone_last10) < 10 then
    raise exception 'not_found';
  end if;

  -- Rate limit: max 10 lookup attempts per 15 minutes per IP hash
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_attempts
      from public.job_lookup_attempts a
     where a.ip_hash = v_ip_hash
       and a.created_at >= now() - interval '15 minutes';

    if v_attempts >= 10 then
      raise exception 'rate_limited';
    end if;

    insert into public.job_lookup_attempts (ip_hash) values (v_ip_hash);
  end if;

  select *
    into v_job
    from public.job_cards jc
   where upper(jc.job_no) = v_job_no
     and public.normalize_phone_last10(jc.customer_phone) = v_phone_last10
   limit 1;

  if not found then
    raise exception 'not_found';
  end if;

  -- Work items: include unit_price and line_total ONLY when show_cost_to_customer is true
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', case when v_job.show_cost_to_customer then ji.unit_price else null end,
        'line_total', case when v_job.show_cost_to_customer then ji.line_total else null end
      )
      order by ji.sort_order asc, ji.created_at asc
    ),
    '[]'::jsonb
  )
    into v_items
    from public.job_items ji
   where ji.job_id = v_job.id;

  -- Customer-visible progress notes
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'note', jn.note,
        'created_at', jn.created_at
      )
      order by jn.created_at desc
    ),
    '[]'::jsonb
  )
    into v_notes
    from public.job_notes jn
   where jn.job_id = v_job.id
     and jn.is_customer_visible = true;

  -- Status timeline
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
    from public.job_status_history h
   where h.job_id = v_job.id;

  -- Active invoice status only (no internal notes or draft details leaked if void)
  select inv.status
    into v_invoice_status
    from public.invoices inv
   where inv.job_id = v_job.id
     and inv.status <> 'void'
   order by inv.created_at desc
   limit 1;

  return jsonb_build_object(
    'job_no', v_job.job_no,
    'status', v_job.status,
    'vehicle_summary', btrim(
      coalesce(v_job.make_text, '') || ' ' ||
      coalesce(v_job.model_text, '') ||
      case when v_job.vehicle_year is not null then ' (' || v_job.vehicle_year::text || ')' else '' end
    ),
    'plate_masked', public.mask_plate_number(v_job.plate_number),
    'fuel_type', v_job.fuel_type,
    'mileage_in', v_job.mileage_in,
    'complaint', v_job.complaint,
    'estimated_completion', v_job.estimated_completion,
    'public_note', v_job.public_note,
    'show_cost_to_customer', v_job.show_cost_to_customer,
    'received_at', v_job.received_at,
    'delivered_at', v_job.delivered_at,
    'items', v_items,
    'notes', v_notes,
    'history', v_history,
    'invoice_status', v_invoice_status
  );
end;
$$;

grant execute on function public.lookup_job_status(text, text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.1b get_my_job_detail(p_job_id uuid)
-- Authenticated customer RPC: returns the caller's own job card with work items
-- (masking unit_price and line_total as NULL when show_cost_to_customer = false),
-- customer-visible notes, stage timeline, and issued/partially_paid/paid invoices.
-- Never returns internal_notes or non-visible job_notes.
-- -----------------------------------------------------------------------------
create or replace function public.get_my_job_detail(
  p_job_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_is_admin boolean;
  v_job public.job_cards%rowtype;
  v_items jsonb;
  v_notes jsonb;
  v_history jsonb;
  v_invoices jsonb;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'unauthorized';
  end if;

  v_is_admin := public.is_admin();

  select *
    into v_job
    from public.job_cards jc
   where jc.id = p_job_id
     and (jc.user_id = v_uid or v_is_admin)
   limit 1;

  if not found then
    raise exception 'not_found';
  end if;

  -- Work items: omit unit_price and line_total (return null) when show_cost_to_customer = false
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', ji.id,
        'item_type', ji.item_type,
        'description', ji.description,
        'quantity', ji.quantity,
        'unit_price', case when v_job.show_cost_to_customer then ji.unit_price else null end,
        'line_total', case when v_job.show_cost_to_customer then ji.line_total else null end
      )
      order by ji.sort_order asc, ji.created_at asc
    ),
    '[]'::jsonb
  )
    into v_items
    from public.job_items ji
   where ji.job_id = v_job.id;

  -- Customer-visible notes only
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', jn.id,
        'note', jn.note,
        'created_at', jn.created_at
      )
      order by jn.created_at desc
    ),
    '[]'::jsonb
  )
    into v_notes
    from public.job_notes jn
   where jn.job_id = v_job.id
     and jn.is_customer_visible = true;

  -- Stage transition history
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', h.id,
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
    from public.job_status_history h
   where h.job_id = v_job.id;

  -- Issued / partially_paid / paid invoices for this job
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', inv.id,
        'invoice_no', inv.invoice_no,
        'status', inv.status,
        'subtotal', inv.subtotal,
        'discount', inv.discount,
        'total', inv.total,
        'amount_paid', inv.amount_paid,
        'issued_at', inv.issued_at,
        'due_date', inv.due_date
      )
      order by inv.created_at desc
    ),
    '[]'::jsonb
  )
    into v_invoices
    from public.invoices inv
   where inv.job_id = v_job.id
     and inv.status in ('issued', 'partially_paid', 'paid');

  return jsonb_build_object(
    'id', v_job.id,
    'job_no', v_job.job_no,
    'booking_id', v_job.booking_id,
    'status', v_job.status,
    'make_text', v_job.make_text,
    'model_text', v_job.model_text,
    'vehicle_year', v_job.vehicle_year,
    'plate_number', v_job.plate_number,
    'fuel_type', v_job.fuel_type,
    'mileage_in', v_job.mileage_in,
    'complaint', v_job.complaint,
    'estimated_completion', v_job.estimated_completion,
    'public_note', v_job.public_note,
    'show_cost_to_customer', v_job.show_cost_to_customer,
    'received_at', v_job.received_at,
    'delivered_at', v_job.delivered_at,
    'items', v_items,
    'notes', v_notes,
    'history', v_history,
    'invoices', v_invoices
  );
end;
$$;

grant execute on function public.get_my_job_detail(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.2 admin_find_customer(p_phone text)
-- Admin-only lookup to link a job card to an existing registered customer profile
-- by normalized phone number. Returns id + full_name only.
-- -----------------------------------------------------------------------------
create or replace function public.admin_find_customer(p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_last10 text;
  v_profile record;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  v_last10 := public.normalize_phone_last10(p_phone);
  if char_length(v_last10) < 10 then
    return jsonb_build_object('found', false, 'id', null, 'full_name', null);
  end if;

  select p.id, p.full_name
    into v_profile
    from public.profiles p
   where public.normalize_phone_last10(p.phone) = v_last10
   order by p.created_at asc
   limit 1;

  if not found then
    return jsonb_build_object('found', false, 'id', null, 'full_name', null);
  end if;

  return jsonb_build_object(
    'found', true,
    'id', v_profile.id,
    'full_name', v_profile.full_name
  );
end;
$$;

grant execute on function public.admin_find_customer(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.3 admin_create_job_from_booking(p_booking_id uuid)
-- Admin-only: converts a booking into a job card, copies customer, vehicle,
-- and booked services (with service.price_from as starting unit_price),
-- sets the booking to 'in_progress', and prevents duplicate job creation.
-- -----------------------------------------------------------------------------
create or replace function public.admin_create_job_from_booking(p_booking_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_existing_job_id uuid;
  v_user_id uuid;
  v_job_id uuid;
  v_job_no text;
  v_bs record;
  v_sort int := 0;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if p_booking_id is null then
    raise exception 'invalid_input';
  end if;

  select *
    into v_booking
    from public.bookings b
   where b.id = p_booking_id
   for update;

  if not found then
    raise exception 'booking_not_found';
  end if;

  if v_booking.status in ('cancelled', 'rejected') then
    raise exception 'booking_cancelled';
  end if;

  select jc.id
    into v_existing_job_id
    from public.job_cards jc
   where jc.booking_id = p_booking_id
   limit 1;

  if v_existing_job_id is not null then
    raise exception 'job_already_exists';
  end if;

  -- Link to user_id from booking or matching customer profile phone
  v_user_id := v_booking.user_id;
  if v_user_id is null then
    select p.id
      into v_user_id
      from public.profiles p
     where public.normalize_phone_last10(p.phone) = public.normalize_phone_last10(v_booking.customer_phone)
     order by p.created_at asc
     limit 1;
  end if;

  insert into public.job_cards (
    booking_id,
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
    mileage_in,
    status,
    complaint,
    estimated_completion,
    internal_notes,
    show_cost_to_customer,
    is_demo
  )
  values (
    v_booking.id,
    v_user_id,
    v_booking.customer_name,
    v_booking.customer_phone,
    v_booking.customer_email,
    v_booking.make_id,
    v_booking.model_id,
    v_booking.make_text,
    v_booking.model_text,
    v_booking.vehicle_year,
    v_booking.plate_number,
    v_booking.fuel_type,
    v_booking.mileage_km,
    'received',
    v_booking.problem_description,
    v_booking.booking_date,
    v_booking.admin_notes,
    false,
    v_booking.is_demo
  )
  returning id, job_no into v_job_id, v_job_no;

  -- Copy booking_services as job_items with service.price_from as starting unit_price
  for v_bs in
    select
      bs.service_id,
      bs.service_name,
      coalesce(s.price_from, 0)::numeric(12,2) as starting_price
    from public.booking_services bs
    left join public.services s on s.id = bs.service_id
    where bs.booking_id = v_booking.id
    order by bs.id asc
  loop
    v_sort := v_sort + 10;
    insert into public.job_items (
      job_id,
      item_type,
      description,
      service_id,
      quantity,
      unit_price,
      sort_order
    )
    values (
      v_job_id,
      'service',
      coalesce(nullif(btrim(v_bs.service_name), ''), 'Workshop Service'),
      v_bs.service_id,
      1,
      greatest(0, coalesce(v_bs.starting_price, 0)),
      v_sort
    );
  end loop;

  -- Write initial job_status_history entry
  insert into public.job_status_history (
    job_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_job_id,
    null,
    'received',
    'Converted from booking ' || v_booking.booking_no,
    auth.uid()
  );

  -- Move booking to 'in_progress' if not already in_progress or completed
  if v_booking.status not in ('in_progress', 'completed') then
    update public.bookings
       set status = 'in_progress'
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
      'in_progress',
      'Converted to Job Card ' || v_job_no,
      auth.uid()
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'job_id', v_job_id,
    'job_no', v_job_no
  );
end;
$$;

grant execute on function public.admin_create_job_from_booking(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.4 admin_create_job(...)
-- Admin-only manual walk-in job creation with full input validation.
-- -----------------------------------------------------------------------------
create or replace function public.admin_create_job(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text default null,
  p_user_id uuid default null,
  p_make_id uuid default null,
  p_model_id uuid default null,
  p_make_text text default null,
  p_model_text text default null,
  p_vehicle_year int default null,
  p_plate_number text default null,
  p_fuel_type text default null,
  p_mileage_in int default null,
  p_complaint text default null,
  p_estimated_completion date default null,
  p_public_note text default null,
  p_internal_notes text default null,
  p_show_cost_to_customer boolean default false,
  p_service_ids uuid[] default '{}'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_phone text;
  v_email text;
  v_make_text text;
  v_model_text text;
  v_plate text;
  v_fuel text;
  v_complaint text;
  v_pub_note text;
  v_int_notes text;
  v_user_id uuid;
  v_job_id uuid;
  v_job_no text;
  v_srv record;
  v_sort int := 0;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  v_name := btrim(coalesce(p_customer_name, ''));
  v_phone := regexp_replace(btrim(coalesce(p_customer_phone, '')), '[\s\-]+', '', 'g');
  v_email := nullif(btrim(coalesce(p_customer_email, '')), '');
  v_make_text := nullif(btrim(coalesce(p_make_text, '')), '');
  v_model_text := nullif(btrim(coalesce(p_model_text, '')), '');
  v_plate := nullif(upper(btrim(coalesce(p_plate_number, ''))), '');
  v_fuel := nullif(lower(btrim(coalesce(p_fuel_type, ''))), '');
  v_complaint := nullif(btrim(coalesce(p_complaint, '')), '');
  v_pub_note := nullif(btrim(coalesce(p_public_note, '')), '');
  v_int_notes := nullif(btrim(coalesce(p_internal_notes, '')), '');

  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'invalid_input';
  end if;

  if v_phone !~ '^(\+92|0)3[0-9]{9}$' or char_length(v_phone) < 10 or char_length(v_phone) > 15 then
    raise exception 'invalid_input';
  end if;

  if v_email is not null and (char_length(v_email) > 120 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$') then
    raise exception 'invalid_input';
  end if;

  if p_make_id is not null and v_make_text is null then
    select m.name into v_make_text from public.vehicle_makes m where m.id = p_make_id;
  end if;
  if p_model_id is not null and v_model_text is null then
    select mo.name into v_model_text from public.vehicle_models mo where mo.id = p_model_id;
  end if;

  if v_make_text is null or v_model_text is null then
    raise exception 'invalid_input';
  end if;

  if p_vehicle_year is not null and (p_vehicle_year < 1970 or p_vehicle_year > (extract(year from now())::int + 1)) then
    raise exception 'invalid_input';
  end if;

  if v_fuel is not null and v_fuel not in ('petrol', 'diesel', 'hybrid', 'cng', 'electric') then
    raise exception 'invalid_input';
  end if;

  if p_mileage_in is not null and (p_mileage_in < 0 or p_mileage_in > 2000000) then
    raise exception 'invalid_input';
  end if;

  if v_complaint is not null and char_length(v_complaint) > 2000 then
    raise exception 'invalid_input';
  end if;

  if v_pub_note is not null and char_length(v_pub_note) > 1000 then
    raise exception 'invalid_input';
  end if;

  v_user_id := p_user_id;
  if v_user_id is null then
    select p.id
      into v_user_id
      from public.profiles p
     where public.normalize_phone_last10(p.phone) = public.normalize_phone_last10(v_phone)
     order by p.created_at asc
     limit 1;
  end if;

  insert into public.job_cards (
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
    mileage_in,
    status,
    complaint,
    estimated_completion,
    public_note,
    internal_notes,
    show_cost_to_customer,
    is_demo
  )
  values (
    v_user_id,
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
    p_mileage_in,
    'received',
    v_complaint,
    p_estimated_completion,
    v_pub_note,
    v_int_notes,
    coalesce(p_show_cost_to_customer, false),
    false
  )
  returning id, job_no into v_job_id, v_job_no;

  -- Add optional initial services as job_items
  if p_service_ids is not null and array_length(p_service_ids, 1) is not null then
    for v_srv in
      select
        s.id,
        coalesce(nullif(btrim(s.name->>'en'), ''), s.slug) as en_name,
        coalesce(s.price_from, 0)::numeric(12,2) as starting_price
      from public.services s
      where s.id = any(p_service_ids)
      order by s.sort_order asc
    loop
      v_sort := v_sort + 10;
      insert into public.job_items (
        job_id,
        item_type,
        description,
        service_id,
        quantity,
        unit_price,
        sort_order
      )
      values (
        v_job_id,
        'service',
        v_srv.en_name,
        v_srv.id,
        1,
        greatest(0, v_srv.starting_price),
        v_sort
      );
    end loop;
  end if;

  insert into public.job_status_history (
    job_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    v_job_id,
    null,
    'received',
    'Walk-in job card created',
    auth.uid()
  );

  if v_pub_note is not null then
    insert into public.job_notes (
      job_id,
      note,
      is_customer_visible,
      created_by
    )
    values (
      v_job_id,
      v_pub_note,
      true,
      auth.uid()
    );
  end if;

  return jsonb_build_object(
    'ok', true,
    'job_id', v_job_id,
    'job_no', v_job_no
  );
end;
$$;

grant execute on function public.admin_create_job(
  text, text, text, uuid, uuid, uuid, text, text, int, text, text, int, text, date, text, text, boolean, uuid[]
) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.5 Helper: job_stage_rank(p_status text)
-- Returns 1..7 for the 7 forward repair stages, or null for on_hold / cancelled
-- -----------------------------------------------------------------------------
create or replace function public.job_stage_rank(p_status text)
returns int
language sql
immutable
as $$
  select case p_status
    when 'received' then 1
    when 'inspection' then 2
    when 'awaiting_approval' then 3
    when 'in_progress' then 4
    when 'quality_check' then 5
    when 'ready' then 6
    when 'delivered' then 7
    else null
  end;
$$;

-- -----------------------------------------------------------------------------
-- 2.9.6 admin_update_job_status(p_job_id, p_status, p_note, p_public_note)
-- Validates transitions:
--   - Forward flow: received -> inspection -> awaiting_approval -> in_progress -> quality_check -> ready -> delivered
--   - on_hold from any active status (1..6) and back to any active status (1..6)
--   - cancelled from any status except delivered (and cancelled)
--   - No changes out of delivered or cancelled
--   - Sets delivered_at when delivered, and marks linked booking completed
-- -----------------------------------------------------------------------------
create or replace function public.admin_update_job_status(
  p_job_id uuid,
  p_status text,
  p_note text default null,
  p_public_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.job_cards%rowtype;
  v_booking public.bookings%rowtype;
  v_from_rank int;
  v_to_rank int;
  v_note text;
  v_pub_note text;
  v_delivered_at timestamptz;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if p_status is null or p_status not in (
    'received',
    'inspection',
    'awaiting_approval',
    'in_progress',
    'quality_check',
    'ready',
    'delivered',
    'on_hold',
    'cancelled'
  ) then
    raise exception 'invalid_input';
  end if;

  select *
    into v_job
    from public.job_cards jc
   where jc.id = p_job_id
   for update;

  if not found then
    raise exception 'not_found';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');
  v_pub_note := nullif(btrim(coalesce(p_public_note, '')), '');

  if v_pub_note is not null and char_length(v_pub_note) > 1000 then
    raise exception 'invalid_input';
  end if;

  -- Terminal states cannot transition out
  if v_job.status in ('delivered', 'cancelled') then
    raise exception 'invalid_transition';
  end if;

  if p_status = v_job.status then
    raise exception 'invalid_transition';
  end if;

  v_from_rank := public.job_stage_rank(v_job.status);
  v_to_rank := public.job_stage_rank(p_status);

  if p_status = 'cancelled' then
    -- Allowed from any non-delivered status (already guarded above)
    null;
  elsif p_status = 'on_hold' then
    -- Allowed from any active status (received..ready, rank 1..6)
    if v_from_rank is null or v_from_rank >= 7 then
      raise exception 'invalid_transition';
    end if;
  elsif v_job.status = 'on_hold' then
    -- From on_hold back to any active status (received..ready, rank 1..6)
    if v_to_rank is null or v_to_rank >= 7 then
      raise exception 'invalid_transition';
    end if;
  else
    -- Forward flow between active stages (rank must strictly increase)
    if v_from_rank is null or v_to_rank is null or v_to_rank <= v_from_rank then
      raise exception 'invalid_transition';
    end if;
  end if;

  v_delivered_at := case
    when p_status = 'delivered' then now()
    else v_job.delivered_at
  end;

  update public.job_cards
     set status = p_status,
         delivered_at = v_delivered_at,
         public_note = coalesce(v_pub_note, public_note)
   where id = p_job_id;

  insert into public.job_status_history (
    job_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  values (
    p_job_id,
    v_job.status,
    p_status,
    coalesce(v_note, v_pub_note),
    auth.uid()
  );

  if v_pub_note is not null then
    insert into public.job_notes (
      job_id,
      note,
      is_customer_visible,
      created_by
    )
    values (
      p_job_id,
      v_pub_note,
      true,
      auth.uid()
    );
  end if;

  -- When delivered, also mark the linked booking as completed
  if p_status = 'delivered' and v_job.booking_id is not null then
    select *
      into v_booking
      from public.bookings b
     where b.id = v_job.booking_id
     for update;

    if found and v_booking.status not in ('completed', 'cancelled', 'rejected') then
      update public.bookings
         set status = 'completed'
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
        'completed',
        'Completed upon delivery of Job Card ' || v_job.job_no,
        auth.uid()
      );
    end if;
  end if;

  return jsonb_build_object(
    'ok', true,
    'status', p_status,
    'delivered_at', v_delivered_at
  );
end;
$$;

grant execute on function public.admin_update_job_status(uuid, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.7 admin_save_draft_invoice(p_job_id, p_discount, p_due_date, p_notes)
-- Creates or updates a draft invoice for a job card before issuing.
-- -----------------------------------------------------------------------------
create or replace function public.admin_save_draft_invoice(
  p_job_id uuid,
  p_discount numeric default 0,
  p_due_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.job_cards%rowtype;
  v_existing public.invoices%rowtype;
  v_items_snapshot jsonb;
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_inv_id uuid;
  v_inv_no text;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_job from public.job_cards where id = p_job_id;
  if not found then
    raise exception 'not_found';
  end if;

  v_discount := round(coalesce(p_discount, 0), 2);
  if v_discount < 0 then
    raise exception 'invalid_discount';
  end if;

  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ji.id,
          'item_type', ji.item_type,
          'description', ji.description,
          'quantity', ji.quantity,
          'unit_price', ji.unit_price,
          'line_total', ji.line_total
        )
        order by ji.sort_order asc, ji.created_at asc
      ),
      '[]'::jsonb
    ),
    coalesce(sum(ji.line_total), 0)::numeric(12,2)
  into v_items_snapshot, v_subtotal
  from public.job_items ji
  where ji.job_id = p_job_id;

  if v_discount > v_subtotal then
    raise exception 'invalid_discount';
  end if;

  v_total := greatest(0, v_subtotal - v_discount);

  select *
    into v_existing
    from public.invoices inv
   where inv.job_id = p_job_id
     and inv.status <> 'void'
   limit 1
   for update;

  if found then
    if v_existing.status <> 'draft' then
      raise exception 'active_invoice_exists';
    end if;

    update public.invoices
       set items_snapshot = v_items_snapshot,
           subtotal = v_subtotal,
           discount = v_discount,
           total = v_total,
           due_date = p_due_date,
           notes = nullif(btrim(coalesce(p_notes, '')), '')
     where id = v_existing.id
     returning id, invoice_no into v_inv_id, v_inv_no;
  else
    insert into public.invoices (
      job_id,
      status,
      items_snapshot,
      subtotal,
      discount,
      total,
      amount_paid,
      notes,
      due_date,
      is_demo
    )
    values (
      p_job_id,
      'draft',
      v_items_snapshot,
      v_subtotal,
      v_discount,
      v_total,
      0,
      nullif(btrim(coalesce(p_notes, '')), ''),
      p_due_date,
      v_job.is_demo
    )
    returning id, invoice_no into v_inv_id, v_inv_no;
  end if;

  return jsonb_build_object(
    'ok', true,
    'invoice_id', v_inv_id,
    'invoice_no', v_inv_no,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'status', 'draft'
  );
end;
$$;

grant execute on function public.admin_save_draft_invoice(uuid, numeric, date, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.8 admin_issue_invoice(p_job_id, p_discount, p_due_date, p_notes)
-- Snapshots job_items into invoices.items_snapshot, computes totals server-side,
-- sets status = 'issued', enforces one active (non-void) invoice per job.
-- -----------------------------------------------------------------------------
create or replace function public.admin_issue_invoice(
  p_job_id uuid,
  p_discount numeric default 0,
  p_due_date date default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_job public.job_cards%rowtype;
  v_existing public.invoices%rowtype;
  v_items_snapshot jsonb;
  v_item_count int;
  v_subtotal numeric(12,2);
  v_discount numeric(12,2);
  v_total numeric(12,2);
  v_inv_id uuid;
  v_inv_no text;
  v_new_status text;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_job from public.job_cards where id = p_job_id;
  if not found then
    raise exception 'not_found';
  end if;

  v_discount := round(coalesce(p_discount, 0), 2);
  if v_discount < 0 then
    raise exception 'invalid_discount';
  end if;

  select
    count(*)::int,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id', ji.id,
          'item_type', ji.item_type,
          'description', ji.description,
          'quantity', ji.quantity,
          'unit_price', ji.unit_price,
          'line_total', ji.line_total
        )
        order by ji.sort_order asc, ji.created_at asc
      ),
      '[]'::jsonb
    ),
    coalesce(sum(ji.line_total), 0)::numeric(12,2)
  into v_item_count, v_items_snapshot, v_subtotal
  from public.job_items ji
  where ji.job_id = p_job_id;

  if v_item_count = 0 then
    raise exception 'no_job_items';
  end if;

  if v_discount > v_subtotal then
    raise exception 'invalid_discount';
  end if;

  v_total := greatest(0, v_subtotal - v_discount);
  v_new_status := case when v_total = 0 then 'paid' else 'issued' end;

  select *
    into v_existing
    from public.invoices inv
   where inv.job_id = p_job_id
     and inv.status <> 'void'
   limit 1
   for update;

  if found then
    if v_existing.status <> 'draft' then
      raise exception 'active_invoice_exists';
    end if;

    update public.invoices
       set status = v_new_status,
           items_snapshot = v_items_snapshot,
           subtotal = v_subtotal,
           discount = v_discount,
           total = v_total,
           issued_at = now(),
           due_date = p_due_date,
           notes = nullif(btrim(coalesce(p_notes, '')), '')
     where id = v_existing.id
     returning id, invoice_no into v_inv_id, v_inv_no;
  else
    insert into public.invoices (
      job_id,
      status,
      items_snapshot,
      subtotal,
      discount,
      total,
      amount_paid,
      notes,
      issued_at,
      due_date,
      is_demo
    )
    values (
      p_job_id,
      v_new_status,
      v_items_snapshot,
      v_subtotal,
      v_discount,
      v_total,
      0,
      nullif(btrim(coalesce(p_notes, '')), ''),
      now(),
      p_due_date,
      v_job.is_demo
    )
    returning id, invoice_no into v_inv_id, v_inv_no;
  end if;

  return jsonb_build_object(
    'ok', true,
    'invoice_id', v_inv_id,
    'invoice_no', v_inv_no,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', v_total,
    'status', v_new_status
  );
end;
$$;

grant execute on function public.admin_issue_invoice(uuid, numeric, date, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.9 admin_void_invoice(p_invoice_id uuid, p_note text default null)
-- Marks an invoice as 'void' so a replacement invoice can be issued if needed.
-- -----------------------------------------------------------------------------
create or replace function public.admin_void_invoice(
  p_invoice_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invoices%rowtype;
  v_note text;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select *
    into v_inv
    from public.invoices inv
   where inv.id = p_invoice_id
   for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_inv.status = 'void' then
    raise exception 'already_void';
  end if;

  v_note := nullif(btrim(coalesce(p_note, '')), '');

  update public.invoices
     set status = 'void',
         notes = case
           when v_note is not null and coalesce(notes, '') <> '' then notes || E'\n[VOID]: ' || v_note
           when v_note is not null then '[VOID]: ' || v_note
           else notes
         end
   where id = p_invoice_id;

  return jsonb_build_object(
    'ok', true,
    'invoice_id', p_invoice_id,
    'status', 'void'
  );
end;
$$;

grant execute on function public.admin_void_invoice(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 2.9.10 admin_record_payment(p_invoice_id, p_amount, p_method, p_reference, p_note)
-- Validates payment amount <= outstanding balance, records payment, and updates
-- invoice amount_paid and status (partially_paid / paid).
-- -----------------------------------------------------------------------------
create or replace function public.admin_record_payment(
  p_invoice_id uuid,
  p_amount numeric,
  p_method text,
  p_reference text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invoices%rowtype;
  v_amount numeric(12,2);
  v_outstanding numeric(12,2);
  v_new_paid numeric(12,2);
  v_new_status text;
  v_payment_id uuid;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  v_amount := round(coalesce(p_amount, 0), 2);
  if v_amount <= 0 then
    raise exception 'invalid_amount';
  end if;

  if p_method is null or p_method not in (
    'cash', 'bank_transfer', 'jazzcash', 'easypaisa', 'card', 'other'
  ) then
    raise exception 'invalid_method';
  end if;

  select *
    into v_inv
    from public.invoices inv
   where inv.id = p_invoice_id
   for update;

  if not found then
    raise exception 'not_found';
  end if;

  if v_inv.status = 'void' then
    raise exception 'invoice_void';
  end if;

  if v_inv.status = 'draft' then
    raise exception 'invoice_not_issued';
  end if;

  if v_inv.status = 'paid' then
    raise exception 'already_paid';
  end if;

  v_outstanding := round(v_inv.total - v_inv.amount_paid, 2);
  if v_amount > v_outstanding then
    raise exception 'overpayment_not_allowed';
  end if;

  insert into public.job_payments (
    invoice_id,
    amount,
    method,
    reference,
    paid_at,
    received_by,
    note
  )
  values (
    v_inv.id,
    v_amount,
    p_method,
    nullif(btrim(coalesce(p_reference, '')), ''),
    now(),
    auth.uid(),
    nullif(btrim(coalesce(p_note, '')), '')
  )
  returning id into v_payment_id;

  v_new_paid := round(v_inv.amount_paid + v_amount, 2);
  v_new_status := case
    when v_new_paid >= v_inv.total then 'paid'
    else 'partially_paid'
  end;

  update public.invoices
     set amount_paid = v_new_paid,
         status = v_new_status,
         issued_at = coalesce(issued_at, now())
   where id = v_inv.id;

  return jsonb_build_object(
    'ok', true,
    'payment_id', v_payment_id,
    'amount_paid', v_new_paid,
    'balance', greatest(0, v_inv.total - v_new_paid),
    'status', v_new_status
  );
end;
$$;

grant execute on function public.admin_record_payment(uuid, numeric, text, text, text) to authenticated;

-- =============================================================================
-- 3. VERIFICATION QUERIES (Commented out — run manually in SQL Editor to verify)
-- =============================================================================
-- select table_name from information_schema.tables where table_schema = 'public' and table_name in ('job_cards', 'job_items', 'job_status_history', 'job_notes', 'invoices', 'job_payments', 'job_lookup_attempts');
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('job_cards', 'job_items', 'job_status_history', 'job_notes', 'invoices', 'job_payments', 'job_lookup_attempts');
-- select public.mask_plate_number('LEA-21-4589');
-- select public.lookup_job_status('JC-000201', '03000000001');
