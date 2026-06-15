import { ActivityIcon } from "@/components/common/Icons";
import styles from "./ProviderStatus.module.css";

type ProviderStatusProps = {
  status: "ready" | "thinking";
};

export function ProviderStatus({ status }: ProviderStatusProps) {
  const isThinking = status === "thinking";

  return (
    <div
      className={`${styles.status} ${isThinking ? styles.thinking : ""}`}
      aria-live="polite"
    >
      <ActivityIcon size={16} />
      <span>{isThinking ? "Generating response" : "Ready"}</span>
    </div>
  );
}
