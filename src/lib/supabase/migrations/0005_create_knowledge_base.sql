-- =========================================================
-- Migration: 0005_create_knowledge_base.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates the admin-managed knowledge base table for verified
-- college FAQs, notices, rules, and helpdesk information.
--
-- Affected tables:
-- - public.knowledge_base
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
-- Drop public.knowledge_base if rollback is required.
-- =========================================================

-- 1. Extensions, if needed
-- gen_random_uuid() is already available from the initial migration.

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.

-- 3. Tables
create table public.knowledge_base (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  category text not null default 'General',
  tags text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint knowledge_base_title_not_empty
    check (char_length(trim(title)) > 0),

  constraint knowledge_base_content_not_empty
    check (char_length(trim(content)) > 0),

  constraint knowledge_base_category_not_empty
    check (char_length(trim(category)) > 0),

  constraint knowledge_base_content_reasonable_length
    check (char_length(content) <= 12000)
);

-- 4. Constraints
-- Primary key, foreign key, and check constraints are defined inline above.

-- 5. Indexes
-- Supports filtering active rows during chatbot retrieval.
create index idx_knowledge_base_is_active
on public.knowledge_base(is_active);

-- Supports admin filtering and future category-based retrieval.
create index idx_knowledge_base_category
on public.knowledge_base(category);

-- Supports recent admin list ordering.
create index idx_knowledge_base_updated_at
on public.knowledge_base(updated_at desc);

-- Supports future tag-based filtering.
create index idx_knowledge_base_tags
on public.knowledge_base using gin(tags);

-- 6. Functions
-- Uses existing public.set_updated_at().

-- 7. Triggers
create trigger set_knowledge_base_updated_at
before update on public.knowledge_base
for each row
execute function public.set_updated_at();

-- 8. RLS enablement
alter table public.knowledge_base enable row level security;

-- 9. Policies
create policy "Students can read active knowledge base"
on public.knowledge_base
for select
to authenticated
using (is_active = true);

create policy "Admins can read all knowledge base"
on public.knowledge_base
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "Admins can insert knowledge base"
on public.knowledge_base
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  and created_by = auth.uid()
);

create policy "Admins can update knowledge base"
on public.knowledge_base
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can delete knowledge base"
on public.knowledge_base
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- 10. Comments
comment on table public.knowledge_base is
'Stores verified college FAQs, rules, notices, policies, LMS help, placement information, and helpdesk content used by the chatbot.';

comment on column public.knowledge_base.title is
'Short title for the knowledge base entry.';

comment on column public.knowledge_base.content is
'Verified college information used as chatbot context.';

comment on column public.knowledge_base.category is
'Category such as Academic, Exams, Library, LMS, Fees, Placement, or Facilities.';

comment on column public.knowledge_base.tags is
'Optional tags used for future search and filtering.';

comment on column public.knowledge_base.is_active is
'Only active rows should be used in student-facing chatbot answers.';

comment on column public.knowledge_base.created_by is
'Admin profile that created this knowledge base entry.';

-- 11. Sanity check queries
-- Keep debug SELECT queries in supabase/debug/check_knowledge_base.sql