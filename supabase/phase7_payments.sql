-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 7: ONLINE PAYMENTS & MOCK GATEWAY SQL
-- =============================================================================
-- Safe to run multiple times (idempotent) in the Supabase SQL Editor.
-- Prerequisites:
--   1. supabase/phase1_foundation.sql
--   2. supabase/phase2_content.sql
--   3. supabase/phase3_booking.sql
--   4. supabase/phase4_jobs.sql
--   5. supabase/phase5_catalogue.sql
--   6. supabase/phase6_orders.sql
--
-- What this script creates:
--   - Tables:
--       1. public.payment_accounts (Bank transfer, JazzCash, Easypaisa details)
--       2. public.payments (Manual proof submissions, mock gateway, gateway tracking)
--       3. public.payment_logs (Audit log for payments, webhook events, status transitions)
--       4. public.payment_settings (Single row id = 1: toggles for manual, mock, require_proof)
--   - Sync Trigger:
--       * Keeps delivery_settings.online_payment_enabled in sync with payment_settings
--   - Storage:
--       * Private bucket 'payment-proofs' (3 MB, png/jpg/jpeg/webp/pdf)
--       * Public insert under pending/<filename>, Admin select via signed URLs
--   - SECURITY DEFINER RPCs:
--       1. public.get_payment_options() (public)
--       2. public.submit_payment_proof(p_order_no, p_phone, p_method, p_transaction_id, p_proof_path, p_amount) (public)
--       3. public.admin_verify_payment(p_payment_id, p_note) (admin only)
--       4. public.admin_reject_payment(p_payment_id, p_reason) (admin only)
--       5. public.admin_mark_refunded(p_payment_id, p_note) (admin only)
--       6. public.mock_gateway_start(p_order_no, p_phone) (demo only)
--       7. public.mock_gateway_complete(p_token, p_outcome) (demo only)
--       8. public.apply_gateway_result(...) (service-role only webhook handler)
--       9. public.lookup_order_status(p_order_no, p_phone) (enhanced to include latest_payment)
-- =============================================================================

create extension if not exists pgcrypto;

-- =============================================================================
-- 1. TABLE: payment_accounts
-- =============================================================================
-- Workshop accounts shown to customers during checkout and on order success.
-- Trilingual title & instructions, public select on active rows, admin full CRUD.
-- =============================================================================
create table if not exists public.payment_accounts (
  id uuid primary key default gen_random_uuid(),
  method text not null check (method in ('bank_transfer', 'jazzcash', 'easypaisa', 'other')),
  title jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  account_title text not null check (char_length(btrim(account_title)) between 2 and 120),
  account_number text not null check (char_length(btrim(account_number)) between 4 and 60),
  iban text null check (iban is null or char_length(btrim(iban)) between 10 and 40),
  bank_name text null check (bank_name is null or char_length(btrim(bank_name)) <= 100),
  instructions jsonb not null default '{"en": "", "ur": "", "ur-roman": ""}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payment_accounts_updated_at on public.payment_accounts;
create trigger trg_payment_accounts_updated_at
before update on public.payment_accounts
for each row execute function public.set_updated_at();

create index if not exists idx_payment_accounts_active
  on public.payment_accounts(is_active, sort_order asc);

-- RLS: payment_accounts
alter table public.payment_accounts enable row level security;

drop policy if exists "Public can view active payment accounts" on public.payment_accounts;
create policy "Public can view active payment accounts"
  on public.payment_accounts for select
  to anon, authenticated
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert payment accounts" on public.payment_accounts;
create policy "Admins can insert payment accounts"
  on public.payment_accounts for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update payment accounts" on public.payment_accounts;
create policy "Admins can update payment accounts"
  on public.payment_accounts for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete payment accounts" on public.payment_accounts;
create policy "Admins can delete payment accounts"
  on public.payment_accounts for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 2. TABLE: payments
-- =============================================================================
-- Stores payment attempts, manual proof submissions, mock gateway events,
-- and future real gateway responses.
-- =============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null check (
    provider in ('manual', 'mock', 'jazzcash', 'easypaisa', 'payfast', 'safepay', 'other')
  ),
  method text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null default 'PKR',
  status text not null default 'initiated' check (
    status in ('initiated', 'submitted', 'verified', 'rejected', 'succeeded', 'failed', 'refunded')
  ),
  transaction_id text null check (transaction_id is null or char_length(btrim(transaction_id)) <= 100),
  provider_reference text null check (provider_reference is null or char_length(btrim(provider_reference)) <= 255),
  proof_path text null check (proof_path is null or char_length(btrim(proof_path)) <= 500),
  submitted_at timestamptz null,
  verified_by uuid null references public.profiles(id) on delete set null,
  verified_at timestamptz null,
  reject_reason text null check (reject_reason is null or char_length(btrim(reject_reason)) <= 500),
  idempotency_key text null unique,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payments_updated_at on public.payments;
create trigger trg_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

create index if not exists idx_payments_order_id on public.payments(order_id, created_at desc);
create index if not exists idx_payments_status on public.payments(status, created_at desc);
create index if not exists idx_payments_tx_id on public.payments(transaction_id);

-- Enforce unique (provider, provider_reference) where not null
create unique index if not exists idx_payments_provider_ref
  on public.payments(provider, provider_reference)
  where provider_reference is not null;

-- RLS: payments
alter table public.payments enable row level security;

drop policy if exists "Customers can view own payments" on public.payments;
create policy "Customers can view own payments"
  on public.payments for select
  to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.orders o
       where o.id = payments.order_id
         and o.user_id = auth.uid()
    )
  );

