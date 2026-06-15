# College AI Helpdesk - Deployment Checklist

## 1. Local final checks

Run:

```bash
npm run build
```

Then run:

```bash
npm run dev
```

Check these routes locally:

```text
/
 /login
 /chat
 /admin/knowledge
 /admin/diagnostics
 /api/health
```

Expected:

* Homepage opens.
* Login page opens.
* Chat page opens after login.
* Admin knowledge page opens only for admin.
* Admin diagnostics page opens only for admin.
* Health API does not expose secret values.

---

## 2. Required production environment variables

Set these in Vercel Production Environment:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite
ENABLE_GEMINI=true

LLM_PROVIDER_ORDER=gemini,groq,openrouter,cloudflare
LLM_TIMEOUT_MS=15000

CACHE_TTL_HOURS=24

MAX_USER_QUESTIONS_PER_MINUTE=3
MAX_USER_QUESTIONS_PER_HOUR=20
MAX_GLOBAL_LLM_CALLS_PER_MINUTE=15
```

Optional providers:

```env
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ENABLE_GROQ=false

OPENROUTER_API_KEY=
OPENROUTER_MODEL=
OPENROUTER_SITE_URL=https://your-project.vercel.app
OPENROUTER_SITE_NAME=College AI Helpdesk
ENABLE_OPENROUTER=false

CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_MODEL=@cf/meta/llama-3.1-8b-instruct
ENABLE_CLOUDFLARE=false
```

Important:

* Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code.
* Never prefix LLM API keys with `NEXT_PUBLIC_`.
* Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` should be public.

---

## 3. Supabase Auth URL settings

After Vercel gives the production URL, update Supabase:

```text
Supabase Dashboard → Authentication → URL Configuration
```

Set Site URL:

```text
https://your-project.vercel.app
```

Add Redirect URLs:

```text
http://localhost:3000/**
https://your-project.vercel.app/**
https://*-your-vercel-team-or-account.vercel.app/**
```

Replace `your-project` and `your-vercel-team-or-account` with the actual Vercel values.

---

## 4. Vercel deployment steps

Recommended deployment flow:

1. Push final code to GitHub.
2. Import the project in Vercel.
3. Select the Next.js framework preset.
4. Add all Production environment variables.
5. Deploy.
6. Open `/api/health`.
7. If health status is ready, test login and chat.

---

## 5. Post-deployment smoke test

After deployment, check:

* Homepage opens.
* Signup works.
* Login works.
* `/chat` opens only after login.
* Chat message saves.
* Knowledge-backed question works.
* Cache works on repeated question.
* Rate limit blocks after configured limit.
* Admin can open `/admin/knowledge`.
* Admin can add knowledge base entry.
* Admin can open `/admin/diagnostics`.
* Provider logs appear after non-cached LLM calls.
* Rate-limit logs appear after rapid messages.
* No API keys are visible in browser Network tab.
* No user-facing app text appears in Hinglish or any non-English language.

---

## 6. Demo-safe wording

Use this wording during demo:

```text
This system is designed to support many logged-in users, while AI requests are managed through caching, rate limiting, and multi-provider fallback.
```

Do not claim:

* Unlimited free AI generations.
* Guaranteed 150 simultaneous LLM responses.
* No provider limits ever.
* Custom model training.
* Official answer availability without verified college data.

---

## 7. Final commit before deployment

Run:

```bash
npm run build
```

If build passes:

```bash
git add .
git commit -m "Step 15: prepare project for deployment"
```

Then push:

```bash
git push
```

---

## 8. Final production check

After deployment, open:

```text
https://your-project.vercel.app/api/health
```

Expected result:

```json
{
  "app": "College AI Helpdesk",
  "status": "ready"
}
```

If status is `not_ready`, check missing environment variables in Vercel and redeploy.
