import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  KnowledgeBaseItem,
  KnowledgeBaseItemInsert,
  KnowledgeBaseItemUpdate,
} from "@/types/database";

type DbResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
    };

export async function getKnowledgeBaseItems(
  supabase: SupabaseClient<Database>
): Promise<DbResult<KnowledgeBaseItem[]>> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .select(
      "id, title, content, category, tags, is_active, created_by, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data,
  };
}

export async function createKnowledgeBaseItem(
  supabase: SupabaseClient<Database>,
  item: KnowledgeBaseItemInsert
): Promise<DbResult<KnowledgeBaseItem>> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .insert(item)
    .select(
      "id, title, content, category, tags, is_active, created_by, created_at, updated_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data,
  };
}

export async function updateKnowledgeBaseItem(
  supabase: SupabaseClient<Database>,
  itemId: string,
  item: KnowledgeBaseItemUpdate
): Promise<DbResult<KnowledgeBaseItem>> {
  const { data, error } = await supabase
    .from("knowledge_base")
    .update(item)
    .eq("id", itemId)
    .select(
      "id, title, content, category, tags, is_active, created_by, created_at, updated_at"
    )
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data,
  };
}

export async function setKnowledgeBaseItemActive(
  supabase: SupabaseClient<Database>,
  itemId: string,
  isActive: boolean
): Promise<DbResult<KnowledgeBaseItem>> {
  return updateKnowledgeBaseItem(supabase, itemId, {
    is_active: isActive,
  });
}