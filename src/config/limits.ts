export function getLlmTimeoutMs() {
  const rawTimeout = process.env.LLM_TIMEOUT_MS;
  const parsedTimeout = Number(rawTimeout);

  if (!Number.isFinite(parsedTimeout) || parsedTimeout <= 0) {
    return 15000;
  }

  return parsedTimeout;
}