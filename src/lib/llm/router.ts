import { STATIC_FALLBACK_ANSWER } from "@/lib/llm/fallback";
import { getConfiguredProviders } from "@/lib/llm/providers";
import type {
  LLMGenerateInput,
  LLMProvider,
  LLMResult,
  LLMRouterResult,
} from "@/lib/llm/types";

function createUnexpectedProviderFailure(
  provider: LLMProvider,
  latencyMs: number
): LLMResult {
  return {
    success: false,
    errorType: "unknown_error",
    errorMessage: `${provider.name} failed unexpectedly.`,
    providerName: provider.name,
    modelName: provider.modelName,
    latencyMs,
  };
}

export async function generateWithRouter(
  input: LLMGenerateInput
): Promise<LLMRouterResult> {
  const routerStartedAt = Date.now();
  const attempts: LLMResult[] = [];
  const providers = getConfiguredProviders();

  for (const provider of providers) {
    if (!provider.enabled) {
      continue;
    }

    const providerStartedAt = Date.now();

    try {
      const result = await provider.generate(input);
      attempts.push(result);

      if (result.success) {
        return {
          success: true,
          text: result.text,
          providerUsed: result.providerName,
          modelUsed: result.modelName,
          latencyMs: Date.now() - routerStartedAt,
          attempts,
        };
      }
    } catch {
      attempts.push(
        createUnexpectedProviderFailure(
          provider,
          Date.now() - providerStartedAt
        )
      );
    }
  }

  return {
    success: false,
    text: STATIC_FALLBACK_ANSWER,
    providerUsed: "fallback",
    modelUsed: null,
    latencyMs: Date.now() - routerStartedAt,
    attempts,
  };
}