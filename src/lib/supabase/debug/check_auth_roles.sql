-- Read-only debug checks for Step 1 auth/profile setup.

-- Check profiles table exists.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name = 'profiles';

-- Check RLS status.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'profiles';

-- Check profile policies.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

-- Check profile rows.
select id, email, full_name, role, created_at, updated_at
from public.profiles
order by created_at desc
limit 10;