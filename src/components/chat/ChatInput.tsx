import { FormEvent, KeyboardEvent, useState } from "react";
import { SendIcon } from "@/components/common/Icons";
import styles from "./ChatInput.module.css";

type ChatInputProps = {
  isLoading: boolean;
  onSendMessage: (message: string) => void;
};

const MAX_MESSAGE_LENGTH = 600;

export function ChatInput({ isLoading, onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const remainingCharacters = MAX_MESSAGE_LENGTH - message.length;
  const isSubmitDisabled = isLoading || message.trim().length === 0;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMessage = message.trim();

    if (!cleanMessage || isLoading) {
      return;
    }

    onSendMessage(cleanMessage);
    setMessage("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <form className={styles.inputShell} onSubmit={handleSubmit}>
      <div className={styles.inputRow}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a college helpdesk question."
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={isLoading}
          aria-label="Ask a question"
        />

        <button
          className={styles.sendButton}
          type="submit"
          disabled={isSubmitDisabled}
          aria-label="Send message"
        >
          <SendIcon />
          <span>{isLoading ? "Sending" : "Send"}</span>
        </button>
      </div>

      <div className={styles.helperRow}>
        <span>Enter to send · Shift + Enter for a new line</span>
        <span>AI responses may be inaccurate. Please verify important information.</span>
        <span
          className={
            remainingCharacters <= 80
              ? styles.characterWarning
              : styles.characterCount
          }
        >
          {remainingCharacters} left
        </span>
      </div>
    </form>
  );
}
