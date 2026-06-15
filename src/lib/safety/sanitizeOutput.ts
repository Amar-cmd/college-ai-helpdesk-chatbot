import { STATIC_FALLBACK_ANSWER } from "@/lib/llm/fallback";

const MAX_ASSISTANT_OUTPUT_LENGTH = 3000;

export function sanitizeAssistantOutput(output: string | null | undefined) {
  if (!output) {
    return STATIC_FALLBACK_ANSWER;
  }

  const cleanOutput = output.trim();

  if (!cleanOutput) {
    return STATIC_FALLBACK_ANSWER;
  }

  if (cleanOutput.length <= MAX_ASSISTANT_OUTPUT_LENGTH) {
    return cleanOutput;
  }

  return `${cleanOutput.slice(0, MAX_ASSISTANT_OUTPUT_LENGTH).trim()}...`;
}