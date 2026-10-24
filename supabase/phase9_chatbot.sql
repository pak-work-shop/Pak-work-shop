-- =============================================================================
-- PAK AUTO WORKS & PARTS — PHASE 9: CHATBOT SQL
-- =============================================================================
-- Safe to run multiple times (idempotent).
-- Prerequisites:
--   Phases 1 through 8 SQL files.
--
-- What this script creates:
--   1. chatbot_settings table (single row id = 1) & RLS
--   2. chatbot_knowledge table, indexes, & RLS
--   3. chat_sessions table, indexes, & RLS
--   4. chat_messages table, indexes, & RLS
--   5. RPC chat_rate_check (per-IP and per-session caps)
--   6. RPC chat_log (PII-masked audit logging respecting logging_enabled)
-- =============================================================================

-- =============================================================================
-- 1. CHATBOT SETTINGS
-- =============================================================================
create table if not exists public.chatbot_settings (
  id int primary key default 1 check (id = 1),
  enabled boolean not null default true,
  engine_mode text not null default 'auto' check (engine_mode in ('auto', 'local_only')),
  welcome_message jsonb not null default '{
    "en": "Assalam-o-Alaikum! I am your Pak Auto Works digital assistant. Tell me about your car or ask about services, parts, prices, and bookings.",
    "ur": "السلام علیکم! میں پاک آٹو ورکس کا ڈیجیٹل اسسٹنٹ ہوں۔ اپنی گاڑی کا مسئلہ بتائیں یا سروسز، پارٹس، قیمتوں اور بکنگ کے بارے میں پوچھیں۔",
    "ur-roman": "Assalam-o-Alaikum! Main Pak Auto Works ka digital assistant hoon. Apni gaari ka masla batayein ya services, parts, prices aur booking ke baray mein poochein."
  }'::jsonb,
  quick_replies jsonb not null default '[
    {
      "label": {"en": "Book a Service", "ur": "سروس بک کریں", "ur-roman": "Service Book Karein"},
      "prompt": {"en": "I want to book a car service", "ur": "مجھے سروس بک کرنی ہے", "ur-roman": "Mujhe service book karni hai"}
    },
    {
      "label": {"en": "Service Prices", "ur": "سروسز کی قیمتیں", "ur-roman": "Service Prices"},
      "prompt": {"en": "What are your service charges?", "ur": "سروسز کے ریٹ کیا ہیں؟", "ur-roman": "Services ke rate kya hain?"}
    },
    {
      "label": {"en": "Brake Problem", "ur": "بریک کا مسئلہ", "ur-roman": "Brake Ka Masla"},
      "prompt": {"en": "My car brakes are squeaking", "ur": "گاڑی کے بریک سے آواز آ رہی ہے", "ur-roman": "Gaari ke brake se awaz aa rahi hai"}
    },
    {
      "label": {"en": "AC Not Cooling", "ur": "اے سی ٹھنڈا نہیں ہے", "ur-roman": "AC Thanda Nahi"},
      "prompt": {"en": "My car AC is not cooling properly", "ur": "گاڑی کا اے سی ٹھنڈی ہوا نہیں دے رہا", "ur-roman": "Gaari ka AC thanda nahi kar raha"}
    },
    {
      "label": {"en": "Track My Car", "ur": "کام ٹریک کریں", "ur-roman": "Kaam Track Karein"},
      "prompt": {"en": "I want to track my repair job or order", "ur": "مجھے اپنا کام یا آرڈر ٹریک کرنا ہے", "ur-roman": "Mujhe apna kaam ya order track karna hai"}
    },
    {
      "label": {"en": "Delivery Charges", "ur": "ڈیلیوری چارجز", "ur-roman": "Delivery Charges"},
      "prompt": {"en": "What are the delivery charges for spare parts?", "ur": "اسپیئر پارٹس کی ڈیلیوری کے کیا چارجز ہیں؟", "ur-roman": "Spare parts ki delivery ke kya charges hain?"}
    }
  ]'::jsonb,
  disclaimer jsonb not null default '{
    "en": "Digital assistant guidance only. A physical inspection by our certified technicians is always required for final diagnosis.",
    "ur": "یہ صرف ڈیجیٹل رہنمائی ہے۔ حتمی تشخیص کے لیے ورکشاپ پر فزیکل معائنہ لازمی ہے۔",
    "ur-roman": "Sirf digital rehnumai. Final diagnosis ke liye workshop par physical inspection laazmi hai."
  }'::jsonb,
  max_messages_per_session int not null default 30 check (max_messages_per_session between 5 and 100),
  logging_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.chatbot_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists trg_chatbot_settings_updated_at on public.chatbot_settings;
create trigger trg_chatbot_settings_updated_at
before update on public.chatbot_settings
for each row execute function public.set_updated_at();

alter table public.chatbot_settings enable row level security;

drop policy if exists "Public can read chatbot settings" on public.chatbot_settings;
create policy "Public can read chatbot settings"
  on public.chatbot_settings for select
  using (true);

