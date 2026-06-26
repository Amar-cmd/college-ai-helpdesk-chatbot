import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type HealthCheck = {
  name: string;
  status: "ok" | "missing" | "disabled" | "not_configured";
  required: boolean;
};

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function isEnabled(value: string | undefined, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

function checkEnv(name: string, required: boolean): HealthCheck {
  return {
    name,
    required,
    status: hasValue(process.env[name]) ? "ok" : "missing",
  };
}

function getProviderChecks(): HealthCheck[] {
  const geminiEnabled = isEnabled(process.env.ENABLE_GEMINI, true);
  const groqEnabled = isEnabled(process.env.ENABLE_GROQ, false);
  const openRouterEnabled = isEnabled(process.env.ENABLE_OPENROUTER, false);
  const cloudflareEnabled = isEnabled(process.env.ENABLE_CLOUDFLARE, false);

  return [
    {
      name: "Gemini provider",
      required: false,
      status: geminiEnabled
        ? hasValue(process.env.GEMINI_API_KEY)
          ? "ok"
          : "missing"
        : "disabled",
    },
    {
      name: "Groq provider",
      required: false,
      status: groqEnabled
        ? hasValue(process.env.GROQ_API_KEY)
          ? "ok"
          : "missing"
        : "disabled",
    },
    {
      name: "OpenRouter provider",
      required: false,
      status: openRouterEnabled
        ? hasValue(process.env.OPENROUTER_API_KEY) &&
          hasValue(process.env.OPENROUTER_MODEL)
          ? "ok"
          : "missing"
        : "disabled",
    },
    {
      name: "Cloudflare provider",
      required: false,
      status: cloudflareEnabled
        ? hasValue(process.env.CLOUDFLARE_ACCOUNT_ID) &&
          hasValue(process.env.CLOUDFLARE_API_TOKEN)
          ? "ok"
          : "missing"
        : "disabled",
    },
  ];
}

function getWebSearchCheck(): HealthCheck {
  const webSearchEnabled = isEnabled(
    process.env.ENABLE_WEB_SEARCH_FALLBACK,
    hasValue(process.env.BRAVE_SEARCH_API_KEY)
  );

  return {
    name: "Web search fallback",
    required: false,
    status: webSearchEnabled
      ? hasValue(process.env.BRAVE_SEARCH_API_KEY)
        ? "ok"
        : "missing"
      : "disabled",
  };
}

export async function GET() {
  const checks: HealthCheck[] = [
    checkEnv("NEXT_PUBLIC_SUPABASE_URL", true),
    checkEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", true),
    checkEnv("SUPABASE_SERVICE_ROLE_KEY", true),
    checkEnv("LLM_PROVIDER_ORDER", false),
    checkEnv("LLM_TIMEOUT_MS", false),
    checkEnv("CACHE_TTL_HOURS", false),
    checkEnv("MAX_USER_QUESTIONS_PER_MINUTE", false),
    checkEnv("MAX_USER_QUESTIONS_PER_HOUR", false),
    checkEnv("MAX_GLOBAL_LLM_CALLS_PER_MINUTE", false),
    ...getProviderChecks(),
    getWebSearchCheck(),
  ];

  const requiredMissing = checks.some(
    (check) => check.required && check.status !== "ok"
  );

  const providerReady = checks.some(
    (check) =>
      [
        "Gemini provider",
        "Groq provider",
        "OpenRouter provider",
        "Cloudflare provider",
      ].includes(check.name) && check.status === "ok"
  );

  const status = requiredMissing || !providerReady ? "not_ready" : "ready";

  return NextResponse.json(
    {
      app: "AI Buddy",
      status,
      checks,
      note: "This health endpoint reports configuration status only. It does not expose secret values.",
    },
    {
      status: status === "ready" ? 200 : 503,
    }
  );
}