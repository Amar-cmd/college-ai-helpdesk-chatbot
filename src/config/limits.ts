function getPositiveNumber(value: string | undefined, fallback: number) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return fallback;
  }

  return parsedValue;
}

export function getLlmTimeoutMs() {
  return getPositiveNumber(process.env.LLM_TIMEOUT_MS, 15000);
}

export function getMaxUserQuestionsPerMinute() {
  return getPositiveNumber(process.env.MAX_USER_QUESTIONS_PER_MINUTE, 3);
}

export function getMaxUserQuestionsPerHour() {
  return getPositiveNumber(process.env.MAX_USER_QUESTIONS_PER_HOUR, 20);
}

export function getMaxGlobalLlmCallsPerMinute() {
  return getPositiveNumber(process.env.MAX_GLOBAL_LLM_CALLS_PER_MINUTE, 15);
}