drop policy if exists "Admins can insert payments directly" on public.payments;
create policy "Admins can insert payments directly"
  on public.payments for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can update payments" on public.payments;
create policy "Admins can update payments"
  on public.payments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete payments" on public.payments;
create policy "Admins can delete payments"
  on public.payments for delete
  to authenticated
  using (public.is_admin());

-- =============================================================================
-- 3. TABLE: payment_logs
-- =============================================================================
-- Sanitised event audit trail for payment lifecycle events. Admin-only.
-- =============================================================================
create table if not exists public.payment_logs (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid null references public.payments(id) on delete cascade,
  order_id uuid null references public.orders(id) on delete cascade,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_payment_logs_payment_id on public.payment_logs(payment_id, created_at desc);
create index if not exists idx_payment_logs_order_id on public.payment_logs(order_id, created_at desc);

-- RLS: payment_logs
alter table public.payment_logs enable row level security;

drop policy if exists "Admins can select payment logs" on public.payment_logs;
create policy "Admins can select payment logs"
  on public.payment_logs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "Admins can insert payment logs" on public.payment_logs;
create policy "Admins can insert payment logs"
  on public.payment_logs for insert
  to authenticated
  with check (public.is_admin());

-- =============================================================================
-- 4. TABLE: payment_settings (Single row id = 1)
-- =============================================================================
create table if not exists public.payment_settings (
  id int primary key default 1 check (id = 1),
  manual_enabled boolean not null default true,
  mock_gateway_enabled boolean not null default false,
  gateway_provider text null,
  require_proof boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payment_settings_updated_at on public.payment_settings;
create trigger trg_payment_settings_updated_at
before update on public.payment_settings
for each row execute function public.set_updated_at();

-- Seed initial row
insert into public.payment_settings (
  id,
  manual_enabled,
  mock_gateway_enabled,
  gateway_provider,
  require_proof
)
values (1, true, false, null, true)
on conflict (id) do nothing;

-- Sync trigger: keep delivery_settings.online_payment_enabled in sync
create or replace function public.sync_delivery_online_payment_flag()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.delivery_settings
     set online_payment_enabled = (
           new.manual_enabled or
           new.mock_gateway_enabled or
           new.gateway_provider is not null
         ),
         updated_at = now()
   where id = 1;
  return new;
end;
$$;

drop trigger if exists trg_sync_delivery_online_flag on public.payment_settings;
create trigger trg_sync_delivery_online_flag
after insert or update on public.payment_settings
for each row execute function public.sync_delivery_online_payment_flag();

-- Immediately run sync once
update public.delivery_settings
   set online_payment_enabled = exists (
         select 1 from public.payment_settings
          where id = 1
            and (manual_enabled = true or mock_gateway_enabled = true or gateway_provider is not null)
       )
 where id = 1;

-- RLS: payment_settings
alter table public.payment_settings enable row level security;

drop policy if exists "Public can select payment settings" on public.payment_settings;
create policy "Public can select payment settings"
  on public.payment_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Admins can update payment settings" on public.payment_settings;
create policy "Admins can update payment settings"
  on public.payment_settings for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 5. PRIVATE STORAGE BUCKET: payment-proofs
-- =============================================================================
-- Allowed: image/png, image/jpeg, image/webp, application/pdf (Max 3 MB = 3145728)
-- Customers insert only to pending/<uuid>.<ext>
-- Admins view/delete via signed URLs
-- =============================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'payment-proofs',
  'payment-proofs',
  false,
  3145728,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = 3145728,
    allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];

drop policy if exists "Anyone can upload pending payment proofs" on storage.objects;
create policy "Anyone can upload pending payment proofs"
  on storage.objects for insert
  to anon, authenticated
  with check (
    bucket_id = 'payment-proofs'
    and name ~ '^pending/[a-zA-Z0-9_\-\.]+\.(png|jpg|jpeg|webp|pdf)$'
  );

drop policy if exists "Admins can view payment proofs" on storage.objects;
create policy "Admins can view payment proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

drop policy if exists "Admins can delete payment proofs" on storage.objects;
create policy "Admins can delete payment proofs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());

-- =============================================================================
-- 6. RPC 1: get_payment_options()
-- =============================================================================
-- Public helper returning active payment accounts, manual payment status,
-- and whether the mock gateway is available (only when demo_mode = true).
-- =============================================================================
create or replace function public.get_payment_options()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ps public.payment_settings%rowtype;
  v_demo_mode boolean := false;
  v_mock_available boolean := false;
  v_accounts jsonb := '[]'::jsonb;
begin
  select * into v_ps from public.payment_settings where id = 1;
  select coalesce(demo_mode, false) into v_demo_mode from public.site_settings where id = 1;

  v_mock_available := (coalesce(v_ps.mock_gateway_enabled, false) and coalesce(v_demo_mode, false));

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', pa.id,
        'method', pa.method,
        'title', pa.title,
        'account_title', pa.account_title,
        'account_number', pa.account_number,
        'iban', pa.iban,
        'bank_name', pa.bank_name,
        'instructions', pa.instructions,
        'sort_order', pa.sort_order
      )
      order by pa.sort_order asc, pa.created_at asc
    ),
    '[]'::jsonb
  )
  into v_accounts
  from public.payment_accounts pa
  where pa.is_active = true;

  return jsonb_build_object(
    'online_enabled', coalesce(v_ps.manual_enabled, true) or v_mock_available,
    'manual_enabled', coalesce(v_ps.manual_enabled, true),
    'mock_gateway_enabled', v_mock_available,
    'gateway_provider', v_ps.gateway_provider,
    'require_proof', coalesce(v_ps.require_proof, true),
    'is_demo_mode', v_demo_mode,
    'accounts', v_accounts
  );
