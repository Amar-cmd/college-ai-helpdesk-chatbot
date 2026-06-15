import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMaxUserQuestionsPerHour,
  getMaxUserQuestionsPerMinute,
} from "@/config/limits";
import { countUserMessagesSince } from "@/lib/db/chatMessages";
import { saveRateLimitEvent } from "@/lib/db/rateLimitLogs";
import type { Database } from "@/types/database";

type RateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      message: string;
      retryAfterSeconds: number;
    };

const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

const USER_RATE_LIMIT_MESSAGE =
  "You have sent too many messages in a short time. Please wait 30 to 60 seconds and try again.";

async function logUserRateLimitEvent({
  userId,
  eventType,
  reason,
}: {
  userId: string;
  eventType: "allowed" | "blocked";
  reason: string;
}) {
  const result = await saveRateLimitEvent({
    userId,
    scope: "user_message",
    eventType,
    reason,
  });

  if (!result.ok) {
    console.warn("User rate-limit log failed:", result.error);
  }
}

export async function checkUserRateLimit(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RateLimitResult> {
  const minuteWindowStart = new Date(Date.now() - ONE_MINUTE_MS);
  const hourWindowStart = new Date(Date.now() - ONE_HOUR_MS);

  const minuteCountResult = await countUserMessagesSince(
    supabase,
    userId,
    minuteWindowStart,
  );

  if (!minuteCountResult.ok) {
    console.warn(
      "User minute rate-limit check failed:",
      minuteCountResult.error,
    );

    return {
      allowed: true,
    };
  }

  if (minuteCountResult.data >= getMaxUserQuestionsPerMinute()) {
    await logUserRateLimitEvent({
      userId,
      eventType: "blocked",
      reason: "user_message_minute_limit_exceeded",
    });

    return {
      allowed: false,
      message: USER_RATE_LIMIT_MESSAGE,
      retryAfterSeconds: 60,
    };
  }

  const hourCountResult = await countUserMessagesSince(
    supabase,
    userId,
    hourWindowStart,
  );

  if (!hourCountResult.ok) {
    console.warn("User hour rate-limit check failed:", hourCountResult.error);

    return {
      allowed: true,
    };
  }

  if (hourCountResult.data >= getMaxUserQuestionsPerHour()) {
    await logUserRateLimitEvent({
      userId,
      eventType: "blocked",
      reason: "user_message_hour_limit_exceeded",
    });

    return {
      allowed: false,
      message:
        "You have reached the hourly message limit. Please try again later.",
      retryAfterSeconds: 3600,
    };
  }

  await logUserRateLimitEvent({
    userId,
    eventType: "allowed",
    reason: "user_message_allowed",
  });

  return {
    allowed: true,
  };
}
