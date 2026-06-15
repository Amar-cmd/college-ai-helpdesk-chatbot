import styles from "./ProviderStatus.module.css";

type ProviderStatusProps = {
  status: "ready" | "thinking";
};

export function ProviderStatus({ status }: ProviderStatusProps) {
  const isThinking = status === "thinking";

  return (
    <div className={styles.status} aria-live="polite">
      <span
        className={`${styles.dot} ${isThinking ? styles.busyDot : styles.readyDot}`}
      />
      <span>{isThinking ? "Assistant is preparing a response" : "Chat UI is ready"}</span>
    </div>
  );
}