-- =========================================================
-- Migration: 0001_init_profiles.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates the user profile foundation for student/admin roles.
-- Adds automatic profile creation when a Supabase auth user is created.
--
-- Affected tables:
-- - public.profiles
--
-- Safe to run multiple times:
-- No, this is a normal migration and should be applied once.
--
-- Destructive:
-- No
--
-- Depends on:
-- - auth.users
--
-- Rollback notes:
-- Drop trigger on auth.users first, then drop functions, then drop public.profiles
-- only if no later tables depend on profiles.
-- =========================================================

-- 1. Extensions, if needed
create extension if not exists pgcrypto with schema extensions;

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.
-- Role is protected using a check constraint for easier future migration.

-- 3. Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Constraints
-- Primary key, foreign key, and role check constraint are defined inline above.

-- 5. Indexes
-- No extra index is needed yet.
-- The primary key on id supports auth.uid() based profile lookups.

-- 6. Functions
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role
  )
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    'student'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = now();

  return new;
end;
$$;

-- 7. Triggers
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

-- Backfill profiles for existing auth users, if any.
insert into public.profiles (
  id,
  email,
  full_name,
  role
)
select
  au.id,
  coalesce(au.email, ''),
  nullif(au.raw_user_meta_data ->> 'full_name', ''),
  'student'
from auth.users au
on conflict (id) do nothing;

-- 8. RLS enablement
alter table public.profiles enable row level security;

-- 9. Policies
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "Admins can update profiles"
on public.profiles
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

-- 10. Comments
comment on table public.profiles is
'Stores application profiles for Supabase auth users, including student/admin role used for access control.';

comment on column public.profiles.id is
'Matches auth.users.id. This is the main application user identifier.';

comment on column public.profiles.email is
'User email copied from Supabase Auth for display and profile lookup.';

comment on column public.profiles.full_name is
'Optional display name collected during signup.';

comment on column public.profiles.role is
'Application role. Allowed values: student, admin. Defaults to student.';

comment on column public.profiles.created_at is
'Timestamp when the profile row was created.';

comment on column public.profiles.updated_at is
'Timestamp automatically updated by public.set_updated_at trigger.';

-- 11. Sanity check queries
-- Keep actual debug SELECT queries in supabase/debug/check_auth_roles.sql