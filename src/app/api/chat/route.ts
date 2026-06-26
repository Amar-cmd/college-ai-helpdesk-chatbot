// import { NextResponse } from "next/server";
// import {
//   getCachedAnswerForQuestion,
//   saveAnswerCache,
// } from "@/lib/db/answerCache";
// import { getOwnedChatSessionById } from "@/lib/db/chatSessions";
// import { saveChatMessage } from "@/lib/db/chatMessages";
// import { saveProviderAttemptLogs } from "@/lib/db/providerLogs";
// import {
//   buildCollegeHelpdeskPrompt,
//   buildGeneralAiFallbackPrompt,
//   buildWebSearchHelpdeskPrompt,
// } from "@/lib/llm/prompt";
// import { generateWithRouter } from "@/lib/llm/router";
// import { retrieveKnowledgeForQuestion } from "@/lib/rag/retrieveKnowledge";
// import { checkGlobalLlmRateLimit } from "@/lib/rate-limit/globalRateLimit";
// import { checkUserRateLimit } from "@/lib/rate-limit/userRateLimit";
// import { validateChatMessageInput } from "@/lib/safety/validateInput";
// import { createClient } from "@/lib/supabase/server";
// import { retrieveWebSearchForQuestion } from "@/lib/web-search/retrieveWebSearch";
// import type { AnswerSourceType } from "@/types/database";

// const CHAT_ERROR_MESSAGES = {
//   loginRequired: "You must be logged in to send a message.",
//   invalidRequestBody: "Invalid request body.",
//   sessionRequired: "Chat session is required.",
//   userMessageSaveFailed: "Your message could not be saved. Please try again.",
//   assistantMessageSaveFailed:
//     "The assistant response could not be saved. Please try again.",
//   unexpected:
//     "Chat is temporarily unavailable. Please refresh the page or try again shortly.",
// };

// type AnswerContextSource = "knowledge" | "web_search" | "ai_fallback";

// function errorResponse(
//   message: string,
//   status: number,
//   extra?: Record<string, unknown>
// ) {
//   return NextResponse.json(
//     {
//       error: message,
//       ...extra,
//     },
//     {
//       status,
//     }
//   );
// }

// async function handleChatRequest(request: Request) {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     return errorResponse(CHAT_ERROR_MESSAGES.loginRequired, 401);
//   }

//   let body: unknown;

//   try {
//     body = await request.json();
//   } catch {
//     return errorResponse(CHAT_ERROR_MESSAGES.invalidRequestBody, 400);
//   }

//   const parsedBody = body as {
//     message?: unknown;
//     sessionId?: unknown;
//   };

//   const validatedMessage = validateChatMessageInput(parsedBody.message);

//   if (!validatedMessage.ok) {
//     return errorResponse(validatedMessage.error, 400);
//   }

//   if (
//     typeof parsedBody.sessionId !== "string" ||
//     !parsedBody.sessionId.trim()
//   ) {
//     return errorResponse(CHAT_ERROR_MESSAGES.sessionRequired, 400);
//   }

//   const sessionResult = await getOwnedChatSessionById(
//     supabase,
//     user.id,
//     parsedBody.sessionId
//   );

//   if (!sessionResult.ok) {
//     return errorResponse(sessionResult.error, 404);
//   }

//   const userRateLimitResult = await checkUserRateLimit(supabase, user.id);

//   if (!userRateLimitResult.allowed) {
//     return errorResponse(userRateLimitResult.message, 429, {
//       retryAfterSeconds: userRateLimitResult.retryAfterSeconds,
//     });
//   }

//   const cachedAnswerResult = await getCachedAnswerForQuestion(
//     validatedMessage.value
//   );

//   if (!cachedAnswerResult.ok) {
//     console.warn("Answer cache lookup failed:", cachedAnswerResult.error);
//   }

//   if (cachedAnswerResult.ok && cachedAnswerResult.data) {
//     const userMessageResult = await saveChatMessage(supabase, {
//       session_id: sessionResult.data.id,
//       user_id: user.id,
//       role: "user",
//       content: validatedMessage.value,
//       provider_used: null,
//     });

//     if (!userMessageResult.ok) {
//       return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
//     }

//     const assistantMessageResult = await saveChatMessage(supabase, {
//       session_id: sessionResult.data.id,
//       user_id: user.id,
//       role: "assistant",
//       content: cachedAnswerResult.data.answer,
//       provider_used: "cache",
//     });

