-- =========================================================
-- Migration: 0006_create_answer_cache.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates answer cache table for storing reusable answers to
-- normalized repeated questions.
--
-- Affected tables:
-- - public.answer_cache
--
-- Safe to run multiple times:
-- No, this is a normal migration and should be applied once.
--
-- Destructive:
-- No
--
-- Depends on:
-- - public.set_updated_at()
-- - public.is_admin(uuid)
--
-- Rollback notes:
-- Drop public.answer_cache if rollback is required.
-- =========================================================

-- 1. Extensions, if needed
-- gen_random_uuid() is already available from the initial migration.

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.
-- source_type is protected using a check constraint.

-- 3. Tables
create table public.answer_cache (
  id uuid primary key default gen_random_uuid(),
  normalized_question text not null,
  original_question text not null,
  answer text not null,
  source_type text not null check (
    source_type in ('cache', 'knowledge', 'llm', 'fallback')
  ),
  provider_used text,
  expires_at timestamptz not null,
  hit_count integer not null default 0 check (hit_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint answer_cache_normalized_question_not_empty
    check (char_length(trim(normalized_question)) > 0),

  constraint answer_cache_original_question_not_empty
    check (char_length(trim(original_question)) > 0),

  constraint answer_cache_answer_not_empty
    check (char_length(trim(answer)) > 0),

  constraint answer_cache_answer_reasonable_length
    check (char_length(answer) <= 8000),

  constraint answer_cache_normalized_question_unique
    unique (normalized_question)
);

-- 4. Constraints
-- Primary key, check constraints, and unique constraint are defined above.

-- 5. Indexes
-- Supports fast lookup of cached answers by normalized question.
create index idx_answer_cache_normalized_question
on public.answer_cache(normalized_question);

-- Supports cleanup and validity checks for expired cache rows.
create index idx_answer_cache_expires_at
on public.answer_cache(expires_at);

-- Supports diagnostics by source type.
create index idx_answer_cache_source_type
on public.answer_cache(source_type);

-- 6. Functions
-- Uses existing public.set_updated_at().

-- 7. Triggers
create trigger set_answer_cache_updated_at
before update on public.answer_cache
for each row
execute function public.set_updated_at();

-- 8. RLS enablement
alter table public.answer_cache enable row level security;

-- 9. Policies
create policy "Admins can read answer cache"
on public.answer_cache
for select
to authenticated
using (public.is_admin(auth.uid()));

-- No authenticated insert/update/delete policy is added.
-- Backend server-side service role writes and updates cache rows.

-- 10. Comments
comment on table public.answer_cache is
'Stores reusable answers for normalized repeated questions to reduce LLM calls.';

comment on column public.answer_cache.normalized_question is
'Normalized question used as the cache lookup key.';

comment on column public.answer_cache.original_question is
'Original user question stored for debugging and admin review.';

comment on column public.answer_cache.answer is
'Cached assistant answer returned for repeated questions.';

comment on column public.answer_cache.source_type is
'Original answer source. Allowed values: cache, knowledge, llm, fallback.';

comment on column public.answer_cache.provider_used is
'Provider that originally generated the cached answer, if applicable.';

comment on column public.answer_cache.expires_at is
'Timestamp after which the cached answer should not be used.';

comment on column public.answer_cache.hit_count is
'Number of times this cached answer has been reused.';

-- 11. Sanity check queries
-- Keep debug SELECT queries in supabase/debug/check_answer_cache.sql