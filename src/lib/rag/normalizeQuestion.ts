const FILLER_WORDS = new Set([
  "a",
  "an",
  "the",
  "is",
  "are",
  "am",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "can",
  "could",
  "should",
  "would",
  "will",
  "shall",
  "i",
  "me",
  "my",
  "we",
  "our",
  "you",
  "your",
  "please",
  "tell",
  "about",
  "for",
  "to",
  "of",
  "in",
  "on",
  "at",
  "and",
  "or",
]);

export function normalizeQuestion(question: string) {
  return question
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractQuestionKeywords(question: string) {
  const normalizedQuestion = normalizeQuestion(question);

  return Array.from(
    new Set(
      normalizedQuestion
        .split(" ")
        .map((word) => word.trim())
        .filter((word) => word.length >= 3)
        .filter((word) => !FILLER_WORDS.has(word))
    )
  ).slice(0, 12);
}