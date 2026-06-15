import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatSession, Database } from "@/types/database";

type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export async function getOwnedChatSessionById(
  supabase: SupabaseClient<Database>,
  userId: string,
  sessionId: string
): Promise<DbResult<ChatSession>> {
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("id, user_id, title, created_at, updated_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data) {
    return {
      ok: false,
      error: "Chat session was not found.",
    };
  }

  return {
    ok: true,
    data,
  };
}

export async function getOrCreateDefaultChatSession(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<DbResult<ChatSession>> {
  const { data: existingSession, error: existingSessionError } = await supabase
    .from("chat_sessions")
    .select("id, user_id, title, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingSessionError) {
    return {
      ok: false,
      error: existingSessionError.message,
    };
  }

  if (existingSession) {
    return {
      ok: true,
      data: existingSession,
    };
  }

  const { data: createdSession, error: createSessionError } = await supabase
    .from("chat_sessions")
    .insert({
      user_id: userId,
      title: "New chat",
    })
    .select("id, user_id, title, created_at, updated_at")
    .single();

  if (createSessionError) {
    return {
      ok: false,
      error: createSessionError.message,
    };
  }

  return {
    ok: true,
    data: createdSession,
  };
}