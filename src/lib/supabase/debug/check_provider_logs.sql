-- Read-only debug checks for provider logs.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'llm_provider_logs';

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'llm_provider_logs';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'llm_provider_logs'
order by policyname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'llm_provider_logs'
order by indexname;

select
  id,
  user_id,
  provider_name,
  model_name,
  status,
  latency_ms,
  error_message,
  created_at
from public.llm_provider_logs
order by created_at desc
limit 20;