end;
$$;

grant execute on function public.get_payment_options() to anon, authenticated;

-- =============================================================================
-- 7. RPC 2: submit_payment_proof(...)
-- =============================================================================
-- Public two-factor submission (order_no + customer phone).
-- Order must be unpaid (payment_status in 'pending', 'failed').
-- Validates transaction_id, proof_path, and rate limits (5/hour per IP, 5 per order).
-- Inserts/updates payment as 'submitted', sets order payment_status = 'pending', logs.
-- =============================================================================
create or replace function public.submit_payment_proof(
  p_order_no text,
  p_phone text,
  p_method text,
  p_transaction_id text,
  p_proof_path text default null,
  p_amount numeric default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_order_no text := upper(btrim(coalesce(p_order_no, '')));
  v_phone_clean text;
  v_phone_last10 text;
  v_tx_id text := btrim(coalesce(p_transaction_id, ''));
  v_proof text := nullif(btrim(coalesce(p_proof_path, '')), '');
  v_method text := lower(btrim(coalesce(p_method, 'bank_transfer')));
  v_ip_hash text;
  v_ip_count int := 0;
  v_order_attempts int := 0;
  v_payment public.payments%rowtype;
  v_ps public.payment_settings%rowtype;
  v_amount numeric(12,2);
  v_amount_mismatch boolean := false;
  v_is_demo boolean := false;
begin
  select * into v_ps from public.payment_settings where id = 1;
  select coalesce(demo_mode, false) into v_is_demo from public.site_settings where id = 1;

  if v_order_no = '' or p_phone is null or btrim(p_phone) = '' then
    raise exception 'invalid_input';
  end if;

  v_phone_clean := regexp_replace(btrim(p_phone), '[\s\-]', '', 'g');
  if v_phone_clean !~ '^(\+92|0)3[0-9]{9}$' then
    raise exception 'invalid_input';
  end if;
  v_phone_last10 := public.normalize_phone_last10(v_phone_clean);

  if char_length(v_tx_id) < 3 or char_length(v_tx_id) > 100 then
    raise exception 'invalid_input';
  end if;

  -- Validate proof_path pattern if provided or required
  if v_proof is not null then
    if v_proof !~ '^pending/[a-zA-Z0-9_\-\.]+\.(png|jpg|jpeg|webp|pdf)$' then
      raise exception 'invalid_proof_path';
    end if;
  elsif coalesce(v_ps.require_proof, true) and not v_is_demo then
    raise exception 'proof_required';
  end if;

  -- 1. Rate limiting: 5 per hour per IP hash
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)::int
      into v_ip_count
      from public.payment_logs l
     where (l.payload->>'ip_hash') = v_ip_hash
       and l.event = 'proof_submitted'
       and l.created_at >= now() - interval '1 hour';

    if v_ip_count >= 5 then
      raise exception 'rate_limited';
    end if;
  end if;

  -- 2. Lookup order with two factors
  select *
    into v_order
    from public.orders o
   where upper(o.order_no) = v_order_no
     and public.normalize_phone_last10(o.customer_phone) = v_phone_last10
   for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  -- Order must not already be paid or cod_collected or refunded
  if v_order.payment_status in ('paid', 'cod_collected', 'refunded') then
    raise exception 'already_paid';
  end if;

  -- 3. Rate limiting per order: max 5 proof submissions
  select count(*)::int
    into v_order_attempts
    from public.payment_logs l
   where l.order_id = v_order.id
     and l.event = 'proof_submitted'
     and l.created_at >= now() - interval '24 hours';

  if v_order_attempts >= 5 then
    raise exception 'rate_limited';
  end if;

  -- 4. Amount validation
  v_amount := coalesce(p_amount, v_order.total);
  if abs(v_amount - v_order.total) > 0.01 then
    v_amount_mismatch := true;
  end if;

  -- 5. Insert new payment or update existing submitted/rejected payment
  insert into public.payments (
    order_id,
    provider,
    method,
    amount,
    currency,
    status,
    transaction_id,
    proof_path,
    submitted_at,
    is_demo
  )
  values (
    v_order.id,
    'manual',
    v_method,
    v_amount,
    'PKR',
    'submitted',
    v_tx_id,
    v_proof,
    now(),
    v_order.is_demo
  )
  returning * into v_payment;

  -- Update order payment_status to 'pending' (awaiting admin verification)
  update public.orders
     set payment_status = 'pending',
         updated_at = now()
   where id = v_order.id;

  -- Record audit log
  insert into public.payment_logs (
    payment_id,
    order_id,
    event,
    payload
  )
  values (
    v_payment.id,
    v_order.id,
    'proof_submitted',
    jsonb_build_object(
      'order_no', v_order.order_no,
      'method', v_method,
      'transaction_id', v_tx_id,
      'amount', v_amount,
      'order_total', v_order.total,
      'amount_mismatch', v_amount_mismatch,
      'proof_path', v_proof,
      'ip_hash', v_ip_hash
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_no', v_order.order_no,
    'status', 'submitted',
    'amount', v_amount,
    'amount_mismatch', v_amount_mismatch
  );
end;
$$;

grant execute on function public.submit_payment_proof(text, text, text, text, text, numeric) to anon, authenticated;

-- =============================================================================
-- 8. RPC 3: admin_verify_payment(p_payment_id uuid, p_note text)
-- =============================================================================
-- Admin approves a submitted/initiated payment.
-- Sets payment status = 'verified', order payment_status = 'paid'.
-- If order status is 'placed', advances it to 'confirmed'. Logs history & audit.
-- =============================================================================
create or replace function public.admin_verify_payment(
  p_payment_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_clean_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_prev_order_status text;
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  if v_payment.status in ('verified', 'succeeded') then
    return jsonb_build_object('success', true, 'already_verified', true, 'payment_id', v_payment.id);
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  -- 1. Update payment
  update public.payments
     set status = 'verified',
         verified_by = auth.uid(),
         verified_at = now(),
         reject_reason = null,
         updated_at = now()
   where id = v_payment.id
   returning * into v_payment;

  -- 2. Update order payment status
  v_prev_order_status := v_order.status;

  update public.orders
     set payment_status = 'paid',
         status = case when v_order.status = 'placed' then 'confirmed' else v_order.status end,
         updated_at = now()
   where id = v_order.id
   returning * into v_order;

  -- 3. If order was 'placed', log transition to 'confirmed'
  if v_prev_order_status = 'placed' then
    insert into public.order_status_history (
      order_id,
      from_status,
      to_status,
      note,
      changed_by
    )
    values (
      v_order.id,
      'placed',
      'confirmed',
      coalesce(v_clean_note, 'Payment verified (' || v_payment.method || ' - ' || coalesce(v_payment.transaction_id, '') || ')'),
      auth.uid()
    );
  end if;

  -- 4. Audit log
  insert into public.payment_logs (payment_id, order_id, event, payload)
  values (
    v_payment.id,
    v_order.id,
    'payment_verified',
    jsonb_build_object(
      'order_no', v_order.order_no,
      'verified_by', auth.uid(),
      'note', v_clean_note,
      'amount', v_payment.amount
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_no', v_order.order_no,
    'payment_status', v_order.payment_status,
    'order_status', v_order.status
  );
end;
$$;

grant execute on function public.admin_verify_payment(uuid, text) to authenticated;

-- =============================================================================
-- 9. RPC 4: admin_reject_payment(p_payment_id uuid, p_reason text)
-- =============================================================================
-- Admin rejects an invalid/unmatched payment submission with a clear reason.
-- Sets payment status = 'rejected', order payment_status = 'failed' (customer can resubmit).
-- =============================================================================
create or replace function public.admin_reject_payment(
  p_payment_id uuid,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_clean_reason text := btrim(coalesce(p_reason, ''));
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  if char_length(v_clean_reason) < 3 then
    raise exception 'reason_required';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  -- 1. Update payment
  update public.payments
     set status = 'rejected',
         reject_reason = v_clean_reason,
         updated_at = now()
   where id = v_payment.id
   returning * into v_payment;

  -- 2. Update order payment status
  update public.orders
     set payment_status = 'failed',
         updated_at = now()
   where id = v_order.id
   returning * into v_order;

  -- 3. Audit log
  insert into public.payment_logs (payment_id, order_id, event, payload)
  values (
    v_payment.id,
    v_order.id,
    'payment_rejected',
    jsonb_build_object(
      'order_no', v_order.order_no,
      'rejected_by', auth.uid(),
      'reason', v_clean_reason,
      'amount', v_payment.amount
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_no', v_order.order_no,
    'payment_status', v_order.payment_status,
    'reject_reason', v_payment.reject_reason
  );
end;
$$;

grant execute on function public.admin_reject_payment(uuid, text) to authenticated;

-- =============================================================================
-- 10. RPC 5: admin_mark_refunded(p_payment_id uuid, p_note text)
-- =============================================================================
-- Bookkeeping: marks payment status = 'refunded' and order payment_status = 'refunded'.
-- Actual cash/gateway transfer is executed outside the database.
-- =============================================================================
create or replace function public.admin_mark_refunded(
  p_payment_id uuid,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_clean_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not public.is_admin() then
    raise exception 'unauthorized';
  end if;

  select * into v_payment from public.payments where id = p_payment_id for update;
  if not found then
    raise exception 'payment_not_found';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  update public.payments
     set status = 'refunded',
         updated_at = now()
   where id = v_payment.id
   returning * into v_payment;

  update public.orders
     set payment_status = 'refunded',
         updated_at = now()
   where id = v_order.id
   returning * into v_order;

  insert into public.payment_logs (payment_id, order_id, event, payload)
  values (
    v_payment.id,
    v_order.id,
    'payment_refunded',
    jsonb_build_object(
      'order_no', v_order.order_no,
      'refunded_by', auth.uid(),
      'note', v_clean_note,
      'amount', v_payment.amount
    )
  );

  return jsonb_build_object(
    'success', true,
    'payment_id', v_payment.id,
    'order_no', v_order.order_no,
    'payment_status', 'refunded'
  );
end;
$$;

grant execute on function public.admin_mark_refunded(uuid, text) to authenticated;

-- =============================================================================
-- 11. RPC 6: mock_gateway_start(p_order_no text, p_phone text)
-- =============================================================================
-- DEMO ONLY: Refuses to run unless site_settings.demo_mode = true AND
-- payment_settings.mock_gateway_enabled = true.
-- Creates a payment row with provider = 'mock', status = 'initiated',
-- and returns a secure one-time token (SHA-256 hash stored in provider_reference).
-- =============================================================================
create or replace function public.mock_gateway_start(
  p_order_no text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_ps public.payment_settings%rowtype;
  v_is_demo boolean := false;
  v_order_no text := upper(btrim(coalesce(p_order_no, '')));
  v_phone_last10 text;
  v_token text;
  v_token_hash text;
  v_payment public.payments%rowtype;
begin
  select coalesce(demo_mode, false) into v_is_demo from public.site_settings where id = 1;
  select * into v_ps from public.payment_settings where id = 1;

  if not v_is_demo or not coalesce(v_ps.mock_gateway_enabled, false) then
    raise exception 'mock_gateway_disabled';
  end if;

  if v_order_no = '' or p_phone is null then
    raise exception 'invalid_input';
  end if;

  v_phone_last10 := public.normalize_phone_last10(p_phone);

  select *
    into v_order
    from public.orders o
   where upper(o.order_no) = v_order_no
     and public.normalize_phone_last10(o.customer_phone) = v_phone_last10
   for update;

  if not found then
    raise exception 'order_not_found';
  end if;

  if v_order.payment_status in ('paid', 'cod_collected', 'refunded') then
    raise exception 'already_paid';
  end if;

  -- Generate secure random 32-byte hex token and its sha256 hash
  v_token := encode(gen_random_bytes(24), 'hex');
  v_token_hash := encode(digest(v_token, 'sha256'), 'hex');

  insert into public.payments (
    order_id,
    provider,
    method,
    amount,
    currency,
    status,
    provider_reference,
    is_demo
  )
  values (
    v_order.id,
    'mock',
    'mock_card',
    v_order.total,
    'PKR',
    'initiated',
    v_token_hash,
    true
  )
  returning * into v_payment;

  insert into public.payment_logs (payment_id, order_id, event, payload)
  values (
    v_payment.id,
    v_order.id,
    'mock_gateway_initiated',
    jsonb_build_object(
      'order_no', v_order.order_no,
      'amount', v_order.total,
      'token_hash_prefix', substring(v_token_hash from 1 for 8)
    )
  );

  return jsonb_build_object(
    'token', v_token,
    'order_no', v_order.order_no,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'amount', v_order.total,
    'city', v_order.city
  );
end;
$$;

grant execute on function public.mock_gateway_start(text, text) to anon, authenticated;

-- =============================================================================
-- 12. RPC 7: mock_gateway_complete(p_token text, p_outcome text)
-- =============================================================================
-- DEMO ONLY: Refuses to run unless site_settings.demo_mode = true.
-- Applies payment simulation result idempotently (never processes twice).
-- If success: payment status = 'succeeded', order payment_status = 'paid', advances 'placed' to 'confirmed'.
-- If failure: payment status = 'failed', order payment_status = 'failed'.
-- =============================================================================
create or replace function public.mock_gateway_complete(
  p_token text,
  p_outcome text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_demo boolean := false;
  v_token_hash text;
  v_outcome text := lower(btrim(coalesce(p_outcome, '')));
  v_payment public.payments%rowtype;
  v_order public.orders%rowtype;
  v_prev_order_status text;
begin
  select coalesce(demo_mode, false) into v_is_demo from public.site_settings where id = 1;
  if not v_is_demo then
    raise exception 'mock_gateway_disabled';
  end if;

  if v_outcome not in ('success', 'failure') then
    raise exception 'invalid_outcome';
  end if;

  if p_token is null or btrim(p_token) = '' then
    raise exception 'invalid_token';
  end if;

  v_token_hash := encode(digest(btrim(p_token), 'sha256'), 'hex');

  select *
    into v_payment
    from public.payments p
   where p.provider = 'mock'
     and p.provider_reference = v_token_hash
   for update;

  if not found then
    raise exception 'token_not_found';
  end if;

  select * into v_order from public.orders where id = v_payment.order_id for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  -- Idempotency check: if already completed, return existing status without re-running
  if v_payment.status in ('succeeded', 'failed', 'verified') then
    return jsonb_build_object(
      'idempotent', true,
      'order_no', v_order.order_no,
      'phone', v_order.customer_phone,
      'payment_status', v_order.payment_status,
      'order_status', v_order.status,
      'outcome', v_payment.status
    );
  end if;

  v_prev_order_status := v_order.status;

  if v_outcome = 'success' then
    update public.payments
       set status = 'succeeded',
           transaction_id = 'MOCK-TX-' || substring(v_token_hash from 1 for 10),
           verified_at = now(),
           updated_at = now()
     where id = v_payment.id
     returning * into v_payment;

    update public.orders
       set payment_status = 'paid',
           status = case when v_order.status = 'placed' then 'confirmed' else v_order.status end,
           updated_at = now()
     where id = v_order.id
     returning * into v_order;

    if v_prev_order_status = 'placed' then
      insert into public.order_status_history (
        order_id, from_status, to_status, note, changed_by
      )
      values (
        v_order.id, 'placed', 'confirmed', 'Paid via Demo Mock Gateway (' || v_payment.transaction_id || ')', null
      );
    end if;

    insert into public.payment_logs (payment_id, order_id, event, payload)
    values (
      v_payment.id,
      v_order.id,
      'mock_gateway_succeeded',
      jsonb_build_object('order_no', v_order.order_no, 'amount', v_payment.amount, 'tx_id', v_payment.transaction_id)
    );
  else
    update public.payments
       set status = 'failed',
           reject_reason = 'Simulated payment decline by demo card portal',
           updated_at = now()
     where id = v_payment.id
     returning * into v_payment;

    update public.orders
       set payment_status = 'failed',
           updated_at = now()
     where id = v_order.id
     returning * into v_order;

    insert into public.payment_logs (payment_id, order_id, event, payload)
    values (
      v_payment.id,
      v_order.id,
      'mock_gateway_failed',
      jsonb_build_object('order_no', v_order.order_no, 'reason', 'Declined in demo checkout simulation')
    );
  end if;

  return jsonb_build_object(
    'idempotent', false,
    'order_no', v_order.order_no,
    'phone', v_order.customer_phone,
    'payment_status', v_order.payment_status,
    'order_status', v_order.status,
    'outcome', v_payment.status
  );
end;
$$;

grant execute on function public.mock_gateway_complete(text, text) to anon, authenticated;

-- =============================================================================
-- 13. RPC 8: apply_gateway_result(...) (SERVICE-ROLE ONLY)
-- =============================================================================
-- The authoritative server-side webhook entry point for real gateways
-- (JazzCash, Easypaisa, PayFast, Safepay) invoked from Edge Functions.
-- Not granted to anon/authenticated.
-- Idempotent, verifies amount, updates payment & order, logs payload.
-- =============================================================================
create or replace function public.apply_gateway_result(
  p_provider text,
  p_provider_reference text,
  p_order_no text,
  p_amount numeric,
  p_status text,
  p_raw jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_provider text := lower(btrim(coalesce(p_provider, 'other')));
  v_ref text := btrim(coalesce(p_provider_reference, ''));
  v_order_no text := upper(btrim(coalesce(p_order_no, '')));
  v_status text := lower(btrim(coalesce(p_status, '')));
  v_order public.orders%rowtype;
  v_payment public.payments%rowtype;
  v_existing public.payments%rowtype;
  v_prev_order_status text;
begin
  if v_ref = '' or v_order_no = '' then
    raise exception 'invalid_input';
  end if;

  -- 1. Check idempotency: if already processed for this provider + reference
  select *
    into v_existing
    from public.payments
   where provider = v_provider
     and provider_reference = v_ref;

  if found and v_existing.status in ('succeeded', 'verified') then
    return jsonb_build_object('processed', false, 'reason', 'duplicate', 'payment_id', v_existing.id);
  end if;

  -- 2. Lookup order
  select * into v_order from public.orders where upper(order_no) = v_order_no for update;
  if not found then
    raise exception 'order_not_found';
  end if;

  -- 3. Verify amount
  if p_amount is not null and abs(p_amount - v_order.total) > 0.01 then
    raise exception 'amount_mismatch';
  end if;

  v_prev_order_status := v_order.status;

  -- 4. Upsert payment record
  if found then
    update public.payments
       set status = case when v_status = 'succeeded' then 'succeeded' else 'failed' end,
           amount = coalesce(p_amount, v_order.total),
           transaction_id = coalesce(p_raw->>'transaction_id', v_ref),
           updated_at = now()
     where id = v_existing.id
     returning * into v_payment;
  else
    insert into public.payments (
      order_id,
      provider,
      method,
      amount,
      currency,
      status,
      provider_reference,
      transaction_id,
      is_demo
    )
    values (
      v_order.id,
      v_provider,
      v_provider,
      coalesce(p_amount, v_order.total),
      'PKR',
      case when v_status = 'succeeded' then 'succeeded' else 'failed' end,
      v_ref,
      coalesce(p_raw->>'transaction_id', v_ref),
      v_order.is_demo
    )
    returning * into v_payment;
  end if;

  -- 5. Update order
  if v_status = 'succeeded' then
    update public.orders
       set payment_status = 'paid',
           status = case when v_order.status = 'placed' then 'confirmed' else v_order.status end,
           updated_at = now()
     where id = v_order.id
     returning * into v_order;

    if v_prev_order_status = 'placed' then
      insert into public.order_status_history (
        order_id, from_status, to_status, note, changed_by
      )
      values (
        v_order.id, 'placed', 'confirmed', 'Gateway payment captured (' || v_provider || ' #' || v_ref || ')', null
      );
    end if;
  else
    update public.orders
       set payment_status = 'failed',
           updated_at = now()
     where id = v_order.id
     returning * into v_order;
  end if;

  -- 6. Audit log
  insert into public.payment_logs (payment_id, order_id, event, payload)
  values (
    v_payment.id,
    v_order.id,
    'gateway_webhook_applied',
    jsonb_build_object(
      'provider', v_provider,
      'reference', v_ref,
      'status', v_status,
      'order_no', v_order.order_no,
      'raw', p_raw
    )
  );

  return jsonb_build_object(
    'processed', true,
    'payment_id', v_payment.id,
    'order_no', v_order.order_no,
    'payment_status', v_order.payment_status
  );
end;
$$;

-- STRICT: Revoke from public, anon, and authenticated so only service_role can call it
revoke all on function public.apply_gateway_result(text, text, text, numeric, text, jsonb) from public;
revoke all on function public.apply_gateway_result(text, text, text, numeric, text, jsonb) from anon;
revoke all on function public.apply_gateway_result(text, text, text, numeric, text, jsonb) from authenticated;

-- =============================================================================
-- 14. RPC 9: ENHANCE lookup_order_status TO INCLUDE latest_payment
-- =============================================================================
create or replace function public.lookup_order_status(
  p_order_no text,
  p_phone text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_no text := upper(btrim(coalesce(p_order_no, '')));
  v_phone_last10 text;
  v_order public.orders%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_history jsonb := '[]'::jsonb;
  v_latest_payment jsonb := null;
  v_ip_hash text;
  v_attempts int := 0;
begin
  if v_order_no = '' or p_phone is null then
    raise exception 'not_found';
  end if;

  v_phone_last10 := public.normalize_phone_last10(p_phone);

  -- Rate limiting: 10 attempts per 15 minutes per IP hash
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

  -- Include latest payment record (if any) sanitized for public customer viewing
  select jsonb_build_object(
    'id', p.id,
    'provider', p.provider,
    'method', p.method,
    'amount', p.amount,
    'currency', p.currency,
    'status', p.status,
    'transaction_id', p.transaction_id,
    'proof_path', p.proof_path,
    'submitted_at', p.submitted_at,
    'verified_at', p.verified_at,
    'reject_reason', p.reject_reason
  )
  into v_latest_payment
  from public.payments p
  where p.order_id = v_order.id
  order by p.created_at desc
  limit 1;

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
    'history', v_history,
    'latest_payment', v_latest_payment
  );
end;
$$;

grant execute on function public.lookup_order_status(text, text) to anon, authenticated;

-- =============================================================================
-- VERIFICATION BLOCK (Documentation & Check Queries)
-- =============================================================================
-- select table_name from information_schema.tables where table_schema = 'public' and table_name in ('payment_accounts', 'payments', 'payment_logs', 'payment_settings');
-- select tablename, rowsecurity from pg_tables where schemaname = 'public' and tablename in ('payment_accounts', 'payments', 'payment_logs', 'payment_settings');
-- select proname from pg_proc where proname in ('get_payment_options', 'submit_payment_proof', 'admin_verify_payment', 'admin_reject_payment', 'admin_mark_refunded', 'mock_gateway_start', 'mock_gateway_complete', 'apply_gateway_result');
