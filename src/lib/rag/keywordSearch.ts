import type { KnowledgeBaseItem } from "@/types/database";
import { extractQuestionKeywords, normalizeQuestion } from "./normalizeQuestion";

type ScoredKnowledgeItem = {
  item: KnowledgeBaseItem;
  score: number;
};

function countKeywordMatches(text: string, keywords: string[]) {
  const normalizedText = normalizeQuestion(text);

  return keywords.reduce((score, keyword) => {
    return normalizedText.includes(keyword) ? score + 1 : score;
  }, 0);
}

function scoreKnowledgeItem(item: KnowledgeBaseItem, keywords: string[]) {
  const titleScore = countKeywordMatches(item.title, keywords) * 4;
  const categoryScore = countKeywordMatches(item.category, keywords) * 3;
  const tagsScore = countKeywordMatches(item.tags.join(" "), keywords) * 3;
  const contentScore = countKeywordMatches(item.content, keywords);

  return titleScore + categoryScore + tagsScore + contentScore;
}

export function rankKnowledgeItemsByQuestion(
  question: string,
  items: KnowledgeBaseItem[],
  limit = 5
) {
  const keywords = extractQuestionKeywords(question);

  if (keywords.length === 0) {
    return [];
  }

  return items
    .map<ScoredKnowledgeItem>((item) => ({
      item,
      score: scoreKnowledgeItem(item, keywords),
    }))
    .filter((entry) => entry.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}