import { toggleKnowledgeBaseItemStatusAction } from "@/app/admin/knowledge/actions";
import type { KnowledgeBaseItem } from "@/types/database";
import { KnowledgeEditForm } from "./KnowledgeEditForm";
import styles from "./KnowledgeTable.module.css";

type KnowledgeTableProps = {
  items: KnowledgeBaseItem[];
};

export function KnowledgeTable({ items }: KnowledgeTableProps) {
  if (items.length === 0) {
    return (
      <section className={styles.card}>
        <h2>Knowledge base entries</h2>
        <p className={styles.emptyText}>
          No knowledge base entries have been added yet.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Verified content</p>
          <h2>Knowledge base entries</h2>
        </div>
        <span className={styles.count}>{items.length} entries</span>
      </div>

      <div className={styles.list}>
        {items.map((item) => (
          <article key={item.id} className={styles.item}>
            <div className={styles.itemHeader}>
              <div>
                <h3>{item.title}</h3>
                <p>
                  {item.category} · Updated{" "}
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.updated_at))}
                </p>
              </div>

              <span
                className={
                  item.is_active ? styles.activeBadge : styles.inactiveBadge
                }
              >
                {item.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className={styles.contentPreview}>{item.content}</p>

            {item.tags.length > 0 ? (
              <div className={styles.tags}>
                {item.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}

            <div className={styles.actions}>
              <form action={toggleKnowledgeBaseItemStatusAction}>
                <input name="id" type="hidden" value={item.id} />
                <input
                  name="next_is_active"
                  type="hidden"
                  value={item.is_active ? "false" : "true"}
                />
                <button type="submit">
                  {item.is_active ? "Deactivate" : "Activate"}
                </button>
              </form>

              <details className={styles.editPanel}>
                <summary>Edit entry</summary>
                <KnowledgeEditForm item={item} />
              </details>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}