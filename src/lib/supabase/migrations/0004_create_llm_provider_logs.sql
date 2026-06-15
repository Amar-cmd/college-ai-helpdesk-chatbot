-- =========================================================
-- Migration: 0004_create_llm_provider_logs.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates provider logs for recording LLM provider success,
-- failures, latency, and fallback behavior.
--
-- Affected tables:
-- - public.llm_provider_logs
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
-- Drop public.llm_provider_logs if rollback is required.
-- =========================================================

-- 1. Extensions, if needed
-- gen_random_uuid() is already available from the initial migration.

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.
-- Provider status is protected using a check constraint.

-- 3. Tables
create table public.llm_provider_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider_name text not null,
  model_name text,
  status text not null check (
    status in (
      'success',
      'failed',
      'rate_limited',
      'timeout',
      'auth_error',
      'server_error',
      'unknown_error'
    )
  ),
  latency_ms integer not null default 0 check (latency_ms >= 0),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint llm_provider_logs_provider_name_not_empty
    check (char_length(trim(provider_name)) > 0)
);

-- 4. Constraints
-- Primary key, foreign key, status check, and latency check are defined above.

-- 5. Indexes
-- Supports recent provider diagnostics.
create index idx_llm_provider_logs_created_at
on public.llm_provider_logs(created_at desc);

-- Supports user-specific provider debugging.
create index idx_llm_provider_logs_user_id
on public.llm_provider_logs(user_id);

-- Supports filtering by provider during diagnostics.
create index idx_llm_provider_logs_provider_name
on public.llm_provider_logs(provider_name);

-- 6. Functions
-- Uses existing public.set_updated_at().

-- 7. Triggers
create trigger set_llm_provider_logs_updated_at
before update on public.llm_provider_logs
for each row
execute function public.set_updated_at();

-- 8. RLS enablement
alter table public.llm_provider_logs enable row level security;

-- 9. Policies
create policy "Admins can read provider logs"
on public.llm_provider_logs
for select
to authenticated
using (public.is_admin(auth.uid()));

-- No authenticated insert/update/delete policy is added.
-- Backend server-side service role will write provider logs.

-- 10. Comments
comment on table public.llm_provider_logs is
'Stores LLM provider success, failure, latency, and fallback diagnostics.';

comment on column public.llm_provider_logs.user_id is
'User whose chat request triggered the provider attempt. Set null if the user is deleted.';

comment on column public.llm_provider_logs.provider_name is
'Provider attempted for the LLM response, such as gemini, groq, openrouter, cloudflare, or fallback.';

comment on column public.llm_provider_logs.model_name is
'Model attempted for the provider request.';

comment on column public.llm_provider_logs.status is
'Provider attempt status. Allowed values: success, failed, rate_limited, timeout, auth_error, server_error, unknown_error.';

comment on column public.llm_provider_logs.latency_ms is
'Provider attempt latency in milliseconds.';

comment on column public.llm_provider_logs.error_message is
'Short provider error message for debugging. Full prompts are not stored here.';

-- 11. Sanity check queries
-- Keep debug SELECT queries in supabase/debug/check_provider_logs.sql