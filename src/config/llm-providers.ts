export type LLMProviderKey = "gemini" | "groq" | "openrouter" | "cloudflare";

function isEnabled(value: string | undefined, defaultValue = false) {
  if (value === undefined) {
    return defaultValue;
  }

  return value === "true";
}

function getProviderOrder(): LLMProviderKey[] {
  const rawOrder = process.env.LLM_PROVIDER_ORDER;

  if (!rawOrder) {
    return ["gemini", "groq", "openrouter", "cloudflare"];
  }

  const validProviders = new Set<LLMProviderKey>([
    "gemini",
    "groq",
    "openrouter",
    "cloudflare",
  ]);

  return rawOrder
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is LLMProviderKey =>
      validProviders.has(item as LLMProviderKey)
    );
}

export const LLM_PROVIDER_CONFIG = {
  order: getProviderOrder(),

  gemini: {
    name: "gemini",
    enabled: isEnabled(process.env.ENABLE_GEMINI, true),
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
  },

  groq: {
    name: "groq",
    enabled: isEnabled(process.env.ENABLE_GROQ, false),
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  },

  openrouter: {
    name: "openrouter",
    enabled: isEnabled(process.env.ENABLE_OPENROUTER, false),
    model: process.env.OPENROUTER_MODEL || "",
    siteUrl: process.env.OPENROUTER_SITE_URL || "http://localhost:3000",
    siteName: process.env.OPENROUTER_SITE_NAME || "College AI Helpdesk",
  },

  cloudflare: {
    name: "cloudflare",
    enabled: isEnabled(process.env.ENABLE_CLOUDFLARE, false),
    model: process.env.CLOUDFLARE_MODEL || "@cf/meta/llama-3.1-8b-instruct",
  },
} as const;