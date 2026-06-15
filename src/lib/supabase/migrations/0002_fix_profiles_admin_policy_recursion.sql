-- =========================================================
-- Migration: 0002_fix_profiles_admin_policy_recursion.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Fixes recursive admin role checks in profiles RLS policies by
-- moving admin verification into a security definer helper function.
--
-- Affected tables:
-- - public.profiles
--
-- Safe to run multiple times:
-- Yes, policies are dropped and recreated in a transaction.
--
-- Destructive:
-- No
--
-- Depends on:
-- - public.profiles
--
-- Rollback notes:
-- Drop the new policies and public.is_admin function if rollback is required.
-- =========================================================

begin;

-- 1. Extensions, if needed
-- No new extension required.

-- 2. Types / enums, if needed
-- No new type required.

-- 3. Tables
-- No table changes required.

-- 4. Constraints
-- No constraint changes required.

-- 5. Indexes
-- No index changes required.

-- 6. Functions
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- 7. Triggers
-- No trigger changes required.

-- 8. RLS enablement
alter table public.profiles enable row level security;

-- 9. Policies
drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can update profiles" on public.profiles;

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- 10. Comments
comment on function public.is_admin(uuid) is
'Checks whether a user has admin role without causing recursive profiles RLS policy evaluation.';

-- 11. Sanity check queries
-- Keep debug SELECT queries in supabase/debug/check_profiles_access.sql

commit;