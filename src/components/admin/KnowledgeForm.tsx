"use client";

import { useActionState } from "react";
import { createKnowledgeBaseItemAction } from "@/app/admin/knowledge/actions";
import type { KnowledgeActionState } from "@/types/knowledge";
import styles from "./KnowledgeForm.module.css";

const initialState: KnowledgeActionState = {
  status: "idle",
  message: "",
};

export function KnowledgeForm() {
  const [state, formAction, isPending] = useActionState(
    createKnowledgeBaseItemAction,
    initialState
  );

  return (
    <section className={styles.card}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>Add verified information</p>
        <h2>Create knowledge base entry</h2>
        <p>
          Add official college information that the chatbot can use in later
          retrieval steps.
        </p>
      </div>

      <form action={formAction} className={styles.form}>
        <label className={styles.field}>
          <span>Title</span>
          <input
            name="title"
            placeholder="Example: Library timings"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Category</span>
          <input
            name="category"
            placeholder="Example: Library, Exams, Fees, LMS"
            defaultValue="General"
            required
          />
        </label>

        <label className={styles.field}>
          <span>Tags</span>
          <input
            name="tags"
            placeholder="Example: library, timing, facilities"
          />
        </label>

        <label className={styles.field}>
          <span>Content</span>
          <textarea
            name="content"
            placeholder="Write the verified college information here."
            rows={6}
            required
          />
        </label>

        <label className={styles.checkboxField}>
          <input name="is_active" type="checkbox" defaultChecked />
          <span>Make this entry active for chatbot retrieval</span>
        </label>

        {state.status !== "idle" ? (
          <p
            className={
              state.status === "success" ? styles.successMessage : styles.errorMessage
            }
          >
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save entry"}
        </button>
      </form>
    </section>
  );
}