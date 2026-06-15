import { LLM_PROVIDER_CONFIG } from "@/config/llm-providers";
import type {
  LLMGenerateInput,
  LLMProvider,
  LLMResult,
} from "@/lib/llm/types";
import { generateOpenAICompatibleChat } from "@/lib/llm/openaiCompatible";

export async function generateWithCloudflare({
  prompt,
}: LLMGenerateInput): Promise<LLMResult> {
  const providerName = LLM_PROVIDER_CONFIG.cloudflare.name;
  const modelName = LLM_PROVIDER_CONFIG.cloudflare.model;
  const startedAt = Date.now();

  if (!LLM_PROVIDER_CONFIG.cloudflare.enabled) {
    return {
      success: false,
      errorType: "disabled",
      errorMessage: "Cloudflare provider is disabled.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !apiToken) {
    return {
      success: false,
      errorType: "missing_api_key",
      errorMessage:
        "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  return generateOpenAICompatibleChat({
    providerName,
    modelName,
    endpoint: `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`,
    apiKey: apiToken,
    prompt,
  });
}

export const cloudflareProvider: LLMProvider = {
  name: LLM_PROVIDER_CONFIG.cloudflare.name,
  modelName: LLM_PROVIDER_CONFIG.cloudflare.model,
  enabled: LLM_PROVIDER_CONFIG.cloudflare.enabled,
  generate: generateWithCloudflare,
};