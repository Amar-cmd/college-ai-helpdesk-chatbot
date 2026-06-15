import { APP_CONFIG } from "@/config/app";
import styles from "./BrandMark.module.css";

type BrandMarkProps = {
  compact?: boolean;
  inverse?: boolean;
};

export function BrandMark({
  compact = false,
  inverse = false,
}: BrandMarkProps) {
  return (
    <div
      className={`${styles.brand} ${inverse ? styles.inverse : ""}`}
      aria-label={`${APP_CONFIG.collegeName} ${APP_CONFIG.name}`}
    >
      <span className={styles.mark} aria-hidden="true">
        <span>IMS</span>
      </span>

      {!compact ? (
        <span className={styles.copy}>
          <strong>{APP_CONFIG.collegeName}</strong>
          <small>Student Helpdesk</small>
        </span>
      ) : null}
    </div>
  );
}
