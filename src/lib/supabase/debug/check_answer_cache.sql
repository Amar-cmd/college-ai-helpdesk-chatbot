-- Read-only debug checks for answer cache.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'answer_cache';

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'answer_cache';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'answer_cache'
order by policyname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'answer_cache'
order by indexname;

select
  id,
  normalized_question,
  original_question,
  source_type,
  provider_used,
  expires_at,
  hit_count,
  created_at,
  updated_at
from public.answer_cache
order by updated_at desc
limit 20;