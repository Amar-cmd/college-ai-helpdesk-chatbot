# Table Purpose

## profiles

The `profiles` table stores role information for authenticated users.

It is required because Supabase Auth stores login identity, but the application needs its own role system:
- student
- admin

This role is used to protect admin-only routes and later knowledge-base management features.

## chat_sessions

The `chat_sessions` table stores one conversation container per user chat.

It is required so users can later have multiple conversations and so messages can be grouped correctly.

## chat_messages

The `chat_messages` table stores user and assistant messages inside a chat session.

It is required for chat history, refresh persistence, future LLM responses, future provider tracking, and future feedback features.