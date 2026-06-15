-- Read-only debug checks for knowledge base setup.

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'knowledge_base';

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'knowledge_base';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'knowledge_base'
order by policyname;

select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'knowledge_base'
order by indexname;

select
  id,
  title,
  category,
  tags,
  is_active,
  created_by,
  created_at,
  updated_at
from public.knowledge_base
order by updated_at desc
limit 20;