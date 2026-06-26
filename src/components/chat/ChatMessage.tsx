import type { ChatMessageItem } from "@/types/chat";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./ChatMessage.module.css";

type ChatMessageProps = {
  message: ChatMessageItem;
};

function getProviderLabel(providerUsed?: string | null) {
  if (!providerUsed) {
    return null;
  }

  const labels: Record<string, string> = {
    cache: "Cached answer",
    guardrail: "Verified information unavailable",
    rate_limit: "Traffic control",
    fallback: "Fallback response",
    gemini: "Gemini",
    groq: "Groq",
    openrouter: "OpenRouter",
    cloudflare: "Cloudflare",
  };

  return labels[providerUsed] ?? providerUsed;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const providerLabel = !isUser ? getProviderLabel(message.providerUsed) : null;

  return (
    <article
      className={`${styles.messageRow} ${
        isUser ? styles.userRow : styles.assistantRow
      }`}
      aria-label={isUser ? "User message" : "Assistant message"}
    >
      <div
        className={`${styles.messageBubble} ${
          isUser ? styles.userBubble : styles.assistantBubble
        }`}
      >
        <div className={styles.messageHeader}>
          <span>{isUser ? "You" : "IMS Helpdesk"}</span>
          <time dateTime={message.createdAt}>
            {new Intl.DateTimeFormat("en", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(message.createdAt))}
          </time>
        </div>

        <div className={styles.messageContent}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        </div>

        {/* {providerLabel ? (
          <div className={styles.sourceBadge}>Response route: {providerLabel}</div>
        ) : null} */}
      </div>
    </article>
  );
}
