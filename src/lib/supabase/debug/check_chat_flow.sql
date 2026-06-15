-- Read-only debug checks for Step 3 chat persistence.

-- Check chat tables exist.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('chat_sessions', 'chat_messages')
order by table_name;

-- Check RLS status.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('chat_sessions', 'chat_messages')
order by tablename;

-- Check policies.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('chat_sessions', 'chat_messages')
order by tablename, policyname;

-- Check indexes.
select
  schemaname,
  tablename,
  indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('chat_sessions', 'chat_messages')
order by tablename, indexname;

-- Check recent sessions.
select id, user_id, title, created_at, updated_at
from public.chat_sessions
order by created_at desc
limit 10;

-- Check recent messages.
select id, session_id, user_id, role, provider_used, created_at
from public.chat_messages
order by created_at desc
limit 10;