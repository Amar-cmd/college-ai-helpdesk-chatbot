import { NextResponse } from "next/server";
import {
  getCachedAnswerForQuestion,
  saveAnswerCache,
} from "@/lib/db/answerCache";
import { getOwnedChatSessionById } from "@/lib/db/chatSessions";
import { saveChatMessage } from "@/lib/db/chatMessages";
import { saveProviderAttemptLogs } from "@/lib/db/providerLogs";
import { buildCollegeHelpdeskPrompt } from "@/lib/llm/prompt";
import { generateWithRouter } from "@/lib/llm/router";
import { retrieveKnowledgeForQuestion } from "@/lib/rag/retrieveKnowledge";
import { checkGlobalLlmRateLimit } from "@/lib/rate-limit/globalRateLimit";
import { checkUserRateLimit } from "@/lib/rate-limit/userRateLimit";
import {
  buildNoVerifiedKnowledgeAnswer,
  shouldUseNoVerifiedKnowledgeAnswer,
} from "@/lib/safety/collegeGuardrails";
import { validateChatMessageInput } from "@/lib/safety/validateInput";
import { createClient } from "@/lib/supabase/server";
import type { AnswerSourceType } from "@/types/database";

const CHAT_ERROR_MESSAGES = {
  loginRequired: "You must be logged in to send a message.",
  invalidRequestBody: "Invalid request body.",
  sessionRequired: "Chat session is required.",
  userMessageSaveFailed: "Your message could not be saved. Please try again.",
  assistantMessageSaveFailed:
    "The assistant response could not be saved. Please try again.",
  unexpected:
    "Chat is temporarily unavailable. Please refresh the page or try again shortly.",
};

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

async function handleChatRequest(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return errorResponse(CHAT_ERROR_MESSAGES.loginRequired, 401);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return errorResponse(CHAT_ERROR_MESSAGES.invalidRequestBody, 400);
  }

  const parsedBody = body as {
    message?: unknown;
    sessionId?: unknown;
  };

  const validatedMessage = validateChatMessageInput(parsedBody.message);

  if (!validatedMessage.ok) {
    return errorResponse(validatedMessage.error, 400);
  }

  if (
    typeof parsedBody.sessionId !== "string" ||
    !parsedBody.sessionId.trim()
  ) {
    return errorResponse(CHAT_ERROR_MESSAGES.sessionRequired, 400);
  }

  const sessionResult = await getOwnedChatSessionById(
    supabase,
    user.id,
    parsedBody.sessionId
  );

  if (!sessionResult.ok) {
    return errorResponse(sessionResult.error, 404);
  }

  const userRateLimitResult = await checkUserRateLimit(supabase, user.id);

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
      user_id: user.id,
      role: "user",
      content: validatedMessage.value,
      provider_used: null,
    });

    if (!userMessageResult.ok) {
      return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
    }

    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: user.id,
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
    });
  }

  const userMessageResult = await saveChatMessage(supabase, {
    session_id: sessionResult.data.id,
    user_id: user.id,
    role: "user",
    content: validatedMessage.value,
    provider_used: null,
  });

  if (!userMessageResult.ok) {
    return errorResponse(CHAT_ERROR_MESSAGES.userMessageSaveFailed, 500);
  }

  const knowledgeResult = await retrieveKnowledgeForQuestion(
    supabase,
    validatedMessage.value
  );

  if (!knowledgeResult.ok) {
    console.warn("Knowledge retrieval failed:", knowledgeResult.error);
  }

  const collegeContext = knowledgeResult.ok ? knowledgeResult.context : "";
  const hasVerifiedKnowledgeContext = collegeContext.trim().length > 0;

  const shouldUseSafeNoContextAnswer = shouldUseNoVerifiedKnowledgeAnswer({
    question: validatedMessage.value,
    hasVerifiedKnowledgeContext,
  });

  if (shouldUseSafeNoContextAnswer) {
    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: user.id,
      role: "assistant",
      content: buildNoVerifiedKnowledgeAnswer(),
      provider_used: "guardrail",
    });

    if (!assistantMessageResult.ok) {
      return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
    }

    return NextResponse.json({
      sessionId: sessionResult.data.id,
      userMessage: userMessageResult.data,
      assistantMessage: assistantMessageResult.data,
      provider: "guardrail",
      cached: false,
    });
  }

  const globalLlmRateLimitResult = await checkGlobalLlmRateLimit(user.id);

  if (!globalLlmRateLimitResult.allowed) {
    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: user.id,
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
    });
  }

  const prompt = buildCollegeHelpdeskPrompt({
    question: validatedMessage.value,
    collegeContext,
  });

  const llmResult = await generateWithRouter({
    prompt,
  });

  const providerLogResult = await saveProviderAttemptLogs(
    user.id,
    llmResult.attempts
  );

  if (!providerLogResult.ok) {
    console.warn("Provider log save failed:", providerLogResult.error);
  }

  const assistantMessageResult = await saveChatMessage(supabase, {
    session_id: sessionResult.data.id,
    user_id: user.id,
    role: "assistant",
    content: llmResult.text,
    provider_used: llmResult.providerUsed,
  });

  if (!assistantMessageResult.ok) {
    return errorResponse(CHAT_ERROR_MESSAGES.assistantMessageSaveFailed, 500);
  }

  const sourceType: Exclude<AnswerSourceType, "cache"> =
    hasVerifiedKnowledgeContext ? "knowledge" : "llm";

  if (llmResult.success) {
    const cacheSaveResult = await saveAnswerCache({
      originalQuestion: validatedMessage.value,
      answer: llmResult.text,
      sourceType,
      providerUsed: llmResult.providerUsed,
    });

    if (!cacheSaveResult.ok) {
      console.warn("Answer cache save failed:", cacheSaveResult.error);
    }
  }

  return NextResponse.json({
    sessionId: sessionResult.data.id,
    userMessage: userMessageResult.data,
    assistantMessage: assistantMessageResult.data,
    provider: llmResult.providerUsed,
    cached: false,
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