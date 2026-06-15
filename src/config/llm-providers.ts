export const LLM_PROVIDER_CONFIG = {
  gemini: {
    name: "gemini",
    enabled: process.env.ENABLE_GEMINI !== "false",
    model: process.env.GEMINI_MODEL || "gemini-3.1-flash-lite",
  },
} as const;