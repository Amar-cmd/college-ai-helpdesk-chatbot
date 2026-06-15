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