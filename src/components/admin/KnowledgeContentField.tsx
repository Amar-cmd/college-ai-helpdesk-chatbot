"use client";

import { useState } from "react";
import { MAX_KNOWLEDGE_CONTENT_LENGTH } from "@/config/knowledge";
import styles from "./KnowledgeForm.module.css";

type KnowledgeContentFieldProps = {
  defaultValue?: string;
  rows: number;
};

export function KnowledgeContentField({
  defaultValue = "",
  rows,
}: KnowledgeContentFieldProps) {
  const [content, setContent] = useState(defaultValue);

  return (
    <label className={styles.field}>
      <span>Content</span>
      <textarea
        name="content"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Write the verified college information here."
        rows={rows}
        maxLength={MAX_KNOWLEDGE_CONTENT_LENGTH}
        required
      />
      <span className={styles.characterCount} aria-live="polite">
        {content.length.toLocaleString("en-US")} /{" "}
        {MAX_KNOWLEDGE_CONTENT_LENGTH.toLocaleString("en-US")} characters
      </span>
    </label>
  );
}
