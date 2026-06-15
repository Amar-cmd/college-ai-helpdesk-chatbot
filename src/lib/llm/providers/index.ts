import { LLM_PROVIDER_CONFIG, type LLMProviderKey } from "@/config/llm-providers";
import type { LLMProvider } from "@/lib/llm/types";
import { cloudflareProvider } from "./cloudflare";
import { geminiProvider } from "./gemini";
import { groqProvider } from "./groq";
import { openRouterProvider } from "./openrouter";

const PROVIDER_MAP: Record<LLMProviderKey, LLMProvider> = {
  gemini: geminiProvider,
  groq: groqProvider,
  openrouter: openRouterProvider,
  cloudflare: cloudflareProvider,
};

export function getConfiguredProviders() {
  return LLM_PROVIDER_CONFIG.order
    .map((providerKey) => PROVIDER_MAP[providerKey])
    .filter(Boolean);
}