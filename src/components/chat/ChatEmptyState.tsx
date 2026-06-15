import { SuggestedQuestions } from "./SuggestedQuestions";
import styles from "./ChatEmptyState.module.css";

type ChatEmptyStateProps = {
  onSelectQuestion: (question: string) => void;
};

export function ChatEmptyState({ onSelectQuestion }: ChatEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon} aria-hidden="true">
        AI
      </div>

      <h2>How can the college helpdesk assist you?</h2>

      <p>
        Ask a question about academic rules, exams, library access, LMS support,
        fee payment, or placement assistance.
      </p>

      <SuggestedQuestions onSelectQuestion={onSelectQuestion} />
    </div>
  );
}