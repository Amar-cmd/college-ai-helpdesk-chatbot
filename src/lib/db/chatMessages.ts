// import type { SupabaseClient } from "@supabase/supabase-js";
// import type {
//   ChatMessage,
//   ChatMessageInsert,
//   Database,
// } from "@/types/database";
// import type { ChatMessageItem } from "@/types/chat";

// type DbResult<T> =
//   | {
//       ok: true;
//       data: T;
//     }
//   | {
//       ok: false;
//       error: string;
//     };

// export function mapChatMessageToItem(message: ChatMessage): ChatMessageItem {
//   return {
//     id: message.id,
//     role: message.role,
//     content: message.content,
//     createdAt: message.created_at,
//     providerUsed: message.provider_used,
//   };
// }

// export async function getSessionMessages(
//   supabase: SupabaseClient<Database>,
//   sessionId: string,
//   userId: string,
// ): Promise<DbResult<ChatMessageItem[]>> {
//   const { data, error } = await supabase
//     .from("chat_messages")
//     .select(
//       "id, session_id, user_id, role, content, provider_used, created_at, updated_at",
//     )
//     .eq("session_id", sessionId)
//     .eq("user_id", userId)
//     .order("created_at", { ascending: true });

//   if (error) {
//     return {
//       ok: false,
//       error: error.message,
//     };
//   }

//   return {
//     ok: true,
//     data: data.map(mapChatMessageToItem),
//   };
// }

// export async function saveChatMessage(
//   supabase: SupabaseClient<Database>,
//   message: ChatMessageInsert,
// ): Promise<DbResult<ChatMessageItem>> {
//   const { data, error } = await supabase
//     .from("chat_messages")
//     .insert(message)
//     .select(
//       "id, session_id, user_id, role, content, provider_used, created_at, updated_at",
//     )
//     .single();

//   if (error) {
//     return {
//       ok: false,
//       error: error.message,
//     };
//   }

//   return {
//     ok: true,
//     data: mapChatMessageToItem(data),
//   };
// }

// export async function countUserMessagesSince(
//   supabase: SupabaseClient<Database>,
//   userId: string,
//   since: Date,
// ): Promise<DbResult<number>> {
//   const { count, error } = await supabase
//     .from("chat_messages")
//     .select("id", {
//       count: "exact",
//       head: true,
//     })
//     .eq("user_id", userId)
//     .eq("role", "user")
//     .gte("created_at", since.toISOString());

//   if (error) {
//     return {
//       ok: false,
//       error: error.message,
//     };
//   }

//   return {
//     ok: true,
//     data: count ?? 0,
//   };
// }

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ChatMessage,
  ChatMessageInsert,
  Database,
} from "@/types/database";
import type { ChatMessageItem } from "@/types/chat";

type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export function mapChatMessageToItem(message: ChatMessage): ChatMessageItem {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.created_at,
    providerUsed: message.provider_used,
  };
}

export async function getSessionMessages(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string
): Promise<DbResult<ChatMessageItem[]>> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      "id, session_id, user_id, role, content, provider_used, created_at, updated_at"
    )
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data: data.map(mapChatMessageToItem),
  };
}

export async function saveChatMessage(
  supabase: SupabaseClient<Database>,
  message: ChatMessageInsert
): Promise<DbResult<ChatMessageItem>> {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert(message)
    .select(
      "id, session_id, user_id, role, content, provider_used, created_at, updated_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data: mapChatMessageToItem(data),
  };
}

export async function countUserMessagesSince(
  supabase: SupabaseClient<Database>,
  userId: string,
  since: Date
): Promise<DbResult<number>> {
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since.toISOString());

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

export async function countSessionUserMessagesSince(
  supabase: SupabaseClient<Database>,
  sessionId: string,
  userId: string,
  since: Date
): Promise<DbResult<number>> {
  const { count, error } = await supabase
    .from("chat_messages")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("session_id", sessionId)
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", since.toISOString());

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