//     if (!assistantMessageResult.ok) {
//       return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
//     }

//     return NextResponse.json({
//       sessionId: sessionResult.data.id,
//       userMessage: userMessageResult.data,
//       assistantMessage: assistantMessageResult.data,
//       provider: "cache",
//       cached: true,
//       contextSource: "cache",
//     });
//   }

//   const userMessageResult = await saveChatMessage(supabase, {
//     session_id: sessionResult.data.id,
//     user_id: user.id,
//     role: "user",
//     content: validatedMessage.value,
//     provider_used: null,
//   });

//   if (!userMessageResult.ok) {
//     return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
//   }

//   const knowledgeResult = await retrieveKnowledgeForQuestion(
//     supabase,
//     validatedMessage.value
//   );

//   if (!knowledgeResult.ok) {
//     console.warn("Knowledge retrieval failed:", knowledgeResult.error);
//   }

//   const collegeContext = knowledgeResult.ok ? knowledgeResult.context : "";
//   const hasVerifiedKnowledgeContext = collegeContext.trim().length > 0;

//   let answerContext = collegeContext;
//   let answerContextSource: AnswerContextSource = hasVerifiedKnowledgeContext
//     ? "knowledge"
//     : "ai_fallback";

//   if (!hasVerifiedKnowledgeContext) {
//     const webSearchResult = await retrieveWebSearchForQuestion(
//       validatedMessage.value
//     );

//     if (webSearchResult.ok) {
//       answerContext = webSearchResult.context;
//       answerContextSource = "web_search";
//     } else {
//       console.warn("Web search fallback unavailable:", webSearchResult.error);
//       answerContext = "";
//       answerContextSource = "ai_fallback";
//     }
//   }

//   const globalLlmRateLimitResult = await checkGlobalLlmRateLimit(user.id);

//   if (!globalLlmRateLimitResult.allowed) {
//     const assistantMessageResult = await saveChatMessage(supabase, {
//       session_id: sessionResult.data.id,
//       user_id: user.id,
//       role: "assistant",
//       content: globalLlmRateLimitResult.message,
//       provider_used: "rate_limit",
//     });

//     if (!assistantMessageResult.ok) {
//       return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
//     }

//     return NextResponse.json({
//       sessionId: sessionResult.data.id,
//       userMessage: userMessageResult.data,
//       assistantMessage: assistantMessageResult.data,
//       provider: "rate_limit",
//       cached: false,
//       contextSource: "rate_limit",
//     });
//   }

//   const prompt =
//     answerContextSource === "knowledge"
//       ? buildCollegeHelpdeskPrompt({
//           question: validatedMessage.value,
//           collegeContext: answerContext,
//         })
//       : answerContextSource === "web_search"
//         ? buildWebSearchHelpdeskPrompt({
//             question: validatedMessage.value,
//             webSearchContext: answerContext,
//           })
//         : buildGeneralAiFallbackPrompt({
//             question: validatedMessage.value,
//           });

//   const llmResult = await generateWithRouter({
//     prompt,
//   });

//   const providerLogResult = await saveProviderAttemptLogs(
//     user.id,
//     llmResult.attempts
//   );

//   if (!providerLogResult.ok) {
//     console.warn("Provider log save failed:", providerLogResult.error);
//   }

//   const providerUsed =
//     answerContextSource === "web_search"
//       ? `web_search_${llmResult.providerUsed}`
//       : answerContextSource === "ai_fallback"
//         ? `ai_fallback_${llmResult.providerUsed}`
//         : llmResult.providerUsed;

//   const assistantMessageResult = await saveChatMessage(supabase, {
//     session_id: sessionResult.data.id,
//     user_id: user.id,
//     role: "assistant",
//     content: llmResult.text,
//     provider_used: providerUsed,
//   });

//   if (!assistantMessageResult.ok) {
//     return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
//   }

//   const sourceType: Exclude<AnswerSourceType, "cache"> =
//     answerContextSource === "knowledge" ? "knowledge" : "llm";

//   if (llmResult.success && answerContextSource === "knowledge") {
//     const cacheSaveResult = await saveAnswerCache({
//       originalQuestion: validatedMessage.value,
//       answer: llmResult.text,
//       sourceType,
//       providerUsed,
//     });

