// import { getMaxGlobalLlmCallsPerMinute } from "@/config/limits";
// import {
//   countRateLimitEvents,
//   saveRateLimitEvent,
// } from "@/lib/db/rateLimitLogs";

// type RateLimitResult =
//   | {
//       allowed: true;
//     }
//   | {
//       allowed: false;
//       message: string;
//       retryAfterSeconds: number;
//     };

// const ONE_MINUTE_MS = 60 * 1000;

// export const GLOBAL_LLM_RATE_LIMIT_MESSAGE =
//   "AI system is currently busy due to high traffic. Please try again shortly.";

// async function logGlobalRateLimitEvent({
//   userId,
//   eventType,
//   reason,
// }: {
//   userId: string;
//   eventType: "allowed" | "blocked";
//   reason: string;
// }) {
//   const result = await saveRateLimitEvent({
//     userId,
//     scope: "global_llm",
//     eventType,
//     reason,
//   });

//   if (!result.ok) {
//     console.warn("Global LLM rate-limit log failed:", result.error);
//   }
// }

// export async function checkGlobalLlmRateLimit(
//   userId: string
// ): Promise<RateLimitResult> {
//   const windowStart = new Date(Date.now() - ONE_MINUTE_MS);

//   const countResult = await countRateLimitEvents({
//     scope: "global_llm",
//     eventType: "allowed",
//     since: windowStart,
//   });

//   if (!countResult.ok) {
//     console.warn("Global LLM rate-limit check failed:", countResult.error);

//     return {
//       allowed: true,
//     };
//   }

//   if (countResult.data >= getMaxGlobalLlmCallsPerMinute()) {
//     await logGlobalRateLimitEvent({
//       userId,
//       eventType: "blocked",
//       reason: "global_llm_minute_limit_exceeded",
//     });

//     return {
//       allowed: false,
//       message: GLOBAL_LLM_RATE_LIMIT_MESSAGE,
//       retryAfterSeconds: 60,
//     };
//   }

//   await logGlobalRateLimitEvent({
//     userId,
//     eventType: "allowed",
//     reason: "global_llm_allowed",
//   });

//   return {
//     allowed: true,
//   };
// }

import { getMaxGlobalLlmCallsPerMinute } from "@/config/limits";
import {
  countRateLimitEvents,
  saveRateLimitEvent,
} from "@/lib/db/rateLimitLogs";

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

export const GLOBAL_LLM_RATE_LIMIT_MESSAGE =
  "AI system is currently busy due to high traffic. Please try again shortly.";

async function logGlobalRateLimitEvent({
  userId,
  eventType,
  reason,
}: {
  userId: string | null;
  eventType: "allowed" | "blocked";
  reason: string;
}) {
  const result = await saveRateLimitEvent({
    userId,
    scope: "global_llm",
    eventType,
    reason,
  });

  if (!result.ok) {
    console.warn("Global LLM rate-limit log failed:", result.error);
  }
}

export async function checkGlobalLlmRateLimit(
  userId: string | null
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - ONE_MINUTE_MS);

  const countResult = await countRateLimitEvents({
    scope: "global_llm",
    eventType: "allowed",
    since: windowStart,
  });

  if (!countResult.ok) {
    console.warn("Global LLM rate-limit check failed:", countResult.error);

    return {
      allowed: true,
    };
  }

  if (countResult.data >= getMaxGlobalLlmCallsPerMinute()) {
    await logGlobalRateLimitEvent({
      userId,
      eventType: "blocked",
      reason: "global_llm_minute_limit_exceeded",
    });

    return {
      allowed: false,
      message: GLOBAL_LLM_RATE_LIMIT_MESSAGE,
      retryAfterSeconds: 60,
    };
  }

  await logGlobalRateLimitEvent({
    userId,
    eventType: "allowed",
    reason: "global_llm_allowed",
  });

  return {
    allowed: true,
  };
}