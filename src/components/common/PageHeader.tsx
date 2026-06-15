import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  meta,
  actions,
}: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h1>{title}</h1>

        {description ? <p className={styles.description}>{description}</p> : null}
        {meta ? <p className={styles.meta}>{meta}</p> : null}
      </div>

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  );
}