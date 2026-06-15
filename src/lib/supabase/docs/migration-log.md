# Migration Log

## 0001_init_profiles.sql

Date:
2026-06-15

Feature:
Auth and roles foundation.

Reason:
The app needs student/admin roles before chat, admin knowledge base, and RLS-protected data can be built.

Tables affected:
- public.profiles

RLS changed:
Yes. RLS enabled on profiles.

Indexes added:
No extra indexes.

Destructive:
No.

Sanity checks:
- Check profiles table exists.
- Check RLS is enabled.
- Check policies exist.
- Create a test user from the app and confirm profile row is created.

Rollback notes:
Drop trigger on auth.users first, then drop functions, then drop public.profiles if no dependent tables exist.

## 0002_fix_profiles_admin_policy_recursion.sql

Date:
2026-06-15

Feature:
Auth/profile RLS fix.

Reason:
The earlier admin policies checked admin role by querying profiles from inside profiles policies. This can cause recursive RLS evaluation and break profile reads after login.

Tables affected:
- public.profiles

RLS changed:
Yes. Admin read/update policies were recreated using public.is_admin(auth.uid()).

Indexes added:
None.

Destructive:
No.

Sanity checks:
- Login as a student.
- Open /chat.
- Confirm the user does not get redirected back to /login.
- Login as admin.
- Open /admin/knowledge.

Rollback notes:
Drop recreated admin policies and public.is_admin(uuid) if rollback is required.

## 0003_create_chat_sessions_and_messages.sql

Date:
2026-06-15

Feature:
Chat persistence.

Reason:
The app needs persistent chat sessions and messages before adding LLM provider integration.

Tables affected:
- public.chat_sessions
- public.chat_messages

RLS changed:
Yes. RLS enabled on both chat tables.

Indexes added:
- idx_chat_sessions_user_id
- idx_chat_sessions_user_updated_at
- idx_chat_messages_session_created_at
- idx_chat_messages_user_id

Destructive:
No.

Sanity checks:
- Logged-in user can create a chat session.
- Logged-in user can save user and assistant messages.
- Page refresh shows saved messages.
- User cannot access another user's chat data.

Rollback notes:
Drop public.chat_messages first, then public.chat_sessions.

## 0004_create_llm_provider_logs.sql

Date:
2026-06-15

Feature:
Provider logging for multi-provider fallback.

Reason:
The app needs basic observability before adding more providers. Provider logs help debug fallback, timeout, rate limit, and authentication failures.

Tables affected:
- public.llm_provider_logs

RLS changed:
Yes. RLS enabled on provider logs.

Indexes added:
- idx_llm_provider_logs_created_at
- idx_llm_provider_logs_user_id
- idx_llm_provider_logs_provider_name

Destructive:
No.

Sanity checks:
- Send a chat message.
- Confirm one or more provider attempts are logged.
- Confirm admin can read provider logs.
- Confirm normal users cannot directly read provider logs.

Rollback notes:
Drop public.llm_provider_logs if rollback is required.

## 0005_create_knowledge_base.sql

Date:
2026-06-15

Feature:
Admin-managed knowledge base.

Reason:
The chatbot needs verified college content before RAG retrieval can be added.

Tables affected:
- public.knowledge_base

RLS changed:
Yes. RLS enabled on knowledge_base.

Indexes added:
- idx_knowledge_base_is_active
- idx_knowledge_base_category
- idx_knowledge_base_updated_at
- idx_knowledge_base_tags

Destructive:
No.

Sanity checks:
- Admin can add a knowledge base entry.
- Admin can edit a knowledge base entry.
- Admin can activate/deactivate a knowledge base entry.
- Authenticated users can read only active rows.
- Inactive rows are not exposed to normal student reads.

Rollback notes:
Drop public.knowledge_base if rollback is required.

## 0006_create_answer_cache.sql

Date:
2026-06-15

Feature:
Answer cache.

Reason:
Repeated questions should reuse a cached answer instead of calling RAG and LLM every time.

Tables affected:
- public.answer_cache

RLS changed:
Yes. RLS enabled on answer_cache.

Indexes added:
- idx_answer_cache_normalized_question
- idx_answer_cache_expires_at
- idx_answer_cache_source_type

Destructive:
No.

Sanity checks:
- First repeated FAQ question creates a cache row.
- Second same question returns provider_used = cache in chat_messages.
- hit_count increases on cache hit.
- Expired cache rows are not used.
- Chat still works if service role key is missing.

Rollback notes:
Drop public.answer_cache if rollback is required.