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
import {
  buildNoVerifiedKnowledgeAnswer,
  shouldUseNoVerifiedKnowledgeAnswer,
} from "@/lib/safety/collegeGuardrails";
import { validateChatMessageInput } from "@/lib/safety/validateInput";
import { createClient } from "@/lib/supabase/server";
import type { AnswerSourceType } from "@/types/database";
import { checkGlobalLlmRateLimit } from "@/lib/rate-limit/globalRateLimit";
import { checkUserRateLimit } from "@/lib/rate-limit/userRateLimit";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      {
        error: "You must be logged in to send a message.",
      },
      {
        status: 401,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid request body.",
      },
      {
        status: 400,
      },
    );
  }

  const parsedBody = body as {
    message?: unknown;
    sessionId?: unknown;
  };

  const validatedMessage = validateChatMessageInput(parsedBody.message);

  if (!validatedMessage.ok) {
    return NextResponse.json(
      {
        error: validatedMessage.error,
      },
      {
        status: 400,
      },
    );
  }

  if (
    typeof parsedBody.sessionId !== "string" ||
    !parsedBody.sessionId.trim()
  ) {
    return NextResponse.json(
      {
        error: "Chat session is required.",
      },
      {
        status: 400,
      },
    );
  }

  const sessionResult = await getOwnedChatSessionById(
    supabase,
    user.id,
    parsedBody.sessionId,
  );

  if (!sessionResult.ok) {
    return NextResponse.json(
      {
        error: sessionResult.error,
      },
      {
        status: 404,
      },
    );
  }

const userRateLimitResult = await checkUserRateLimit(supabase, user.id);

  if (!userRateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: userRateLimitResult.message,
        retryAfterSeconds: userRateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
      },
    );
  }

  const cachedAnswerResult = await getCachedAnswerForQuestion(
    validatedMessage.value,
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
      return NextResponse.json(
        {
          error: "Your message could not be saved. Please try again.",
        },
        {
          status: 500,
        },
      );
    }

    const assistantMessageResult = await saveChatMessage(supabase, {
      session_id: sessionResult.data.id,
      user_id: user.id,
      role: "assistant",
      content: cachedAnswerResult.data.answer,
      provider_used: "cache",
    });

    if (!assistantMessageResult.ok) {
      return NextResponse.json(
        {
          error: "The assistant response could not be saved. Please try again.",
        },
        {
          status: 500,
        },
      );
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
    return NextResponse.json(
      {
        error: "Your message could not be saved. Please try again.",
      },
      {
        status: 500,
      },
    );
  }

  const knowledgeResult = await retrieveKnowledgeForQuestion(
    supabase,
    validatedMessage.value,
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
      return NextResponse.json(
        {
          error: "The assistant response could not be saved. Please try again.",
        },
        {
          status: 500,
        },
      );
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
      return NextResponse.json(
        {
          error: "The assistant response could not be saved. Please try again.",
        },
        {
          status: 500,
        },
      );
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
    llmResult.attempts,
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
    return NextResponse.json(
      {
        error: "The assistant response could not be saved. Please try again.",
      },
      {
        status: 500,
      },
    );
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
