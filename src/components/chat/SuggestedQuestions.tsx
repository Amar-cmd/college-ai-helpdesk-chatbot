import styles from "./SuggestedQuestions.module.css";

const SUGGESTED_QUESTIONS = [
  "What is the attendance rule?",
  "What are the library timings?",
  "How can I access the LMS?",
  "Where can I find the exam form?",
  "How do I contact the placement cell?",
  "What is the fee payment process?",
];

type SuggestedQuestionsProps = {
  onSelectQuestion: (question: string) => void;
};

export function SuggestedQuestions({ onSelectQuestion }: SuggestedQuestionsProps) {
  return (
    <div className={styles.wrapper} aria-label="Suggested questions">
      {SUGGESTED_QUESTIONS.map((question) => (
        <button
          key={question}
          type="button"
          onClick={() => onSelectQuestion(question)}
        >
          {question}
        </button>
      ))}
    </div>
  );
}