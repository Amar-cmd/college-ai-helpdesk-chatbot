"use client";

import { useActionState } from "react";
import { updateKnowledgeBaseItemAction } from "@/app/admin/knowledge/actions";
import type { KnowledgeBaseItem } from "@/types/database";
import type { KnowledgeActionState } from "@/types/knowledge";
import { KnowledgeContentField } from "./KnowledgeContentField";
import styles from "./KnowledgeForm.module.css";

const initialState: KnowledgeActionState = {
  status: "idle",
  message: "",
};

type KnowledgeEditFormProps = {
  item: KnowledgeBaseItem;
};

export function KnowledgeEditForm({ item }: KnowledgeEditFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateKnowledgeBaseItemAction,
    initialState
  );

  return (
    <form action={formAction} className={styles.form}>
      <input name="id" type="hidden" value={item.id} />

      <label className={styles.field}>
        <span>Title</span>
        <input name="title" defaultValue={item.title} required />
      </label>

      <label className={styles.field}>
        <span>Category</span>
        <input name="category" defaultValue={item.category} required />
      </label>

      <label className={styles.field}>
        <span>Tags</span>
        <input name="tags" defaultValue={item.tags.join(", ")} />
      </label>

      <KnowledgeContentField defaultValue={item.content} rows={5} />

      <label className={styles.checkboxField}>
        <input name="is_active" type="checkbox" defaultChecked={item.is_active} />
        <span>Active for chatbot retrieval</span>
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
        {isPending ? "Updating..." : "Update entry"}
      </button>
    </form>
  );
}
