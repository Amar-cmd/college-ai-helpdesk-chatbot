-- Read-only debug checks for rate limit logs.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'rate_limit_logs';

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'rate_limit_logs';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'rate_limit_logs'
order by policyname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'rate_limit_logs'
order by indexname;

select
  id,
  user_id,
  scope,
  event_type,
  reason,
  created_at
from public.rate_limit_logs
order by created_at desc
limit 30;