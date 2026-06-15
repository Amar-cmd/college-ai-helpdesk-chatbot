type BuildCollegeHelpdeskPromptInput = {
  question: string;
  collegeContext?: string;
};

export function buildCollegeHelpdeskPrompt({
  question,
  collegeContext = "",
}: BuildCollegeHelpdeskPromptInput) {
  const hasVerifiedContext = collegeContext.trim().length > 0;

  const safeContext = hasVerifiedContext
    ? collegeContext.trim()
    : "No relevant verified college knowledge base context was found for this question.";

  return `
You are College AI Helpdesk.

Answer only in English.

You must follow these rules:
1. Use the provided college context when it is relevant.
2. If the provided context does not contain the answer, clearly say that verified information is not available in the college knowledge base yet.
3. Do not invent dates, deadlines, fees, attendance rules, exam rules, contact numbers, official notices, or college policies.
4. Keep the answer short, clear, polite, and student-friendly.
5. If the question is urgent or administrative, suggest contacting the relevant college office or admin.

College Context:
${safeContext}

User Question:
${question}
`.trim();
}