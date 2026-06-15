import { LLM_PROVIDER_CONFIG } from "@/config/llm-providers";
import type {
  LLMGenerateInput,
  LLMProvider,
  LLMResult,
} from "@/lib/llm/types";
import { generateOpenAICompatibleChat } from "@/lib/llm/openaiCompatible";

export async function generateWithOpenRouter({
  prompt,
}: LLMGenerateInput): Promise<LLMResult> {
  const providerName = LLM_PROVIDER_CONFIG.openrouter.name;
  const modelName = LLM_PROVIDER_CONFIG.openrouter.model;
  const startedAt = Date.now();

  if (!LLM_PROVIDER_CONFIG.openrouter.enabled) {
    return {
      success: false,
      errorType: "disabled",
      errorMessage: "OpenRouter provider is disabled.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  if (!modelName) {
    return {
      success: false,
      errorType: "missing_model",
      errorMessage: "Missing OPENROUTER_MODEL.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  return generateOpenAICompatibleChat({
    providerName,
    modelName,
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    apiKey: process.env.OPENROUTER_API_KEY,
    prompt,
    extraHeaders: {
      "HTTP-Referer": LLM_PROVIDER_CONFIG.openrouter.siteUrl,
      "X-OpenRouter-Title": LLM_PROVIDER_CONFIG.openrouter.siteName,
    },
  });
}

export const openRouterProvider: LLMProvider = {
  name: LLM_PROVIDER_CONFIG.openrouter.name,
  modelName: LLM_PROVIDER_CONFIG.openrouter.model,
  enabled: LLM_PROVIDER_CONFIG.openrouter.enabled,
  generate: generateWithOpenRouter,
};