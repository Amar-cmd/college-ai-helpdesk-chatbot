import { createAdminClient } from "@/lib/supabase/admin";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  RateLimitEventType,
  RateLimitLog,
  RateLimitLogInsert,
  RateLimitScope,
} from "@/types/database";

type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

type CountRateLimitEventsInput = {
  userId?: string;
  scope: RateLimitScope;
  eventType: RateLimitEventType;
  since: Date;
};

type SaveRateLimitEventInput = {
  userId?: string | null;
  scope: RateLimitScope;
  eventType: RateLimitEventType;
  reason: string;
};

export async function countRateLimitEvents({
  userId,
  scope,
  eventType,
  since,
}: CountRateLimitEventsInput): Promise<DbResult<number>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Rate limit logging is not configured.",
    };
  }

  let query = supabase
    .from("rate_limit_logs")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("scope", scope)
    .eq("event_type", eventType)
    .gte("created_at", since.toISOString());

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { count, error } = await query;

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data: count ?? 0,
  };
}

export async function saveRateLimitEvent({
  userId = null,
  scope,
  eventType,
  reason,
}: SaveRateLimitEventInput): Promise<DbResult<null>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Rate limit logging is not configured.",
    };
  }

  const row: RateLimitLogInsert = {
    user_id: userId,
    scope,
    event_type: eventType,
    reason,
  };

  const { error } = await supabase.from("rate_limit_logs").insert(row);

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

export async function getRecentRateLimitLogs(
  supabase: SupabaseClient<Database>,
  limit = 30
): Promise<DbResult<RateLimitLog[]>> {
  const { data, error } = await supabase
    .from("rate_limit_logs")
    .select("id, user_id, scope, event_type, reason, created_at, updated_at")
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