import { FormEvent, KeyboardEvent, useState } from "react";
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

      const form = event.currentTarget.form;
      form?.requestSubmit();
    }
  }

  return (
    <form className={styles.inputShell} onSubmit={handleSubmit}>
      <div className={styles.textareaWrap}>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about attendance, exams, library, fees, LMS, or placement support."
          maxLength={MAX_MESSAGE_LENGTH}
          rows={1}
          disabled={isLoading}
          aria-label="Ask a question"
        />

        <div className={styles.helperRow}>
          <span>Press Enter to send. Use Shift + Enter for a new line.</span>
          <span
            className={
              remainingCharacters <= 80
                ? styles.characterWarning
                : styles.characterCount
            }
          >
            {remainingCharacters} characters left
          </span>
        </div>
      </div>

      <button type="submit" disabled={isSubmitDisabled}>
        {isLoading ? "Sending..." : "Send"}
      </button>
    </form>
  );
}