"use client";

import { useRef, useState } from "react";
import type { ChatMessageItem } from "@/types/chat";
import { ChatEmptyState } from "./ChatEmptyState";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { ProviderStatus } from "./ProviderStatus";
import styles from "./ChatWindow.module.css";

type ChatWindowProps = {
  userEmail: string;
  userRole: string;
};

function createMessageId() {
  return crypto.randomUUID();
}

function createMockAssistantResponse(userMessage: string) {
  return `This is a test response from College AI Helpdesk.

Your question was: "${userMessage}"

In the next steps, this response will come from the database-backed knowledge base and then from the controlled LLM provider flow.`;
}

export function ChatWindow({ userEmail, userRole }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    window.setTimeout(() => {
      chatBodyRef.current?.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  function handleSendMessage(content: string) {
    const now = new Date().toISOString();

    const userMessage: ChatMessageItem = {
      id: createMessageId(),
      role: "user",
      content,
      createdAt: now,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setIsLoading(true);
    scrollToBottom();

    window.setTimeout(() => {
      const assistantMessage: ChatMessageItem = {
        id: createMessageId(),
        role: "assistant",
        content: createMockAssistantResponse(content),
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setIsLoading(false);
      scrollToBottom();
    }, 650);
  }

  return (
    <div className={styles.chatShell}>
      <header className={styles.chatHeader}>
        <div>
          <p className={styles.eyebrow}>College AI Helpdesk</p>
          <h1>Student Support Chat</h1>
          <p className={styles.metaText}>
            Signed in as {userEmail} · Role: {userRole}
          </p>
        </div>

        <ProviderStatus status={isLoading ? "thinking" : "ready"} />
      </header>

      <div className={styles.chatBody} ref={chatBodyRef}>
        {messages.length === 0 ? (
          <ChatEmptyState onSelectQuestion={handleSendMessage} />
        ) : (
          <div className={styles.messageList}>
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {isLoading ? (
              <div className={styles.typingIndicator} aria-live="polite">
                College AI Helpdesk is typing...
              </div>
            ) : null}
          </div>
        )}
      </div>

      <ChatInput isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  );
}