drop policy if exists "Admins can update chatbot settings" on public.chatbot_settings;
create policy "Admins can update chatbot settings"
  on public.chatbot_settings for update
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- 2. CHATBOT KNOWLEDGE BASE
-- =============================================================================
create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  title jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  content jsonb not null default '{"en":"","ur":"","ur-roman":""}'::jsonb,
  category text not null check (category in ('services', 'troubleshooting', 'parts', 'booking_delivery', 'workshop_info')),
  keywords jsonb not null default '{"en":[],"ur":[],"ur-roman":[]}'::jsonb,
  is_active boolean not null default true,
  sort_order int not null default 0,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chatbot_knowledge_active_sort on public.chatbot_knowledge(is_active, sort_order, created_at desc);
create index if not exists idx_chatbot_knowledge_category on public.chatbot_knowledge(category);
create index if not exists idx_chatbot_knowledge_demo on public.chatbot_knowledge(is_demo);

drop trigger if exists trg_chatbot_knowledge_updated_at on public.chatbot_knowledge;
create trigger trg_chatbot_knowledge_updated_at
before update on public.chatbot_knowledge
for each row execute function public.set_updated_at();

alter table public.chatbot_knowledge enable row level security;

drop policy if exists "Public can read active chatbot knowledge" on public.chatbot_knowledge;
create policy "Public can read active chatbot knowledge"
  on public.chatbot_knowledge for select
  using (is_active = true or public.is_admin());

drop policy if exists "Admins can insert chatbot knowledge" on public.chatbot_knowledge;
create policy "Admins can insert chatbot knowledge"
  on public.chatbot_knowledge for insert
  with check (public.is_admin());

drop policy if exists "Admins can update chatbot knowledge" on public.chatbot_knowledge;
create policy "Admins can update chatbot knowledge"
  on public.chatbot_knowledge for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can delete chatbot knowledge" on public.chatbot_knowledge;
create policy "Admins can delete chatbot knowledge"
  on public.chatbot_knowledge for delete
  using (public.is_admin());

-- =============================================================================
-- 3. CHAT SESSIONS & MESSAGES (Admin-only read, masked storage)
-- =============================================================================
create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  language text not null default 'en',
  vehicle jsonb null, -- { make, model, year } only
  engine_used text not null default 'local' check (engine_used in ('ai', 'local')),
  message_count int not null default 0,
  ip_hash text null,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_created on public.chat_sessions(created_at desc);
create index if not exists idx_chat_sessions_ip_hash on public.chat_sessions(ip_hash, created_at);
create index if not exists idx_chat_sessions_demo on public.chat_sessions(is_demo);

alter table public.chat_sessions enable row level security;

drop policy if exists "Admins can read chat sessions" on public.chat_sessions;
create policy "Admins can read chat sessions"
  on public.chat_sessions for select
  using (public.is_admin());

drop policy if exists "Admins can delete chat sessions" on public.chat_sessions;
create policy "Admins can delete chat sessions"
  on public.chat_sessions for delete
  using (public.is_admin());

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (length(content) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_messages_session on public.chat_messages(session_id, created_at asc);

alter table public.chat_messages enable row level security;

drop policy if exists "Admins can read chat messages" on public.chat_messages;
create policy "Admins can read chat messages"
  on public.chat_messages for select
  using (public.is_admin());

drop policy if exists "Admins can delete chat messages" on public.chat_messages;
create policy "Admins can delete chat messages"
  on public.chat_messages for delete
  using (public.is_admin());

-- =============================================================================
-- 4. RPC: CHAT RATE CHECK
-- =============================================================================
create or replace function public.chat_rate_check(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip_hash text;
  v_hour_count int := 0;
  v_session_count int := 0;
  v_max_session int := 30;
  v_enabled boolean := true;
begin
  select enabled, max_messages_per_session
  into v_enabled, v_max_session
  from public.chatbot_settings
  where id = 1;

  if not coalesce(v_enabled, true) then
    return jsonb_build_object(
      'allowed', false,
      'reason', 'disabled',
      'remaining', 0
    );
  end if;

  -- 1. Check IP hourly limit (60 user interactions / hour)
  v_ip_hash := public.get_request_ip_hash();
  if v_ip_hash is not null then
    select count(*)
    into v_hour_count
    from public.chat_sessions
    where ip_hash = v_ip_hash
      and created_at >= (now() - interval '1 hour');

    if v_hour_count > 60 then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'ip_rate_limited',
        'remaining', 0
      );
    end if;
  end if;

  -- 2. Check session message count
  if p_session_id is not null then
    select message_count
    into v_session_count
    from public.chat_sessions
    where id = p_session_id;

    if coalesce(v_session_count, 0) >= coalesce(v_max_session, 30) then
      return jsonb_build_object(
        'allowed', false,
        'reason', 'session_limit_reached',
        'remaining', 0
      );
    end if;
  end if;

  return jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'remaining', greatest(0, coalesce(v_max_session, 30) - coalesce(v_session_count, 0))
  );
