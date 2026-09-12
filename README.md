# AI Buddy — AI-Powered College Assistance Chatbot

A full-stack college helpdesk assistant for centralized, knowledge-backed responses with an admin-managed knowledge base and operational diagnostics.

**Live app:** https://college-ai-helpdesk-chatbot.vercel.app

## Product capabilities

- Authenticated chat experience
- Admin-managed knowledge base
- Cached answers for repeated questions
- Rate limiting and controlled fallback responses
- Multi-provider LLM routing across Gemini, Groq, OpenRouter and Cloudflare AI
- Optional Brave Search fallback when configured
- Admin diagnostics for provider success, failure, timeout, latency and fallback behavior

## How the response flow works

1. Receive and validate a question.
2. Reuse available cached or knowledge-backed context where possible.
3. Call the configured AI provider when generation is needed.
4. Fall back to other configured providers when required.
5. Record provider-attempt diagnostics for review.
6. Return a controlled fallback if no provider path succeeds.

## Tech stack

- Next.js
- TypeScript
- Supabase / PostgreSQL
- Gemini, Groq, OpenRouter and Cloudflare AI integrations
- Vercel

## Main application areas

- Student chat
- Admin knowledge management
- Admin diagnostics
- Health endpoint

## Run locally

```bash
npm install
npm run dev
```

Configure the required local environment variables before starting. See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guidance.

## Why this project matters

This repository focuses on the product and reliability layer around an AI assistant, not only the chat interface: authentication, governed knowledge, caching, provider fallback, rate limiting and diagnostics are all part of the implementation.
