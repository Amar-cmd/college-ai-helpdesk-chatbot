import type { ChatMessageItem } from "@/types/chat";
import styles from "./ChatMessage.module.css";

type ChatMessageProps = {
  message: ChatMessageItem;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

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
          <span>{isUser ? "You" : "College AI Helpdesk"}</span>
          <time dateTime={message.createdAt}>
            {new Intl.DateTimeFormat("en", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(message.createdAt))}
          </time>
        </div>

        <p className={styles.messageContent}>{message.content}</p>
      </div>
    </article>
  );
}