end;
$$;

grant execute on function public.chat_rate_check(uuid) to anon, authenticated;

-- =============================================================================
-- 5. RPC: CHAT LOG (Masks PII, masks 7+ digit sequences)
-- =============================================================================
create or replace function public.chat_log(
  p_session_id uuid,
  p_language text,
  p_vehicle jsonb,
  p_engine text,
  p_user_message text,
  p_assistant_message text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_logging_enabled boolean := true;
  v_max_messages int := 30;
  v_ip_hash text;
  v_masked_user text;
  v_masked_assistant text;
  v_clean_vehicle jsonb := null;
  v_current_count int := 0;
  v_hourly_sessions int := 0;
  v_session_exists boolean := false;
  v_delta int := 0;
begin
  if p_session_id is null then
    return jsonb_build_object('ok', false, 'error', 'missing_session_id');
  end if;

  select logging_enabled, coalesce(max_messages_per_session, 30)
  into v_logging_enabled, v_max_messages
  from public.chatbot_settings
  where id = 1;

  if not coalesce(v_logging_enabled, true) then
    return jsonb_build_object('ok', true, 'logged', false);
  end if;

  v_ip_hash := public.get_request_ip_hash();

  -- 1. Check if session already exists and its current message count
  select true, coalesce(message_count, 0)
  into v_session_exists, v_current_count
  from public.chat_sessions
  where id = p_session_id;

  -- 2. If new session, enforce rate limit on new sessions per IP per hour (max 20)
  if (v_session_exists is null or not v_session_exists) and v_ip_hash is not null and v_ip_hash <> 'unknown' then
    select count(*)
    into v_hourly_sessions
    from public.chat_sessions
    where ip_hash = v_ip_hash
      and started_at > (now() - interval '1 hour');

    if v_hourly_sessions >= 20 then
      return jsonb_build_object('ok', false, 'error', 'hourly_session_limit_exceeded');
    end if;
  end if;

  -- 3. Enforce per-session message cap
  if v_current_count >= v_max_messages then
    return jsonb_build_object('ok', false, 'error', 'session_message_limit_reached');
  end if;

  -- Extract only make, model, year from vehicle object to guarantee no PII is stored
  if p_vehicle is not null and p_vehicle is distinct from 'null'::jsonb then
    v_clean_vehicle := jsonb_build_object(
      'make', p_vehicle->>'make',
      'model', p_vehicle->>'model',
      'year', p_vehicle->>'year'
    );
  end if;

  -- Mask any sequence of 7 or more digits (ASCII, Arabic-Indic, Extended Arabic-Indic) even when separated by spaces or dashes
  v_masked_user := regexp_replace(coalesce(p_user_message, ''), '([0-9٠-٩۰-۹][\s-]?){7,}', '***MASKED***', 'g');
  v_masked_assistant := regexp_replace(coalesce(p_assistant_message, ''), '([0-9٠-٩۰-۹][\s-]?){7,}', '***MASKED***', 'g');

  v_delta := case when length(btrim(v_masked_user)) > 0 and length(btrim(v_masked_assistant)) > 0 then 2 else 1 end;

  -- Upsert chat_session
  insert into public.chat_sessions (
    id, started_at, language, vehicle, engine_used, message_count, ip_hash, updated_at
  ) values (
    p_session_id,
    now(),
    coalesce(p_language, 'en'),
    v_clean_vehicle,
    coalesce(p_engine, 'local'),
    v_delta,
    v_ip_hash,
    now()
  )
  on conflict (id) do update set
    language = coalesce(excluded.language, public.chat_sessions.language),
    vehicle = coalesce(excluded.vehicle, public.chat_sessions.vehicle),
    engine_used = coalesce(excluded.engine_used, public.chat_sessions.engine_used),
    message_count = public.chat_sessions.message_count + v_delta,
    updated_at = now();

  -- Insert user message if provided
  if length(btrim(v_masked_user)) > 0 then
    insert into public.chat_messages (session_id, role, content)
    values (p_session_id, 'user', left(v_masked_user, 2000));
  end if;

  -- Insert assistant message if provided
  if length(btrim(v_masked_assistant)) > 0 then
    insert into public.chat_messages (session_id, role, content)
    values (p_session_id, 'assistant', left(v_masked_assistant, 2000));
  end if;

  return jsonb_build_object('ok', true, 'logged', true);
end;
$$;

grant execute on function public.chat_log(uuid, text, jsonb, text, text, text) to anon, authenticated;

-- =============================================================================
-- 6. VERIFICATION BLOCK
-- =============================================================================
/*
select count(*) from public.chatbot_settings;
select count(*) from public.chatbot_knowledge;
select count(*) from public.chat_sessions;
select count(*) from public.chat_messages;
select public.chat_rate_check(null);
*/
