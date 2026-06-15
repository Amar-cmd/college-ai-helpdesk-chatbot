-- Read-only debug checks for profile RLS and admin helper.

select routine_name, routine_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'is_admin';

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'profiles'
order by policyname;

select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename = 'profiles';

select id, email, full_name, role, created_at, updated_at
from public.profiles
order by created_at desc
limit 10;