//     if (!cacheSaveResult.ok) {
//       console.warn("Answer cache save failed:", cacheSaveResult.error);
//     }
//   }

//   return NextResponse.json({
//     sessionId: sessionResult.data.id,
//     userMessage: userMessageResult.data,
//     assistantMessage: assistantMessageResult.data,
//     provider: providerUsed,
//     cached: false,
//     contextSource: answerContextSource,
//   });
// }

// export async function POST(request: Request) {
//   try {
//     return await handleChatRequest(request);
//   } catch (error) {
//     console.error("Unexpected chat API error:", error);

//     return errorResponse(CHAT_ERROR_MESSAGES.unexpected, 500);
//   }
// }

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isGuestChatEnabled } from "@/lib/auth/guestChat";
import {
  getCachedAnswerForQuestion,
  saveAnswerCache,
} from "@/lib/db/answerCache";
import { getOwnedChatSessionById } from "@/lib/db/chatSessions";
import { saveChatMessage } from "@/lib/db/chatMessages";
import { saveProviderAttemptLogs } from "@/lib/db/providerLogs";
import {
  buildCollegeHelpdeskPrompt,
  buildGeneralAiFallbackPrompt,
  buildWebSearchHelpdeskPrompt,
} from "@/lib/llm/prompt";
import { generateWithRouter } from "@/lib/llm/router";
import { retrieveKnowledgeForQuestion } from "@/lib/rag/retrieveKnowledge";
import { checkGlobalLlmRateLimit } from "@/lib/rate-limit/globalRateLimit";
import { checkUserRateLimit } from "@/lib/rate-limit/userRateLimit";
import { validateChatMessageInput } from "@/lib/safety/validateInput";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { retrieveWebSearchForQuestion } from "@/lib/web-search/retrieveWebSearch";
import type { ChatMessageItem } from "@/types/chat";
import type { AnswerSourceType, Database } from "@/types/database";

const CHAT_ERROR_MESSAGES = {
  loginRequired: "You must be logged in to send a message.",
  invalidRequestBody: "Invalid request body.",
  sessionRequired: "Chat session is required.",
  userMessageSaveFailed: "Your message could not be saved. Please try again.",
  assistantMessageSaveFailed:
    "The assistant response could not be saved. Please try again.",
  guestChatDisabled: "Guest chat is not enabled.",
  unexpected:
    "Chat is temporarily unavailable. Please refresh the page or try again shortly.",
};

type AnswerContextSource = "knowledge" | "web_search" | "ai_fallback";
type DbClient = SupabaseClient<Database>;

function errorResponse(
  message: string,
  status: number,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: message,
      ...extra,
    },
    {
      status,
    }
  );
}

function validateGuestClientId(value: unknown) {
  if (typeof value !== "string") {
    return {
      ok: false as const,
      error: "Guest session identity is required.",
    };
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length < 8 || trimmedValue.length > 120) {
    return {
      ok: false as const,
      error: "Guest session identity is invalid.",
    };
  }

  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedValue)) {
    return {
      ok: false as const,
      error: "Guest session identity is invalid.",
    };
  }

  return {
    ok: true as const,
    value: trimmedValue,
  };
}

function createLocalChatMessage({
  role,
  content,
  providerUsed = null,
}: {
  role: "user" | "assistant";
  content: string;
  providerUsed?: string | null;
}): ChatMessageItem {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
    providerUsed,
  };
}

async function buildAnswerContext({
  supabase,
  question,
}: {
  supabase: DbClient;
  question: string;
}) {
  let collegeContext = "";
  let answerContextSource: AnswerContextSource = "ai_fallback";

  try {
    const knowledgeResult = await retrieveKnowledgeForQuestion(
      supabase,
      question
    );

    if (knowledgeResult.ok) {
      collegeContext = knowledgeResult.context;
    } else {
      console.warn("Knowledge retrieval failed:", knowledgeResult.error);
    }
  } catch (error) {
    console.warn("Knowledge retrieval threw an error:", error);
  }

  const hasVerifiedKnowledgeContext = collegeContext.trim().length > 0;

  if (hasVerifiedKnowledgeContext) {
    return {
      answerContext: collegeContext,
      answerContextSource: "knowledge" as const,
    };
  }

  try {
    const webSearchResult = await retrieveWebSearchForQuestion(question);

    if (webSearchResult.ok) {
      return {
        answerContext: webSearchResult.context,
        answerContextSource: "web_search" as const,
      };
    }

    console.warn("Web search fallback unavailable:", webSearchResult.error);
  } catch (error) {
    console.warn("Web search fallback threw an error:", error);
  }

  return {
    answerContext: "",
    answerContextSource,
  };
}

