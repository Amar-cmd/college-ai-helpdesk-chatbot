import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getMaxUserQuestionsPerHour,
  getMaxUserQuestionsPerMinute,
} from "@/config/limits";
import { countSessionUserMessagesSince } from "@/lib/db/chatMessages";
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

const GUEST_RATE_LIMIT_MESSAGE =
  "You have sent too many messages in a short time. Please wait 30 to 60 seconds and try again.";

async function logGuestRateLimitEvent({
  guestUserId,
  eventType,
  reason,
}: {
  guestUserId: string;
  eventType: "allowed" | "blocked";
  reason: string;
}) {
  const result = await saveRateLimitEvent({
    userId: guestUserId,
    scope: "user_message",
    eventType,
    reason,
  });

  if (!result.ok) {
    console.warn("Guest rate-limit log failed:", result.error);
  }
}

export async function checkGuestRateLimit(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  guestUserId: string
): Promise<RateLimitResult> {
  const minuteWindowStart = new Date(Date.now() - ONE_MINUTE_MS);
  const hourWindowStart = new Date(Date.now() - ONE_HOUR_MS);

  const minuteCountResult = await countSessionUserMessagesSince(
    supabase,
    sessionId,
    guestUserId,
    minuteWindowStart
  );

  if (!minuteCountResult.ok) {
    console.warn(
      "Guest minute rate-limit check failed:",
      minuteCountResult.error
    );

    return {
      allowed: true,
    };
  }

  if (minuteCountResult.data >= getMaxUserQuestionsPerMinute()) {
    await logGuestRateLimitEvent({
      guestUserId,
      eventType: "blocked",
      reason: "guest_session_minute_limit_exceeded",
    });

    return {
      allowed: false,
      message: GUEST_RATE_LIMIT_MESSAGE,
      retryAfterSeconds: 60,
    };
  }

  const hourCountResult = await countSessionUserMessagesSince(
    supabase,
    sessionId,
    guestUserId,
    hourWindowStart
  );

  if (!hourCountResult.ok) {
    console.warn("Guest hour rate-limit check failed:", hourCountResult.error);

    return {
      allowed: true,
    };
  }

  if (hourCountResult.data >= getMaxUserQuestionsPerHour()) {
    await logGuestRateLimitEvent({
      guestUserId,
      eventType: "blocked",
      reason: "guest_session_hour_limit_exceeded",
    });

    return {
      allowed: false,
      message: "You have reached the hourly message limit. Please try again later.",
      retryAfterSeconds: 3600,
    };
  }

  await logGuestRateLimitEvent({
    guestUserId,
    eventType: "allowed",
    reason: "guest_session_message_allowed",
  });

  return {
    allowed: true,
  };
}