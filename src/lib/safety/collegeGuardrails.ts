import { normalizeQuestion } from "@/lib/rag/normalizeQuestion";

const OFFICIAL_INFORMATION_KEYWORDS = [
  "attendance",
  "exam",
  "exams",
  "form",
  "deadline",
  "date",
  "dates",
  "fee",
  "fees",
  "payment",
  "refund",
  "admit",
  "card",
  "hall",
  "ticket",
  "result",
  "marks",
  "grade",
  "cgpa",
  "sgpa",
  "rule",
  "rules",
  "policy",
  "policies",
  "notice",
  "notices",
  "timetable",
  "schedule",
  "library",
  "timing",
  "timings",
  "lms",
  "login",
  "password",
  "placement",
  "contact",
  "phone",
  "email",
  "principal",
  "office",
  "department",
  "hostel",
  "scholarship",
  "eligibility",
  "certificate",
  "id",
];

const GENERAL_HELP_KEYWORDS = [
  "hello",
  "hi",
  "hey",
  "help",
  "who are you",
  "what can you do",
  "how can you help",
];

export const NO_VERIFIED_INFORMATION_ANSWER =
  "I do not have verified information for this in the college knowledge base yet. Please contact the relevant college office or admin.";

function includesAnyKeyword(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

export function isGeneralHelpQuestion(question: string) {
  const normalizedQuestion = normalizeQuestion(question);

  return includesAnyKeyword(normalizedQuestion, GENERAL_HELP_KEYWORDS);
}

export function isOfficialCollegeInformationQuestion(question: string) {
  const normalizedQuestion = normalizeQuestion(question);

  return includesAnyKeyword(normalizedQuestion, OFFICIAL_INFORMATION_KEYWORDS);
}

export function shouldUseNoVerifiedKnowledgeAnswer({
  question,
  hasVerifiedKnowledgeContext,
}: {
  question: string;
  hasVerifiedKnowledgeContext: boolean;
}) {
  if (hasVerifiedKnowledgeContext) {
    return false;
  }

  if (isGeneralHelpQuestion(question)) {
    return false;
  }

  return isOfficialCollegeInformationQuestion(question);
}

export function buildNoVerifiedKnowledgeAnswer() {
  return NO_VERIFIED_INFORMATION_ANSWER;
}