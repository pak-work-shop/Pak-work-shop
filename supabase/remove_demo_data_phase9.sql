-- =============================================================================
-- PAK AUTO WORKS & PARTS — REMOVE PHASE 9 DEMO DATA
-- =============================================================================
-- Deletes demo records from chatbot_knowledge and chat_sessions (where is_demo = true).
-- Safe to run in production.
-- =============================================================================

do $$
begin
  if to_regclass('public.chat_messages') is not null then
    delete from public.chat_messages
    where session_id in (select id from public.chat_sessions where is_demo = true);
  end if;

  if to_regclass('public.chat_sessions') is not null then
    delete from public.chat_sessions where is_demo = true;
  end if;

  if to_regclass('public.chatbot_knowledge') is not null then
    delete from public.chatbot_knowledge where is_demo = true;
  end if;
end;
$$;
