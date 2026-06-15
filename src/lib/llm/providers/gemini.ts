import { getLlmTimeoutMs } from "@/config/limits";
import { LLM_PROVIDER_CONFIG } from "@/config/llm-providers";
import type {
  LLMErrorType,
  LLMGenerateInput,
  LLMProvider,
  LLMResult,
} from "@/lib/llm/types";
import { sanitizeAssistantOutput } from "@/lib/safety/sanitizeOutput";

type GeminiGenerateContentResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

function getGeminiErrorType(statusCode: number): LLMErrorType {
  if (statusCode === 401 || statusCode === 403) {
    return "auth_error";
  }

  if (statusCode === 429) {
    return "rate_limit";
  }

  if (statusCode >= 500) {
    return "server_error";
  }

  return "unknown_error";
}

function extractGeminiText(response: GeminiGenerateContentResponse) {
  return (
    response.candidates
      ?.flatMap((candidate) => candidate.content?.parts ?? [])
      .map((part) => part.text ?? "")
      .join("")
      .trim() ?? ""
  );
}

export async function generateWithGemini({
  prompt,
}: LLMGenerateInput): Promise<LLMResult> {
  const providerName = LLM_PROVIDER_CONFIG.gemini.name;
  const modelName = LLM_PROVIDER_CONFIG.gemini.model;
  const startedAt = Date.now();

  if (!LLM_PROVIDER_CONFIG.gemini.enabled) {
    return {
      success: false,
      errorType: "disabled",
      errorMessage: "Gemini provider is disabled.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      errorType: "missing_api_key",
      errorMessage: "Missing GEMINI_API_KEY.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, getLlmTimeoutMs());

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topP: 0.9,
            maxOutputTokens: 700,
          },
        }),
        signal: controller.signal,
      }
    );

    const responseBody =
      (await response.json()) as GeminiGenerateContentResponse;

    if (!response.ok) {
      return {
        success: false,
        errorType: getGeminiErrorType(response.status),
        errorMessage: responseBody.error?.message || "Gemini request failed.",
        providerName,
        modelName,
        latencyMs: Date.now() - startedAt,
      };
    }

    const text = sanitizeAssistantOutput(extractGeminiText(responseBody));

    return {
      success: true,
      text,
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === "AbortError";

    return {
      success: false,
      errorType: isTimeout ? "timeout" : "unknown_error",
      errorMessage: isTimeout
        ? "Gemini request timed out."
        : "Gemini request failed unexpectedly.",
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export const geminiProvider: LLMProvider = {
  name: LLM_PROVIDER_CONFIG.gemini.name,
  modelName: LLM_PROVIDER_CONFIG.gemini.model,
  enabled: LLM_PROVIDER_CONFIG.gemini.enabled,
  generate: generateWithGemini,
};