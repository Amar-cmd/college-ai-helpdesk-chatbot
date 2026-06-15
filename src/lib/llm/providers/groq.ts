import { LLM_PROVIDER_CONFIG } from "@/config/llm-providers";
import type {
  LLMGenerateInput,
  LLMProvider,
  LLMResult,
} from "@/lib/llm/types";
import { generateOpenAICompatibleChat } from "@/lib/llm/openaiCompatible";

export async function generateWithGroq({
  prompt,
}: LLMGenerateInput): Promise<LLMResult> {
  const providerName = LLM_PROVIDER_CONFIG.groq.name;
  const modelName = LLM_PROVIDER_CONFIG.groq.model;
  const startedAt = Date.now();

  if (!LLM_PROVIDER_CONFIG.groq.enabled) {
    return {
      success: false,
      errorType: "disabled",
      errorMessage: "Groq provider is disabled.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  return generateOpenAICompatibleChat({
    providerName,
    modelName,
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    apiKey: process.env.GROQ_API_KEY,
    prompt,
  });
}

export const groqProvider: LLMProvider = {
  name: LLM_PROVIDER_CONFIG.groq.name,
  modelName: LLM_PROVIDER_CONFIG.groq.model,
  enabled: LLM_PROVIDER_CONFIG.groq.enabled,
  generate: generateWithGroq,
};