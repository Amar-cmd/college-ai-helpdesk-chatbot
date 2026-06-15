export type UserRole = "student" | "admin";
export type ChatMessageRole = "user" | "assistant" | "system";

export type LLMProviderLogStatus =
  | "success"
  | "failed"
  | "rate_limited"
  | "timeout"
  | "auth_error"
  | "server_error"
  | "unknown_error";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  email: string;
  full_name?: string | null;
  role?: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type ProfileUpdate = {
  email?: string;
  full_name?: string | null;
  role?: UserRole;
  updated_at?: string;
};

export type ChatSession = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ChatSessionInsert = {
  id?: string;
  user_id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
};

export type ChatSessionUpdate = {
  title?: string;
  updated_at?: string;
};

export type ChatMessage = {
  id: string;
  session_id: string;
  user_id: string;
  role: ChatMessageRole;
  content: string;
  provider_used: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessageInsert = {
  id?: string;
  session_id: string;
  user_id: string;
  role: ChatMessageRole;
  content: string;
  provider_used?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ChatMessageUpdate = {
  content?: string;
  provider_used?: string | null;
  updated_at?: string;
};

export type LLMProviderLog = {
  id: string;
  user_id: string | null;
  provider_name: string;
  model_name: string | null;
  status: LLMProviderLogStatus;
  latency_ms: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export type LLMProviderLogInsert = {
  id?: string;
  user_id?: string | null;
  provider_name: string;
  model_name?: string | null;
  status: LLMProviderLogStatus;
  latency_ms?: number;
  error_message?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LLMProviderLogUpdate = {
  status?: LLMProviderLogStatus;
  latency_ms?: number;
  error_message?: string | null;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };

      chat_sessions: {
        Row: ChatSession;
        Insert: ChatSessionInsert;
        Update: ChatSessionUpdate;
        Relationships: [];
      };

      chat_messages: {
        Row: ChatMessage;
        Insert: ChatMessageInsert;
        Update: ChatMessageUpdate;
        Relationships: [];
      };

      llm_provider_logs: {
        Row: LLMProviderLog;
        Insert: LLMProviderLogInsert;
        Update: LLMProviderLogUpdate;
        Relationships: [];
      };
    };

    Views: Record<string, never>;

    Functions: {
      is_admin: {
        Args: {
          user_id: string;
        };
        Returns: boolean;
      };
    };

    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};