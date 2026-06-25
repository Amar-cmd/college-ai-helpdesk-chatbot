"use server";

import { revalidatePath } from "next/cache";
import { MAX_KNOWLEDGE_CONTENT_LENGTH } from "@/config/knowledge";
import { requireAdmin } from "@/lib/auth/requireRole";
import {
  createKnowledgeBaseItem,
  setKnowledgeBaseItemActive,
  updateKnowledgeBaseItem,
} from "@/lib/db/knowledgeBase";
import { ROUTES } from "@/lib/routes";
import { createClient } from "@/lib/supabase/server";
import type { KnowledgeActionState } from "@/types/knowledge";

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseTags(value: string) {
  const uniqueTags = new Set(
    value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
  );

  return Array.from(uniqueTags);
}

function validateKnowledgeInput(formData: FormData) {
  const title = getRequiredString(formData, "title");
  const content = getRequiredString(formData, "content");
  const category = getRequiredString(formData, "category") || "General";
  const tags = parseTags(getRequiredString(formData, "tags"));
  const isActive = formData.get("is_active") === "on";

  if (!title) {
    return {
      ok: false as const,
      error: "Title is required.",
    };
  }

  if (!content) {
    return {
      ok: false as const,
      error: "Content is required.",
    };
  }

  if (content.length > MAX_KNOWLEDGE_CONTENT_LENGTH) {
    return {
      ok: false as const,
      error: `Content cannot exceed ${MAX_KNOWLEDGE_CONTENT_LENGTH.toLocaleString("en-US")} characters.`,
    };
  }

  return {
    ok: true as const,
    value: {
      title,
      content,
      category,
      tags,
      isActive,
    },
  };
}

export async function createKnowledgeBaseItemAction(
  _previousState: KnowledgeActionState,
  formData: FormData
): Promise<KnowledgeActionState> {
  const { user } = await requireAdmin();
  const validatedInput = validateKnowledgeInput(formData);

  if (!validatedInput.ok) {
    return {
      status: "error",
      message: validatedInput.error,
    };
  }

  const supabase = await createClient();

  const result = await createKnowledgeBaseItem(supabase, {
    title: validatedInput.value.title,
    content: validatedInput.value.content,
    category: validatedInput.value.category,
    tags: validatedInput.value.tags,
    is_active: validatedInput.value.isActive,
    created_by: user.id,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "The knowledge base entry could not be created.",
    };
  }

  revalidatePath(ROUTES.adminKnowledge);

  return {
    status: "success",
    message: "Knowledge base entry created successfully.",
  };
}

export async function updateKnowledgeBaseItemAction(
  _previousState: KnowledgeActionState,
  formData: FormData
): Promise<KnowledgeActionState> {
  await requireAdmin();

  const itemId = getRequiredString(formData, "id");
  const validatedInput = validateKnowledgeInput(formData);

  if (!itemId) {
    return {
      status: "error",
      message: "Knowledge base entry ID is missing.",
    };
  }

  if (!validatedInput.ok) {
    return {
      status: "error",
      message: validatedInput.error,
    };
  }

  const supabase = await createClient();

  const result = await updateKnowledgeBaseItem(supabase, itemId, {
    title: validatedInput.value.title,
    content: validatedInput.value.content,
    category: validatedInput.value.category,
    tags: validatedInput.value.tags,
    is_active: validatedInput.value.isActive,
  });

  if (!result.ok) {
    return {
      status: "error",
      message: "The knowledge base entry could not be updated.",
    };
  }

  revalidatePath(ROUTES.adminKnowledge);

  return {
    status: "success",
    message: "Knowledge base entry updated successfully.",
  };
}

export async function toggleKnowledgeBaseItemStatusAction(formData: FormData) {
  await requireAdmin();

  const itemId = getRequiredString(formData, "id");
  const nextIsActive = getRequiredString(formData, "next_is_active") === "true";

  if (!itemId) {
    return;
  }

  const supabase = await createClient();

  const result = await setKnowledgeBaseItemActive(
    supabase,
    itemId,
    nextIsActive
  );

  if (!result.ok) {
    console.warn("Knowledge base status update failed:", result.error);
    return;
  }

  revalidatePath(ROUTES.adminKnowledge);
}
