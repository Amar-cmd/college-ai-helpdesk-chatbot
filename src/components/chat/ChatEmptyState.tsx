import { BookOpenIcon } from "@/components/common/Icons";
import { SuggestedQuestions } from "./SuggestedQuestions";
import styles from "./ChatEmptyState.module.css";

type ChatEmptyStateProps = {
  onSelectQuestion: (question: string) => void;
};

export function ChatEmptyState({ onSelectQuestion }: ChatEmptyStateProps) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.icon} aria-hidden="true">
        <BookOpenIcon size={28} />
      </div>

      <h2>What can AI Buddy help you with?</h2>

      <p>
        Ask about academics, exams, library access, the LMS, fees, or
        placements. Answers use information maintained by the college.
      </p>

      <SuggestedQuestions onSelectQuestion={onSelectQuestion} />
    </div>
  );
}