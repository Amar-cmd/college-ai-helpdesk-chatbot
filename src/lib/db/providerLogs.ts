import type {
  LLMProviderLog,
  LLMProviderLogInsert,
  LLMProviderLogStatus,
} from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LLMErrorType, LLMResult } from "@/lib/llm/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

function mapErrorTypeToStatus(errorType: LLMErrorType): LLMProviderLogStatus {
  if (errorType === "rate_limit") return "rate_limited";
  if (errorType === "timeout") return "timeout";
  if (errorType === "auth_error" || errorType === "missing_api_key") {
    return "auth_error";
  }
  if (errorType === "server_error") return "server_error";
  if (errorType === "unknown_error") return "unknown_error";

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
): Promise<DbResult<null>> {
  if (attempts.length === 0) {
    return {
      ok: true,
      data: null,
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
    data: null,
  };
}

export async function getRecentProviderLogs(
  supabase: SupabaseClient<Database>,
  limit = 30
): Promise<DbResult<LLMProviderLog[]>> {
  const { data, error } = await supabase
    .from("llm_provider_logs")
    .select(
      "id, user_id, provider_name, model_name, status, latency_ms, error_message, created_at, updated_at"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data,
  };
}