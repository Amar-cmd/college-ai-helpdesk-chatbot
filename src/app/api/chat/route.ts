import { NextResponse } from "next/server";
import { getOwnedChatSessionById } from "@/lib/db/chatSessions";
import { saveChatMessage } from "@/lib/db/chatMessages";
import { validateChatMessageInput } from "@/lib/safety/validateInput";
import { createClient } from "@/lib/supabase/server";

function createMockAssistantResponse(userMessage: string) {
  return `This is a test response from College AI Helpdesk.

Your question was: "${userMessage}"

This response has been saved to your chat history. In the next steps, this mock response will be replaced by the controlled LLM provider flow.`;
}

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
      }
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
      }
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
      }
    );
  }

  if (typeof parsedBody.sessionId !== "string" || !parsedBody.sessionId.trim()) {
    return NextResponse.json(
      {
        error: "Chat session is required.",
      },
      {
        status: 400,
      }
    );
  }

  const sessionResult = await getOwnedChatSessionById(
    supabase,
    user.id,
    parsedBody.sessionId
  );

  if (!sessionResult.ok) {
    return NextResponse.json(
      {
        error: sessionResult.error,
      },
      {
        status: 404,
      }
    );
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
      }
    );
  }

  const assistantMessageResult = await saveChatMessage(supabase, {
    session_id: sessionResult.data.id,
    user_id: user.id,
    role: "assistant",
    content: createMockAssistantResponse(validatedMessage.value),
    provider_used: "mock",
  });

  if (!assistantMessageResult.ok) {
    return NextResponse.json(
      {
        error: "The assistant response could not be saved. Please try again.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    sessionId: sessionResult.data.id,
    userMessage: userMessageResult.data,
    assistantMessage: assistantMessageResult.data,
  });
}