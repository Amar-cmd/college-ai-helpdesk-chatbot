export type ChatMessageRole = "user" | "assistant" | "system";

export type ChatMessageItem = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};