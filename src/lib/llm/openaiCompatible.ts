import { getLlmTimeoutMs } from "@/config/limits";
import type { LLMErrorType, LLMResult } from "@/lib/llm/types";
import { sanitizeAssistantOutput } from "@/lib/safety/sanitizeOutput";

type OpenAICompatibleChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
};

type GenerateOpenAICompatibleInput = {
  providerName: string;
  modelName: string;
  endpoint: string;
  apiKey: string | null | undefined;
  prompt: string;
  extraHeaders?: Record<string, string>;
};

export function getProviderErrorType(statusCode: number): LLMErrorType {
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

function extractAssistantText(response: OpenAICompatibleChatResponse) {
  return (
    response.choices
      ?.map((choice) => choice.message?.content ?? "")
      .join("")
      .trim() ?? ""
  );
}

export async function generateOpenAICompatibleChat({
  providerName,
  modelName,
  endpoint,
  apiKey,
  prompt,
  extraHeaders = {},
}: GenerateOpenAICompatibleInput): Promise<LLMResult> {
  const startedAt = Date.now();

  if (!apiKey) {
    return {
      success: false,
      errorType: "missing_api_key",
      errorMessage: `Missing API key for ${providerName}.`,
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  }

  if (!modelName) {
    return {
      success: false,
      errorType: "missing_model",
      errorMessage: `Missing model name for ${providerName}.`,
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
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 700,
      }),
      signal: controller.signal,
    });

    const responseBody =
      (await response.json()) as OpenAICompatibleChatResponse;

    if (!response.ok) {
      return {
        success: false,
        errorType: getProviderErrorType(response.status),
        errorMessage:
          responseBody.error?.message || `${providerName} request failed.`,
        providerName,
        modelName,
        latencyMs: Date.now() - startedAt,
      };
    }

    return {
      success: true,
      text: sanitizeAssistantOutput(extractAssistantText(responseBody)),
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
        ? `${providerName} request timed out.`
        : `${providerName} request failed unexpectedly.`,
      providerName,
      modelName,
      latencyMs: Date.now() - startedAt,
    };
  } finally {
    clearTimeout(timeout);
  }
}