function buildPromptForContext({
  question,
  answerContext,
  answerContextSource,
}: {
  question: string;
  answerContext: string;
  answerContextSource: AnswerContextSource;
}) {
  if (answerContextSource === "knowledge") {
    return buildCollegeHelpdeskPrompt({
      question,
      collegeContext: answerContext,
    });
  }

  if (answerContextSource === "web_search") {
    return buildWebSearchHelpdeskPrompt({
      question,
      webSearchContext: answerContext,
    });
  }

  return buildGeneralAiFallbackPrompt({
    question,
  });
}

async function handleGuestChatRequest({
  supabase,
  parsedBody,
  message,
}: {
  supabase: DbClient;
  parsedBody: {
    sessionId?: unknown;
    guestClientId?: unknown;
  };
  message: string;
}) {
  if (!isGuestChatEnabled()) {
    return errorResponse(CHAT_ERROR_MESSAGES.guestChatDisabled, 403);
  }

  const requestedSessionId =
    typeof parsedBody.sessionId === "string" ? parsedBody.sessionId.trim() : "";

  if (!requestedSessionId) {
    const guestClientIdResult = validateGuestClientId(parsedBody.guestClientId);

    if (!guestClientIdResult.ok) {
      return errorResponse(guestClientIdResult.error, 400);
    }
  }

  const sessionId = requestedSessionId || `guest-${crypto.randomUUID()}`;

  const userMessage = createLocalChatMessage({
    role: "user",
    content: message,
  });

  const globalLlmRateLimitResult = await checkGlobalLlmRateLimit(null);

  if (!globalLlmRateLimitResult.allowed) {
    return NextResponse.json({
      sessionId,
      userMessage,
      assistantMessage: createLocalChatMessage({
        role: "assistant",
        content: globalLlmRateLimitResult.message,
        providerUsed: "rate_limit",
      }),
      provider: "rate_limit",
      cached: false,
      contextSource: "rate_limit",
    });
  }

  const adminClient = createAdminClient();
  const guestDbClient = adminClient ?? supabase;

  const { answerContext, answerContextSource } = await buildAnswerContext({
    supabase: guestDbClient,
    question: message,
  });

  const prompt = buildPromptForContext({
    question: message,
    answerContext,
    answerContextSource,
  });

  const llmResult = await generateWithRouter({
    prompt,
  });

  const providerUsed =
    answerContextSource === "web_search"
      ? `web_search_${llmResult.providerUsed}`
      : answerContextSource === "ai_fallback"
        ? `ai_fallback_${llmResult.providerUsed}`
        : llmResult.providerUsed;

  return NextResponse.json({
    sessionId,
    userMessage,
    assistantMessage: createLocalChatMessage({
      role: "assistant",
      content: llmResult.text,
      providerUsed,
    }),
    provider: providerUsed,
    cached: false,
    contextSource: answerContextSource,
  });
}

