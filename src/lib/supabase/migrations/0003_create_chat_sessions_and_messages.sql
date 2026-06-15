-- =========================================================
-- Migration: 0003_create_chat_sessions_and_messages.sql
-- Project: College AI Helpdesk Chatbot
-- Purpose:
-- Creates chat session and chat message tables for storing
-- user conversations before LLM integration.
--
-- Affected tables:
-- - public.chat_sessions
-- - public.chat_messages
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
--
-- Rollback notes:
-- Drop chat_messages first, then chat_sessions if rollback is required.
-- =========================================================

-- 1. Extensions, if needed
-- gen_random_uuid() is already available from the initial profiles migration.

-- 2. Types / enums, if needed
-- No enum is created in this MVP migration.
-- Message role is protected using a check constraint for easier future migration.

-- 3. Tables
create table public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chat_sessions_title_not_empty
    check (char_length(trim(title)) > 0),

  constraint chat_sessions_id_user_id_unique
    unique (id, user_id)
);

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  provider_used text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint chat_messages_content_not_empty
    check (char_length(trim(content)) > 0),

  constraint chat_messages_content_reasonable_length
    check (char_length(content) <= 8000),

  constraint chat_messages_session_user_fk
    foreign key (session_id, user_id)
    references public.chat_sessions(id, user_id)
    on delete cascade
);

-- 4. Constraints
-- Primary keys, foreign keys, and check constraints are defined inline above.

-- 5. Indexes
-- Supports fast lookup of sessions owned by the logged-in user.
create index idx_chat_sessions_user_id
on public.chat_sessions(user_id);

-- Supports ordering recent user sessions.
create index idx_chat_sessions_user_updated_at
on public.chat_sessions(user_id, updated_at desc);

-- Supports loading messages for one session in chronological order.
create index idx_chat_messages_session_created_at
on public.chat_messages(session_id, created_at asc);

-- Supports user-owned message checks and future user-level filtering.
create index idx_chat_messages_user_id
on public.chat_messages(user_id);

-- 6. Functions
-- Uses existing public.set_updated_at() from 0001_init_profiles.sql.

-- 7. Triggers
create trigger set_chat_sessions_updated_at
before update on public.chat_sessions
for each row
execute function public.set_updated_at();

create trigger set_chat_messages_updated_at
before update on public.chat_messages
for each row
execute function public.set_updated_at();

-- 8. RLS enablement
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- 9. Policies
create policy "Users can read their own chat sessions"
on public.chat_sessions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own chat sessions"
on public.chat_sessions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions"
on public.chat_sessions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their own chat messages"
on public.chat_messages
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert messages into their own chat sessions"
on public.chat_messages
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.chat_sessions cs
    where cs.id = chat_messages.session_id
      and cs.user_id = auth.uid()
  )
);

-- 10. Comments
comment on table public.chat_sessions is
'Stores user-owned chatbot conversation sessions.';

comment on column public.chat_sessions.id is
'Unique chat session identifier.';

comment on column public.chat_sessions.user_id is
'Owner of the chat session. References public.profiles.id.';

comment on column public.chat_sessions.title is
'Display title for the chat session.';

comment on column public.chat_sessions.created_at is
'Timestamp when the chat session was created.';

comment on column public.chat_sessions.updated_at is
'Timestamp automatically updated when the chat session changes.';

comment on table public.chat_messages is
'Stores messages belonging to user-owned chatbot sessions.';

comment on column public.chat_messages.id is
'Unique chat message identifier.';

comment on column public.chat_messages.session_id is
'Chat session that this message belongs to.';

comment on column public.chat_messages.user_id is
'Owner of the message. Must match the owner of the related chat session.';

comment on column public.chat_messages.role is
'Message role. Allowed values: user, assistant, system.';

comment on column public.chat_messages.content is
'Message text shown in the chat UI.';

comment on column public.chat_messages.provider_used is
'LLM provider used for assistant messages. For Step 3 this can be mock.';

comment on column public.chat_messages.created_at is
'Timestamp when the message was created.';

comment on column public.chat_messages.updated_at is
'Timestamp automatically updated when the message changes.';

-- 11. Sanity check queries
-- Keep actual debug SELECT queries in supabase/debug/check_chat_flow.sql