import { getCacheExpiryDate } from "@/config/cache";
import { normalizeQuestionForCache } from "@/lib/rag/normalizeQuestion";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AnswerCache,
  AnswerSourceType,
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

type SaveAnswerCacheInput = {
  originalQuestion: string;
  answer: string;
  sourceType: Exclude<AnswerSourceType, "cache">;
  providerUsed: string | null;
};

const ANSWER_CACHE_SELECT_COLUMNS = `
  id,
  normalized_question,
  original_question,
  answer,
  source_type,
  provider_used,
  expires_at,
  hit_count,
  created_at,
  updated_at
` as const;

async function incrementAnswerCacheHitCount(
  cacheRow: AnswerCache
): Promise<DbResult<null>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Answer cache is not configured.",
    };
  }

  const { error } = await supabase
    .from("answer_cache")
    .update({
      hit_count: cacheRow.hit_count + 1,
    })
    .eq("id", cacheRow.id);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    data: null,
  };
}

export async function getCachedAnswerForQuestion(
  question: string
): Promise<DbResult<AnswerCache | null>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Answer cache is not configured.",
    };
  }

  const normalizedQuestion = normalizeQuestionForCache(question);

  if (!normalizedQuestion) {
    return {
      ok: true,
      data: null,
    };
  }

  const { data, error } = await supabase
    .from("answer_cache")
    .select(ANSWER_CACHE_SELECT_COLUMNS)
    .eq("normalized_question", normalizedQuestion)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  if (!data) {
    return {
      ok: true,
      data: null,
    };
  }

  const cacheRow: AnswerCache = data;

  const incrementResult = await incrementAnswerCacheHitCount(cacheRow);

  if (!incrementResult.ok) {
    console.warn("Answer cache hit count update failed:", incrementResult.error);
  }

  return {
    ok: true,
    data: cacheRow,
  };
}

export async function saveAnswerCache({
  originalQuestion,
  answer,
  sourceType,
  providerUsed,
}: SaveAnswerCacheInput): Promise<DbResult<AnswerCache>> {
  const supabase = createAdminClient();

  if (!supabase) {
    return {
      ok: false,
      error: "Answer cache is not configured.",
    };
  }

  const normalizedQuestion = normalizeQuestionForCache(originalQuestion);

  if (!normalizedQuestion) {
    return {
      ok: false,
      error: "Normalized question is empty.",
    };
  }

  const { data, error } = await supabase
    .from("answer_cache")
    .upsert(
      {
        normalized_question: normalizedQuestion,
        original_question: originalQuestion,
        answer,
        source_type: sourceType,
        provider_used: providerUsed,
        expires_at: getCacheExpiryDate().toISOString(),
        hit_count: 0,
      },
      {
        onConflict: "normalized_question",
      }
    )
    .select(ANSWER_CACHE_SELECT_COLUMNS)
    .single();

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  const cacheRow: AnswerCache = data;

  return {
    ok: true,
    data: cacheRow,
  };
}