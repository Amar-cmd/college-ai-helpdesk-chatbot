# Schema Map

## profiles

Purpose:
Stores application profile data for Supabase Auth users.

Main columns:
- id
- email
- full_name
- role
- created_at
- updated_at

Owner column:
- id maps to auth.users.id

RLS:
Enabled.

Access:
- Users can read their own profile.
- Admins can read all profiles.
- Admins can update profiles.
- Normal users cannot directly insert or update their own role.

Related modules:
- src/lib/auth/getCurrentUser.ts
- src/lib/auth/requireRole.ts
- src/lib/supabase/server.ts
- src/lib/supabase/client.ts

## chat_sessions

Purpose:
Stores user-owned chatbot conversation sessions.

Main columns:
- id
- user_id
- title
- created_at
- updated_at

Owner column:
- user_id

RLS:
Enabled.

Access:
- Users can read their own chat sessions.
- Users can insert their own chat sessions.
- Users can update their own chat sessions.

Related tables:
- profiles
- chat_messages

Related modules:
- src/lib/db/chatSessions.ts
- src/app/chat/page.tsx
- src/app/api/chat/route.ts

## chat_messages

Purpose:
Stores messages belonging to user-owned chatbot sessions.

Main columns:
- id
- session_id
- user_id
- role
- content
- provider_used
- created_at
- updated_at

Owner column:
- user_id

RLS:
Enabled.

Access:
- Users can read their own chat messages.
- Users can insert messages into their own chat sessions.

Related tables:
- profiles
- chat_sessions

Related modules:
- src/lib/db/chatMessages.ts
- src/app/api/chat/route.ts
- src/components/chat/ChatWindow.tsx

## llm_provider_logs

Purpose:
Stores LLM provider attempt diagnostics, including success, failure, timeout, latency, and fallback behavior.

Main columns:
- id
- user_id
- provider_name
- model_name
- status
- latency_ms
- error_message
- created_at
- updated_at

Owner column:
- user_id

RLS:
Enabled.

Access:
- Admins can read provider logs.
- Normal users cannot read, insert, update, or delete provider logs.
- Server-side service role writes logs from backend code.

Related modules:
- src/lib/db/providerLogs.ts
- src/lib/llm/router.ts
- src/app/api/chat/route.ts

## knowledge_base

Purpose:
Stores verified college FAQs, rules, notices, policies, LMS help, placement information, and helpdesk content.

Main columns:
- id
- title
- content
- category
- tags
- is_active
- created_by
- created_at
- updated_at

Owner column:
- created_by

RLS:
Enabled.

Access:
- Authenticated users can read active rows.
- Admins can read all rows.
- Admins can insert rows.
- Admins can update rows.
- Admins can delete rows.

Related modules:
- src/lib/db/knowledgeBase.ts
- src/app/admin/knowledge/page.tsx
- src/app/admin/knowledge/actions.ts
- src/components/admin/KnowledgeForm.tsx
- src/components/admin/KnowledgeTable.tsx

## answer_cache

Purpose:
Stores reusable answers for normalized repeated questions to reduce repeated LLM calls.

Main columns:
- id
- normalized_question
- original_question
- answer
- source_type
- provider_used
- expires_at
- hit_count
- created_at
- updated_at

Owner column:
- None. Cache is shared and backend-managed.

RLS:
Enabled.

Access:
- Admins can read cache rows.
- Normal users cannot directly read, insert, update, or delete cache rows.
- Server-side service role checks, writes, and updates cache rows.

Related modules:
- src/lib/db/answerCache.ts
- src/lib/rag/normalizeQuestion.ts
- src/app/api/chat/route.ts