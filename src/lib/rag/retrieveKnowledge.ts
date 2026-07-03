import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, KnowledgeBaseItem } from "@/types/database";
import { rankKnowledgeItemsByQuestion } from "./keywordSearch";

type RetrieveKnowledgeResult =
  | {
      ok: true;
      context: string;
      items: KnowledgeBaseItem[];
    }
  | {
      ok: false;
      context: "";
      items: [];
      error: string;
    };

function formatKnowledgeContext(items: KnowledgeBaseItem[]) {
  if (items.length === 0) {
    return "";
  }

  return items
    .map((item, index) => {
      return [
        `Source ${index + 1}: ${item.title}`,
        `Category: ${item.category}`,
        item.tags.length > 0 ? `Tags: ${item.tags.join(", ")}` : null,
        `Content: ${item.content}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");
}

export async function retrieveKnowledgeForQuestion(
  supabase: SupabaseClient<Database>,
  question: string
): Promise<RetrieveKnowledgeResult> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select(
      "id, title, content, category, tags, is_active, created_by, created_at, updated_at"
    )
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(300);

  if (error) {
    return {
      ok: false,
      context: "",
      items: [],
      error: error.message,
    };
  }

  const rankedItems = rankKnowledgeItemsByQuestion(question, data, 5);

  return {
    ok: true,
    context: formatKnowledgeContext(rankedItems),
    items: rankedItems,
  };
}