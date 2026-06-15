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
  sessionId: string;
  initialMessages: ChatMessageItem[];
  initialError?: string | null;
};

type ChatApiResponse =
  | {
      sessionId: string;
      userMessage: ChatMessageItem;
      assistantMessage: ChatMessageItem;
    }
  | {
      error: string;
    };

export function ChatWindow({
  userEmail,
  userRole,
  sessionId,
  initialMessages,
  initialError = null,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessageItem[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialError);
  const chatBodyRef = useRef<HTMLDivElement | null>(null);

  function scrollToBottom() {
    window.setTimeout(() => {
      chatBodyRef.current?.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 50);
  }

  async function handleSendMessage(content: string) {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          message: content,
        }),
      });

      const result = (await response.json()) as ChatApiResponse;

      if (!response.ok || "error" in result) {
        const friendlyErrorMessage =
          "error" in result
            ? result.error
            : "The message could not be sent. Please try again.";

        const localUserMessage: ChatMessageItem = {
          id: crypto.randomUUID(),
          role: "user",
          content,
          createdAt: new Date().toISOString(),
        };

        const localAssistantMessage: ChatMessageItem = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: friendlyErrorMessage,
          createdAt: new Date().toISOString(),
        };

        setMessages((currentMessages) => [
          ...currentMessages,
          localUserMessage,
          localAssistantMessage,
        ]);

        setErrorMessage(null);
        scrollToBottom();
        return;
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        result.userMessage,
        result.assistantMessage,
      ]);
      scrollToBottom();
    } catch {
      const localAssistantMessage: ChatMessageItem = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "The message could not be sent. Please try again.",
        createdAt: new Date().toISOString(),
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        localAssistantMessage,
      ]);

      setErrorMessage(null);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
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

      {errorMessage ? (
        <div className={styles.errorBanner} role="alert">
          {errorMessage}
        </div>
      ) : null}

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