async function handleChatRequest(request: Request) {
  const supabase = await createClient();

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(CHAT_ERROR_MESSAGES.invalidRequestBody, 400);
  }

  const parsedBody = body as {
    message?: unknown;
    sessionId?: unknown;
    isGuestMode?: unknown;
    guestClientId?: unknown;
  };

  const validatedMessage = validateChatMessageInput(parsedBody.message);

  if (!validatedMessage.ok) {
    return errorResponse(validatedMessage.error, 400);
  }

  const wantsGuestMode = parsedBody.isGuestMode === true;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    if (wantsGuestMode) {
      return handleGuestChatRequest({
        supabase,
        parsedBody,
        message: validatedMessage.value,
      });
    }

    return errorResponse(CHAT_ERROR_MESSAGES.loginRequired, 401);
  }

  const activeUserId = user.id;

  const requestedSessionId =
    typeof parsedBody.sessionId === "string" ? parsedBody.sessionId.trim() : "";

  if (!requestedSessionId) {
    return errorResponse(CHAT_ERROR_MESSAGES.sessionRequired, 400);
  }

  const sessionResult = await getOwnedChatSessionById(
    supabase,
    activeUserId,
    requestedSessionId
  );

  if (!sessionResult.ok) {
    return errorResponse(sessionResult.error, 404);
  }

  const userRateLimitResult = await checkUserRateLimit(supabase, activeUserId);

  if (!userRateLimitResult.allowed) {
    return errorResponse(userRateLimitResult.message, 429, {
      retryAfterSeconds: userRateLimitResult.retryAfterSeconds,
    });
  }

  const cachedAnswerResult = await getCachedAnswerForQuestion(
    validatedMessage.value
  );

  if (!cachedAnswerResult.ok) {
    console.warn("Answer cache lookup failed:", cachedAnswerResult.error);
  }

  if (cachedAnswerResult.ok && cachedAnswerResult.data) {
    const userMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: activeUserId,
      role: "user",
      content: validatedMessage.value,
      provider_used: null,
    });

    if (!userMessageResult.ok) {
      return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
    }

    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: activeUserId,
      role: "assistant",
      content: cachedAnswerResult.data.answer,
      provider_used: "cache",
    });

    if (!assistantMessageResult.ok) {
      return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
    }

    return NextResponse.json({
      sessionId: sessionResult.data.id,
      userMessage: userMessageResult.data,
      assistantMessage: assistantMessageResult.data,
      provider: "cache",
      cached: true,
      contextSource: "cache",
    });
  }

  const userMessageResult = await saveChatMessage(supabase, {
    session_id: sessionResult.data.id,
    user_id: activeUserId,
    role: "user",
    content: validatedMessage.value,
    provider_used: null,
  });

  if (!userMessageResult.ok) {
    return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
  }

  const { answerContext, answerContextSource } = await buildAnswerContext({
    supabase,
    question: validatedMessage.value,
  });

  const globalLlmRateLimitResult = await checkGlobalLlmRateLimit(activeUserId);

  if (!globalLlmRateLimitResult.allowed) {
    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: activeUserId,
      role: "assistant",
      content: globalLlmRateLimitResult.message,
      provider_used: "rate_limit",
    });

    if (!assistantMessageResult.ok) {
      return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
    }

    return NextResponse.json({
      sessionId: sessionResult.data.id,
      userMessage: userMessageResult.data,
      assistantMessage: assistantMessageResult.data,
      provider: "rate_limit",
      cached: false,
      contextSource: "rate_limit",
    });
  }

  const prompt = buildPromptForContext({
    question: validatedMessage.value,
    answerContext,
    answerContextSource,
  });

  const llmResult = await generateWithRouter({
    prompt,
  });

  const providerLogResult = await saveProviderAttemptLogs(
    activeUserId,
    llmResult.attempts
  );

  if (!providerLogResult.ok) {
    console.warn("Provider log save failed:", providerLogResult.error);
  }

  const providerUsed =
    answerContextSource === "web_search"
      ? `web_search_${llmResult.providerUsed}`
      : answerContextSource === "ai_fallback"
        ? `ai_fallback_${llmResult.providerUsed}`
        : llmResult.providerUsed;

  const assistantMessageResult = await saveChatMessage(supabase, {
    session_id: sessionResult.data.id,
    user_id: activeUserId,
    role: "assistant",
    content: llmResult.text,
    provider_used: providerUsed,
  });

  if (!assistantMessageResult.ok) {
    return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
  }

  const sourceType: Exclude<AnswerSourceType, "cache"> =
    answerContextSource === "knowledge" ? "knowledge" : "llm";

  if (llmResult.success && answerContextSource === "knowledge") {
    const cacheSaveResult = await saveAnswerCache({
      originalQuestion: validatedMessage.value,
      answer: llmResult.text,
      sourceType,
      providerUsed,
    });

    if (!cacheSaveResult.ok) {
      console.warn("Answer cache save failed:", cacheSaveResult.error);
    }
  }

  return NextResponse.json({
    sessionId: sessionResult.data.id,
    userMessage: userMessageResult.data,
    assistantMessage: assistantMessageResult.data,
    provider: providerUsed,
    cached: false,
    contextSource: answerContextSource,
  });
}

export async function POST(request: Request) {
  try {
    return await handleChatRequest(request);
  } catch (error) {
    console.error("Unexpected chat API error:", error);

    return errorResponse(CHAT_ERROR_MESSAGES.unexpected, 500);
  }
}