-- =========================================================
-- Migration: 0007_create_rate_limit_logs.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates rate limit logs for tracking allowed and blocked
-- user message requests and global LLM traffic.
--
-- Affected tables:
-- - public.rate_limit_logs
--
-- Safe to run multiple times:
-- No, this is a normal migration and should be applied once.
--
-- Destructive:
-- No
--
-- Depends on:
-- - public.profiles
-- - public.set_updated_at()
-- - public.is_admin(uuid)
--
-- Rollback notes:
-- Drop public.rate_limit_logs if rollback is required.
-- =========================================================

-- 1. Extensions, if needed
-- gen_random_uuid() is already available from the initial migration.

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.
-- scope and event_type are protected using check constraints.

-- 3. Tables
create table public.rate_limit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  scope text not null check (scope in ('user_message', 'global_llm')),
  event_type text not null check (event_type in ('allowed', 'blocked')),
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint rate_limit_logs_reason_not_empty
    check (char_length(trim(reason)) > 0)
);

-- 4. Constraints
-- Primary key, foreign key, and check constraints are defined above.

-- 5. Indexes
-- Supports per-user rate limit checks.
create index idx_rate_limit_logs_user_id_created_at
on public.rate_limit_logs(user_id, created_at desc);

-- Supports global LLM call count checks.
create index idx_rate_limit_logs_scope_event_created_at
on public.rate_limit_logs(scope, event_type, created_at desc);

-- Supports recent admin diagnostics.
create index idx_rate_limit_logs_created_at
on public.rate_limit_logs(created_at desc);

-- 6. Functions
-- Uses existing public.set_updated_at().

-- 7. Triggers
create trigger set_rate_limit_logs_updated_at
before update on public.rate_limit_logs
for each row
execute function public.set_updated_at();

-- 8. RLS enablement
alter table public.rate_limit_logs enable row level security;

-- 9. Policies
create policy "Admins can read rate limit logs"
on public.rate_limit_logs
for select
to authenticated
using (public.is_admin(auth.uid()));

-- No authenticated insert/update/delete policy is added.
-- Backend server-side service role writes rate-limit logs.

-- 10. Comments
comment on table public.rate_limit_logs is
'Stores allowed and blocked rate-limit events for user messages and global LLM traffic.';

comment on column public.rate_limit_logs.user_id is
'User whose request triggered the rate-limit event.';

comment on column public.rate_limit_logs.scope is
'Rate-limit scope. user_message controls per-user message traffic. global_llm controls global LLM calls.';

comment on column public.rate_limit_logs.event_type is
'Whether the request was allowed or blocked.';

comment on column public.rate_limit_logs.reason is
'Short reason for the rate-limit decision.';

-- 11. Sanity check queries
-- Keep debug SELECT queries in supabase/debug/check_rate_limit_logs.sql