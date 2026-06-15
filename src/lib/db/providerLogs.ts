import type {
  LLMProviderLogInsert,
  LLMProviderLogStatus,
} from "@/types/database";
import type { LLMErrorType, LLMResult } from "@/lib/llm/types";
import { createAdminClient } from "@/lib/supabase/admin";

type DbResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

function mapErrorTypeToStatus(errorType: LLMErrorType): LLMProviderLogStatus {
  if (errorType === "rate_limit") {
    return "rate_limited";
  }

  if (errorType === "timeout") {
    return "timeout";
  }

  if (errorType === "auth_error" || errorType === "missing_api_key") {
    return "auth_error";
  }

  if (errorType === "server_error") {
    return "server_error";
  }

  if (errorType === "unknown_error") {
    return "unknown_error";
  }

  return "failed";
}

function mapAttemptToLogRow(
  userId: string,
  attempt: LLMResult
): LLMProviderLogInsert {
  if (attempt.success) {
    return {
      user_id: userId,
      provider_name: attempt.providerName,
      model_name: attempt.modelName,
      status: "success",
      latency_ms: attempt.latencyMs,
      error_message: null,
    };
  }

  return {
    user_id: userId,
    provider_name: attempt.providerName,
    model_name: attempt.modelName,
    status: mapErrorTypeToStatus(attempt.errorType),
    latency_ms: attempt.latencyMs,
    error_message: attempt.errorMessage.slice(0, 500),
  };
}

export async function saveProviderAttemptLogs(
  userId: string,
  attempts: LLMResult[]
): Promise<DbResult> {
  if (attempts.length === 0) {
    return {
      ok: true,
    };
  }

  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Provider logging is not configured.",
    };
  }

  const rows = attempts.map((attempt) => mapAttemptToLogRow(userId, attempt));

  const { error } = await supabase.from("llm_provider_logs").insert(rows);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
  };
}