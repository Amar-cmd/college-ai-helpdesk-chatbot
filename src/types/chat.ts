import type { ChatMessageRole } from "./database";

export type ChatMessageItem = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt: string;
};